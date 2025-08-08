/**
 * Students bulk controller.
 *
 * Manages creating and updating student records in bulk.
 *
 * @version 0.2.1
 * @since 20.07.2025
 * @module
 */

import type { Response } from "express";
import pool from "../../../config/mariadb.config";

import mariadb from "mariadb";
import { responseHelper } from "../../../shared/utils/response_helper";
import { logError } from "../../../shared/utils/log_errors";
import { logRequests } from "../../../shared/utils/log_requests";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { batchStudentSchema } from "../../../shared/validation/student.schema";

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
	const parsed = batchStudentSchema.safeParse(req.body);

	if (!parsed.success) {
		const errors = parsed.error;
		console.log(errors);
		responseHelper.badRequest(res);
		return;
	}

	const students = parsed.data.students;
	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Prepare batch data
		const batchData = students.map((s) => [
			s.email.toLowerCase(),
			s.student_name?.toLowerCase(),
			s.class_code?.toLowerCase() || null,
		]);

		const result = await connection.batch(
			`INSERT INTO students (email, student_name, class_code) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                student_name = VALUES(student_name),
                class_code = COALESCE(VALUES(class_code), class_code)`,
			batchData,
		);

		//let created = 0;
		//let updated = 0;

		await connection.commit();
		responseHelper.ok(res, { message: "success!" });
	} catch (error: unknown) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				logError("rollbackbulk", rollbackError);
			}
		}
		logError("student_batch.controller.createMultipleStudents", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};
