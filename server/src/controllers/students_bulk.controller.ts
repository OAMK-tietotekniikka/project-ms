import type { Request, Response } from "express";
import pool from "../config/mysql.config";

import type {
	PoolConnection,
	ResultSetHeader,
	RowDataPacket,
} from "mysql2/promise";
import { z } from "zod";
import { responseHelper } from "../domain/newResponse";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import { AuthenticatedRequest } from "../middleware/auth";

const studentSchema = z.object({
	email: z.string().email().min(8).max(100),
	student_name: z.string().min(4).max(100),
	class_code: z.string().max(16).optional(),
});

const studentArraySchema = z.object({
	students: z.array(studentSchema).min(1),
});

export const createMultipleStudents = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	const validatedStudents = studentArraySchema.safeParse(req.body);

	if (!validatedStudents.success) {
		const errors = validatedStudents.error.format();
		console.log(errors);
		responseHelper.badRequest(res); // to bad req
		return;
	}

	const students = validatedStudents.data.students;
	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();
		const emails = students.map((s) => s.email);
		const [existingStudents] = await connection.query<RowDataPacket[]>(
			"SELECT email FROM students WHERE email IN (?)",
			[emails],
		);

		const existingEmails = new Set(existingStudents.map((row) => row.email));
		const newStudents = students.filter((s) => !existingEmails.has(s.email));
		const studentsToUpdate = students.filter((s) =>
			existingEmails.has(s.email),
		);

		let created = 0;
		let updated = 0;

		// Insert new students (bulk)
		if (newStudents.length > 0) {
			const insertNew = newStudents.map((s) => [
				s.student_name?.toLowerCase(),
				s.email.toLowerCase(),
				s.class_code?.toLowerCase() || null,
			]);

			const [insertResult] = await connection.query<ResultSetHeader>(
				"INSERT INTO students (student_name, email, class_code) VALUES ?",
				[insertNew],
			);
			created = insertResult.affectedRows;
		}

		if (studentsToUpdate.length > 0) {
			// temp table
			await connection.query(`
                CREATE TEMPORARY TABLE temp_student_updates (
                    email VARCHAR(100) PRIMARY KEY,
                    student_name VARCHAR(100),
                    class_code VARCHAR(25)
                )
            `);

			try {
				const updateData = studentsToUpdate.map((s) => [
					s.email,
					s.student_name,
					s.class_code || null,
				]);

				await connection.query(
					"INSERT INTO temp_student_updates (email, student_name, class_code) VALUES ?",
					[updateData],
				);

				const [updateResult] = await connection.query<ResultSetHeader>(`
                UPDATE students s
                INNER JOIN temp_student_updates tu ON s.email = tu.email
                SET 
                    s.student_name = tu.student_name, 
                    s.class_code = COALESCE(tu.class_code, s.class_code) 
                `);
				// if the class_code is null, it will not be updated
				updated = updateResult.affectedRows;
			} finally {
				await connection.query(
					"DROP TEMPORARY TABLE IF EXISTS temp_student_updates",
				);
			}
		}

		await connection.commit();
		responseHelper.ok(res, {
			created,
			updated,
		});
		return;
	} catch (error: unknown) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (error) {
				logError("rollbackbulk", error);
			}
		}
		logError("createMultipleStudents", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};
