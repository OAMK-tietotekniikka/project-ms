/**
 * Teachers controller.
 * Manages creating, reading, and updating teacher records.
 *
 * @version 0.2.1
 * @since 20.07.2025
 * @module
 */

import type { Request, Response } from "express";
import pool from "../../../config/mariadb.config";
import mariadb from "mariadb";
import { responseHelper } from "../../../shared/utils/response_helper";
import { QUERY } from "../queries/teachers.query";
import { logError } from "../../../shared/utils/log_errors";
import { logRequests } from "../../../shared/utils/log_requests";
import {
	type Teacher,
	TeacherNameSchema,
	TeacherSchema,
} from "../../../shared/validation/teacher.schema";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { getTeacherIdByEmail } from "../../../shared/utils/user_email_lookup";
import { getStudyYear } from "../../../shared/utils/date_utils";
import { NotificationService } from "../../notifications/services/notificationService";

/**
 * Retrieves all teacher records.
 *
 * Fetches and returns a list of all teachers from the database.
 */
const notificationService = NotificationService.getInstance();

export const listTeachers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	let study_year = String(getStudyYear(new Date()));
	console.log("study_year", study_year);
	try {
		connection = await pool.getConnection();
		const teachers = await connection.query(
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
		if (connection) await connection.release();
	}
};

/**
 * Retrieves available teachers.
 *
 * Fetches a list of teachers who are currently available for allocation,
 * where used_resources is less than total_resources in the provided study year.
 * Returns the filtered list of available teachers.
 */
export const listAvailableTeachers = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const { studyYear } = req.params; // TODO available teachers for project date
	try {
		connection = await pool.getConnection();
		const teachers = await connection.query(QUERY.SELECT_AVAILABLE_TEACHERS, [
			studyYear,
		]);
		console.log(teachers);
		responseHelper.ok(res, teachers);
		return;
	} catch (error: unknown) {
		logError("listAvailableTeachers", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Retrieves the currently authenticated teacher.
 *
 * Fetches and returns the teacher profile associated with the authenticated user.
 */
export const getCurrentTeacher = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const id = await getTeacherIdByEmail(connection, req.user?.email || "");
		if (!id) {
			responseHelper.notFound(res);
			return;
		}
		const rows = await connection.query(QUERY.SELECT_TEACHER, [id]);
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
		if (connection) await connection.release();
	}
};

/**
 * Creates a new teacher record.
 *
 * Adds a new teacher to the database and returns a success / error response..
 */
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

	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const teacher_id = await getTeacherIdByEmail(connection, teacher.email);

		if (teacher_id) {
			responseHelper.conflict(res);
			return;
		}

		const [created_teacher] = await connection.query(QUERY.CREATE_TEACHER, [
			teacher.teacher_name,
			teacher.email,
		]);
		responseHelper.created(res, created_teacher);
		return;
	} catch (error: unknown) {
		logError("createTeacher", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Updates an existing teacher record.
 *
 * Modifies teacher data using the provided teacher_name.
 * Returns a success / error response.
 */
export const updateTeacher = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	let connection: mariadb.PoolConnection | null = null;
	const teacherRaw = { ...TeacherNameSchema.safeParse(req.body) };

	if (!teacherRaw.success) {
		responseHelper.badRequest(res);
		return;
	}

	const name: string = teacherRaw.data?.teacher_name;

	try {
		connection = await pool.getConnection();

		const { teacherId } = req.params;

		await connection.query(QUERY.UPDATE_TEACHER, [name, teacherId]);
		try {
			await notificationService.notifyTeacherUpdate(parseInt(teacherId), name);
		} catch (notificationError) {}
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("updateTeacher", error);
		responseHelper.internalServerError(res);
		return;
	}
};
