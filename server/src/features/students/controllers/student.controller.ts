/**
 * Students controller.
 * Manages creating, reading, updating, and deleting student records.
 *
 * @version 0.3.0
 * @since 07.08.2025
 * @module
 */

import { Request, Response } from "express";
import pool from "../../../config/mariadb.config";
import mariadb from "mariadb";
import { QUERY } from "../queries/students.query";
import { responseHelper } from "../../../shared/utils/response_helper";
import { logRequests } from "../../../shared/utils/log_requests";
import { logError } from "../../../shared/utils/log_errors";

import {
	createStudentSchema,
	updateStudentSchema,
	studentIdParamsSchema,
} from "../../../shared/validation/student.schema";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { getStudentIdByEmail } from "../../../shared/utils/user_email_lookup";

function getChangedFields(
	existingData: Record<string, any>,
	incomingData: Record<string, any>,
): Array<{ key: string; value: any }> {
	const changedFields: Array<{
		key: string;
		value: string | null | undefined;
	}> = [];

	for (const [key, value] of Object.entries(incomingData)) {
		if (key in existingData && value !== existingData[key]) {
			changedFields.push({ key, value });
		}
	}

	return changedFields;
}

/**
 * Retrieves all student records.
 *
 * Fetches and returns all student records from the database.
 */
export const listStudents = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const students = await connection.query(QUERY.SELECT_STUDENTS);
		responseHelper.ok(res, students);
		return;
	} catch (error: unknown) {
		logError("student.controller.listStudents", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

export const listStudentProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();

		let parsed = studentIdParamsSchema.safeParse(req.params.studentId);
		if (!parsed.success) {
			responseHelper.badRequest(res);
			return;
		}
		const studentId: number = parsed.data;

		const projects_obj = await connection.query(
			`
			SELECT project_id
			FROM student_project
			WHERE student_id = ?`,
			[studentId],
		);
		const projects = projects_obj.map(
			(project: { project_id: number }) => project.project_id,
		);
		responseHelper.ok(res, projects);
		return;
	} catch (error: unknown) {
		logError("student.controller.listStudentProjects", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Creates a new student record.
 *
 * Adds a new student to the database and returns the created or existing record with ID and timestamp.
 */
export const createStudent = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let studentRaw = createStudentSchema.safeParse({
		student_name: req.user?.name,
		email: req.user?.email,
		class_code: req.body.class_code,
	});
	let connection: mariadb.PoolConnection | null = null;

	if (!studentRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const { student_name, email, class_code } = studentRaw.data;
	console.log("data:", studentRaw.data);
	try {
		connection = await pool.getConnection();
		const existingStudent = await connection.query(QUERY.STUDENT_EXISTS, [
			email,
		]);

		if (Array.isArray(existingStudent) && existingStudent.length > 0) {
			responseHelper.ok(res, existingStudent);
			return;
		}

		const new_student = await connection.query(QUERY.CREATE_STUDENT, [
			student_name?.toLowerCase(),
			email?.toLowerCase(),
			class_code || null,
		]);

		responseHelper.created(res, new_student);
		return;
	} catch (error: unknown) {
		logError("student.controller.createStudent", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Updates an existing student record.
 *
 * Modifies student data using provided fields, updating only changed values. Returns the updated record.
 */
export const updateStudent = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	let parsed = studentIdParamsSchema.safeParse(req.params.studentId);
	if (!parsed.success) {
		responseHelper.badRequest(res);
		return;
	}

	const studentId: number = parsed.data;
	try {
		connection = await pool.getConnection();

		const student = await connection.query(QUERY.SELECT_STUDENT, [studentId]);

		if (!Array.isArray(student) || student.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		const existingStudent = student[0];
		const incomingRaw = updateStudentSchema.safeParse(req.body);

		if (!incomingRaw.success) {
			responseHelper.badRequest(res);
			return;
		}

		const incomingParsed = incomingRaw.data;
		const fieldsToUpdate = getChangedFields(existingStudent, incomingParsed);
		if (fieldsToUpdate.length === 0) {
			console.log("no fields to update");
			responseHelper.ok(res);
			return;
		}

		const setClauses = fieldsToUpdate
			.map((field) => `${field.key} = ?`)
			.join(", ");
		const queryValues = [
			...fieldsToUpdate.map((field) => field.value),
			studentId,
		];

		const updateQuery = `UPDATE students SET ${setClauses} WHERE student_id = ?`;
		console.log("updateQuery", updateQuery, queryValues);
		await connection.query(updateQuery, queryValues);

		const [updated_student] = await connection.query(
			`
			SELECT student_id, student_name, email, class_code FROM students WHERE student_id = ?`,
			[studentId],
		);

		responseHelper.ok(res, updated_student);
		return;
	} catch (error: unknown) {
		logError("student.controller.updateStudent", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Deletes a student record and related data.
 *
 * Deletes a student by ID, including all associated data. Returns a success/error response.
 */
export const deleteStudent = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	let parsed = studentIdParamsSchema.safeParse(req.params.studentId);
	if (!parsed.success) {
		responseHelper.badRequest(res);
		return;
	}

	const studentId: number = parsed.data;

	try {
		connection = await pool.getConnection();

		const student = await connection.query(QUERY.SELECT_STUDENT, [studentId]);

		if (!Array.isArray(student) || student.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		await connection.query(QUERY.DELETE_STUDENT, [studentId]);
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("student.controller.deleteStudent", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Retrieves a student record using a token.
 *
 * description Fetches student data from the database using the provided token. Returns the student record.
 */
export const getCurrentStudent = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);
		if (!student_id) {
			responseHelper.unauthorized(res);
			return;
		}

		const student = await connection.query(QUERY.SELECT_STUDENT, [student_id]);

		responseHelper.ok(res, student);
		return;
	} catch (error: unknown) {
		logError("student.controller.updatedStudentReturnData", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};
