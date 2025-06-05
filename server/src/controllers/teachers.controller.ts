import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import { responseHelper } from "../domain/newResponse";
import { QUERY } from "../query/teachers.query";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import {
	type Teacher,
	TeacherNameSchema,
	TeacherSchema,
} from "../validation/teacher.schema";

export const getTeachers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [teachers] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHERS,
		);
		responseHelper.ok(res, teachers);
		return;
	} catch (error: unknown) {
		logError("getTeachers", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const getTeacher = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [rows] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHER_BY_EMAIL,
			[req.params.email],
		);
		if (rows.length > 0) {
			responseHelper.ok(res, rows);
			return;
		}
		responseHelper.notFound(res);
		return;
	} catch (error: unknown) {
		logError("getTeacher", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const createTeacher = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const teacherRaw = TeacherSchema.safeParse(req.body);
	if (!teacherRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const teacher: Teacher = teacherRaw.data;
	const values = [teacher.teacher_name, teacher.email];

	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		await connection.query<ResultSetHeader>(QUERY.CREATE_TEACHER, values);
		responseHelper.created(res);
		return;
	} catch (error: unknown) {
		logError("createTeacher", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const getTeachersByCompany = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [rows] = await pool.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHERS_BY_COMPANY,
			[req.params.company_name],
		);
		if (rows.length > 0) {
			responseHelper.ok(res, rows);
			return;
		}
		responseHelper.notFound(res);
		return;
	} catch (error: unknown) {
		logError("getTeachersByCompany", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const updateTeacher = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const teacherRaw = { ...TeacherNameSchema.safeParse(req.body) };
	let connection: PoolConnection | null = null;

	if (!teacherRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const name: string = teacherRaw.data?.teacher_name;

	try {
		connection = await pool.getConnection();
		await connection.query<RowDataPacket[]>(QUERY.UPDATE_TEACHER, [
			name,
			req.params.teacher_id,
		]);
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("updateTeacher", error);
		responseHelper.internalServerError(res);
		return;
	}
};
