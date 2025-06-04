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
): Promise<Response> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [teachers] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHERS,
		);
		return responseHelper.ok(res, teachers);
	} catch (error: unknown) {
		logError("getTeachers", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getTeacher = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [rows] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHER_BY_EMAIL,
			[req.params.email],
		);
		if (rows.length > 0) {
			return responseHelper.ok(res, rows);
		}
		return responseHelper.notFound(res);
	} catch (error: unknown) {
		logError("getTeacher", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const createTeacher = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);
	const teacherRaw = TeacherSchema.safeParse(req.body);
	if (!teacherRaw.success) {
		return responseHelper.badRequest(res);
	}

	const teacher: Teacher = teacherRaw.data;
	const values = [teacher.teacher_name, teacher.email];

	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		await connection.query<ResultSetHeader>(QUERY.CREATE_TEACHER, values);
		return responseHelper.created(res);
	} catch (error: unknown) {
		logError("createTeacher", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getTeachersByCompany = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [rows] = await pool.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHERS_BY_COMPANY,
			[req.params.company_name],
		);
		if (rows.length > 0) {
			return responseHelper.ok(res, rows);
		}
		return responseHelper.notFound(res);
	} catch (error: unknown) {
		logError("getTeachersByCompany", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const updateTeacher = async (
	req: Request,
	res: Response,
): Promise<Response> => {
	logRequests(req);
	const teacherRaw = { ...TeacherNameSchema.safeParse(req.body) };
	let connection: PoolConnection | null = null;

	if (!teacherRaw.success) {
		return responseHelper.badRequest(res);
	}

	const name: string = teacherRaw.data?.teacher_name;

	try {
		connection = await pool.getConnection();
		await connection.query<RowDataPacket[]>(QUERY.UPDATE_TEACHER, [
			name,
			req.params.teacher_id,
		]);
		return responseHelper.ok(res);
	} catch (error: unknown) {
		logError("updateTeacher", error);
		return responseHelper.internalServerError(res);
	}
};
