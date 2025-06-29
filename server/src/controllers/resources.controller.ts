/**
 * Resources controller.
 * Manages creating, reading, updating, and allocating teacher resources.
 *
 * @version 2.0.0
 * @since 29.06.2025
 * @module
 */

import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import { responseHelper } from "../domain/newResponse";
import { R_QUERY } from "../query/resources.query";
import { QUERY } from "../query/teachers.query";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import { AuthenticatedRequest } from "../middleware/auth";
import {
	getStudentIdByEmail,
	getTeacherIdByEmail,
} from "../utils/getUsersByEmail";

/**
 * Retrieves all resources.
 *
 * Fetches and returns all available resources from the database as an array of records.
 */
export const getResources = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [resources] = await connection.query<RowDataPacket[]>(
			R_QUERY.SELECT_RESOURCES,
		);
		responseHelper.ok(res, resources);
		return;
	} catch (error: unknown) {
		logError("getResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Retrieves individual teacher resources.
 *
 * Fetches resources specific to the authenticated teacher making the request and returns the list of assigned resources.
 */
export const getIndividualResources = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		const teacher_id = await getTeacherIdByEmail(
			connection,
			req.user?.email || "",
		);
		if (!teacher_id) {
			responseHelper.notFound(res);
			return;
		}

		const [resources] = await connection.query<RowDataPacket[]>(
			R_QUERY.SELECT_INDIVIDUAL_TEACHER_RESOURCES,
			[teacher_id],
		);
		responseHelper.ok(res, resources);
		return;
	} catch (error: unknown) {
		logError("getResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Retrieves resources for any teacher.
 *
 * Fetches resources by the provided teacher ID and returns the associated resource records.
 */
export const getAnyTeacherResources = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		const { teacher_id } = req.params; // TODO check
		if (!teacher_id) {
			responseHelper.notFound(res);
			return;
		}

		console.log(teacher_id);
		const [resources] = await connection.query<RowDataPacket[]>(
			R_QUERY.SELECT_INDIVIDUAL_TEACHER_RESOURCES,
			[teacher_id],
		);
		responseHelper.ok(res, resources);
		return;
	} catch (error: unknown) {
		logError("getResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Creates a new resource.
 *
 * Adds a new resource and returns a success / error response.
 */
export const createResource = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { teacher_id, total_resources, study_year } = req.body;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		if (total_resources >= 5) {
			await connection.query<ResultSetHeader>(R_QUERY.CREATE_RESOURCE, [
				teacher_id,
				total_resources,
				study_year,
			]);
			responseHelper.created(res);
			return;
		}
		responseHelper.notFound(res);
		return;
	} catch (error: unknown) {
		logError("createResource", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Updates an existing resource's total_resources value.
 *
 * Modifies the total_resources field of a specific resource. Returns a success / error response.
 */
export const updateResource = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { total_resources } = req.body;
	let connection: PoolConnection | null = null;

	if (!total_resources || total_resources <= 0) {
		responseHelper.conflict(res);
		return;
	}

	try {
		connection = await pool.getConnection();
		const [existing_resource] = await connection.query<RowDataPacket[]>(
			R_QUERY.SELECT_RESOURCE,
			[req.params.resource_id],
		);
		if (existing_resource.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		if (existing_resource[0]?.used_resources > total_resources) {
			// cannot update if new total < used
			responseHelper.conflict(res);
			return;
		}

		const result = await connection.query<ResultSetHeader>(
			R_QUERY.UPDATE_RESOURCE,
			[total_resources, req.params.resource_id],
		); // TODO check
		responseHelper.ok(res, result);
		return;
	} catch (error: unknown) {
		logError("updateResource", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Allocates a teacher to a project.
 *
 * Assigns a teacher to a project for a given study year and company context. Returns an assigned teacher_id.
 */
export const allocateTeacher = async (
	company_id: string,
	studyYear: string,
	student_id: number,
	connection: PoolConnection,
): Promise<number> => {
	try {
		const [result] = await connection.query<RowDataPacket[]>(
			QUERY.ALLOCATE_TEACHER,
			[student_id, student_id, company_id, studyYear],
		);

		if (!result || result.length === 0) {
			return 0; // 0 meaning no teacher
		}

		const selectedTeacher = result[0];
		const teacherid = selectedTeacher.teacher_id;

		const allocationReason = selectedTeacher.has_previous_projects
			? "Previous teacher assigned for continuity"
			: selectedTeacher.has_company_favorite
				? "Teacher with company preference assigned"
				: "Least utilized teacher assigned";

		console.log(
			`Teacher allocation: ${allocationReason} - Teacher ID: ${teacherid}`,
		);

		return teacherid;
	} catch (error: unknown) {
		logError("allocateTeacher", error);
		throw error;
	}
};
