import { Request, Response } from "express";
import pool from "../config/mysql.config";
import { HttpResponse } from "../domain/response";
import {
	ResultSetHeader,
	RowDataPacket,
	FieldPacket,
	PoolConnection,
} from "mysql2/promise";
import { QUERY } from "../query/students.query";
import { responseHelper } from "../domain/newResponse";
import { logRequests } from "../utils/logRequests";
import { logError } from "../utils/logError";
import { z } from "zod";

const emailValidation = z.object({
	email: z.string().email(),
});

const updateStudentSchema = z
	.object({
		email: z.string().email().min(8).max(100).optional(),
		student_name: z.string().min(4).max(100).optional(),
		class_code: z.string().optional(),
	})
	.partial();

const createStudentSchema = z
	.object({
		email: z.string().email().min(8).max(100),
		student_name: z.string().min(4).max(100),
		class_code: z.string().optional(),
	})
	.partial();

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

export const getStudents = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [students] = (await connection.query(QUERY.SELECT_STUDENTS)) as [
			RowDataPacket[],
			FieldPacket[],
		];
		return responseHelper.ok(res, students);
	} catch (error: unknown) {
		logError("getStudents", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getStudent = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);

	const parseEmail = emailValidation.safeParse(req.params);
	if (!parseEmail.success) {
		return responseHelper.badRequest(res);
	}
	const { email } = parseEmail.data;

	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [student] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT_BY_EMAIL,
			[email],
		);
		if (student.length > 0) {
			return responseHelper.ok(res, student);
		}
		return responseHelper.notFound(res);
	} catch (error: unknown) {
		logError("getStudent", error);
		throw error;
	} finally {
		if (connection) connection.release();
	}
};

export const createStudent = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let studentRaw = createStudentSchema.safeParse(req.body);
	let connection: PoolConnection | null = null;

	if (!studentRaw.success) {
		return responseHelper.badRequest(res);
	}

	const { student_name, email, class_code } = studentRaw.data;

	try {
		connection = await pool.getConnection();
		const [existingStudent] = await connection.query<RowDataPacket[]>(
			QUERY.STUDENT_EXISTS,
			[email],
		);
		if (existingStudent.length > 0) {
			return responseHelper.ok(res, existingStudent);
		}

		const [q] = await connection.query<ResultSetHeader>(QUERY.CREATE_STUDENT, [
			student_name,
			email,
			class_code || null,
		]);
		const id = q.insertId;
		const [new_student] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT,
			id,
		);

		return responseHelper.created(res, new_student);
	} catch (error: unknown) {
		logError("createStudent", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const updateStudent = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();

		const [student] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT,
			[req.params.student_id],
		);
		if (student.length === 0) {
			return responseHelper.notFound(res);
		}

		const existingStudent = student[0]; // the object itself
		const incomingRaw = updateStudentSchema.safeParse(req.body);

		if (!incomingRaw.success) {
			return responseHelper.badRequest(res);
		}

		const incomingParsed = incomingRaw.data;
		const fieldsToUpdate = getChangedFields(existingStudent, incomingParsed);
		if (fieldsToUpdate.length === 0) {
			return responseHelper.ok(res);
		}

		const setClauses = fieldsToUpdate
			.map((field) => `${field.key} = ?`)
			.join(", ");
		const queryValues = [
			...fieldsToUpdate.map((field) => field.value),
			req.params.student_id,
		];

		const updateQuery = `UPDATE students SET ${setClauses} WHERE student_id = ?`;
		await connection.query(updateQuery, queryValues);
		return responseHelper.ok(res); // can add message with student id so teachers will be notified

    } catch (error: unknown) {
		logError("updateStudent", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

// all data, !TBD
export const deleteStudent = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [student] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT,
			[req.params.student_id],
		);
		if (student.length === 0) {
			return responseHelper.notFound(res);
		}
		await connection.query(QUERY.DELETE_STUDENT, [req.params.student_id]);
		return responseHelper.ok(res);
	} catch (error: unknown) {
		logError("deleteStudent", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};
