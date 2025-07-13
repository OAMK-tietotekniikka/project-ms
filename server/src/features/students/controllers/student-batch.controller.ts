/**
 * Students bulk controller.
 *
 * Manages creating and updating student records in bulk.
 *
 * @version 2.1.0
 * @since 5.07.2025
 * @module
 */

import type { Response } from "express";
import pool from "../../../shared/config/mariadb.config";

import mariadb from "mariadb";
import { z } from "zod";
import { responseHelper } from "../../../shared/utils/response-helper";
import { logError } from "../../../shared/utils/logError";
import { logRequests } from "../../../shared/utils/logRequests";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";

const studentSchema = z.object({
	email: z.string().email().min(8).max(100),
	student_name: z.string().min(4).max(100),
	class_code: z.string().max(16).optional(),
});

const studentArraySchema = z.object({
	students: z.array(studentSchema).min(1),
});

/**
 * Creates or updates multiple students in bulk.
 *
 * Inserts new student records or updates existing ones based on email.
 * @remarks Uses transactions to keep data consistent.
 */
export const batchCreateStudents = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const validatedStudents = studentArraySchema.safeParse(req.body);

	if (!validatedStudents.success) {
		const errors = validatedStudents.error.format();
		console.log(errors);
		responseHelper.badRequest(res);
		return;
	}

	const students = validatedStudents.data.students;
	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Prepare batch data
		const batchData = students.map((s) => [
			s.email.toLowerCase(),
			s.student_name?.toLowerCase(),
			s.class_code?.toLowerCase() || null,
		]);

		// Use batch method with INSERT ... ON DUPLICATE KEY UPDATE
		const result = await connection.batch(
			`INSERT INTO students (email, student_name, class_code) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                student_name = VALUES(student_name),
                class_code = COALESCE(VALUES(class_code), class_code)`,
			batchData
		);

		// With batch(), result is an array of results for each executed statement
		let created = 0;
		let updated = 0;


		await connection.commit();
		responseHelper.ok(res, {message: "success!"});
	} catch (error: unknown) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				logError("rollbackbulk", rollbackError);
			}
		}
		logError("createMultipleStudents", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};