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
import { AuthenticatedRequest } from "../middleware/auth";
import { getTeacherIdByEmail } from "../utils/getUsersByEmail";
import { getStudyYear } from "../utils/dateUtils";
import { string } from "zod";

export const getTeachers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	let study_year = String(getStudyYear(new Date()));
	console.log("study_year", study_year);
	try {
		connection = await pool.getConnection();
		const [teachers] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHERS_AND_RESOURCES,
			[study_year],
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

export const getAvailableTeachers = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	const { study_year } = req.params; // TODO available teachers for project date
	try {
		connection = await pool.getConnection();
		const [teachers] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_AVAILABLE_TEACHERS,
			[study_year],
		);
		console.log(teachers);
		responseHelper.ok(res, teachers);
		return;
	} catch (error: unknown) {
		logError("getAvailableTeachers", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const getCurrentTeacher = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const id = await getTeacherIdByEmail(connection, req.user?.email || "");
		if (!id) {
			responseHelper.notFound(res);
			return;
		}
		const [rows] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_TEACHER,
			[id],
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
	const teacherRaw = TeacherSchema.safeParse({
		name: req.body.teacher_name,
		email: req.body.email,
	});
	if (!teacherRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const teacher: Teacher = teacherRaw.data;

	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const teacher_id = await getTeacherIdByEmail(connection, teacher.email);

		if (teacher_id) {
			responseHelper.conflict(res);
			return;
		}

		await connection.query<ResultSetHeader>(QUERY.CREATE_TEACHER, [
			teacher.name,
			teacher.email,
		]);
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
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	let connection: PoolConnection | null = null;
	const teacherRaw = { ...TeacherNameSchema.safeParse(req.body) };

	if (!teacherRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const name: string = teacherRaw.data?.teacher_name;

	try {
		connection = await pool.getConnection();

		const id = await getTeacherIdByEmail(connection, req.user?.email || "");
		if (!id) {
			responseHelper.notFound(res);
			return;
		}

		await connection.query<RowDataPacket[]>(QUERY.UPDATE_TEACHER, [name, [id]]);
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("updateTeacher", error);
		responseHelper.internalServerError(res);
		return;
	}
};
