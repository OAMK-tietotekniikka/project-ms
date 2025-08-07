/**
 * Resources controller.
 * Manages creating, reading, updating, and allocating teacher resources.
 *
 * @version 0.3.0
 * @since 07.08.2025
 * @module
 */

import type { Request, Response } from "express";
import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import { responseHelper } from "../../../shared/utils/response_helper";
import { R_QUERY } from "../queries/resources.query";
import { QUERY } from "../queries/teachers.query";
import { logError } from "../../../shared/utils/log_errors";
import { logRequests } from "../../../shared/utils/log_requests";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { getTeacherIdByEmail } from "../../../shared/utils/user_email_lookup";
import { notifyResourceUpdate } from "../../notifications/services/notificationService";

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
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const resources = await connection.query(R_QUERY.SELECT_RESOURCES);
		responseHelper.ok(res, resources);
		return;
	} catch (error: unknown) {
		logError("teacher_resources.controller.getResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Retrieves individual teacher resources.
 *
 * Fetches resources specific to the authenticated teacher making the request and returns the list of assigned resources.
 */
export const getCurrentUserResources = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

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

		const resources = await connection.query(
			R_QUERY.SELECT_INDIVIDUAL_TEACHER_RESOURCES,
			[teacher_id],
		);
		responseHelper.ok(res, {
			teacher_id: teacher_id,
			resources,
		});
		return;
	} catch (error: unknown) {
		logError("teacher_resources.controller.getCurrentResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Retrieves resources for any teacher.
 *
 * Fetches resources by the provided teacher ID and returns the associated resource records.
 */
export const listTeacherResources = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		const { teacherId } = req.params; // TODO check
		if (!teacherId) {
			responseHelper.notFound(res);
			return;
		}

		const resources = await connection.query(
			R_QUERY.SELECT_INDIVIDUAL_TEACHER_RESOURCES,
			[teacherId],
		);
		responseHelper.ok(res, resources);
		return;
	} catch (error: unknown) {
		logError("teacher_resources.controller.listTeacherResources", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
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
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		if (total_resources >= 1) {
			const [created_resource] = await connection.query(
				R_QUERY.CREATE_RESOURCE,
				[teacher_id, total_resources, study_year],
			);

			try {
				await notifyResourceUpdate(
					parseInt(teacher_id),
					study_year,
					0,
					parseInt(total_resources),
				);
			} catch (notificationError) {}

			responseHelper.created(res, created_resource);
			return;
		}
		responseHelper.notFound(res);
		return;
	} catch (error: unknown) {
		logError("teacher_resources.controller.createResource", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
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
	let connection: mariadb.PoolConnection | null = null;

	if (!total_resources || total_resources <= 0) {
		responseHelper.conflict(res);
		return;
	}

	try {
		connection = await pool.getConnection();
		const existing_resource = await connection.query(R_QUERY.SELECT_RESOURCE, [
			req.params.resourceId,
		]);
		if (existing_resource.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		if (existing_resource[0]?.used_resources >= total_resources) {
			// cannot update if new total < used
			responseHelper.conflict(res);
			return;
		}

		await connection.query(R_QUERY.UPDATE_RESOURCE, [
			total_resources,
			req.params.resourceId,
		]);
		try {
			await notifyResourceUpdate(
				existing_resource[0].teacher_id,
				existing_resource[0].study_year,
				existing_resource[0].total_resources,
				total_resources,
			);
		} catch (notificationError) {}

		responseHelper.ok(res, {
			resource_id: req.params.resourceId,
			teacher_id: existing_resource[0].teacher_id,
			used_resources: existing_resource[0].used_resources || 0,
			total_resources: total_resources || 0,
			study_year: existing_resource[0].study_year || "",
		});
		return;
	} catch (error: unknown) {
		logError("teacher_resources.controller.updateResource", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

/**
 * Allocates a teacher to a project.
 *
 * Assigns a teacher to a project for a given study year and company context. Returns an assigned teacher_id.
 */
export const allocateTeacher = async (
	company_id: number,
	studyYear: string,
	student_id: number,
	connection: mariadb.PoolConnection,
): Promise<number> => {
	try {
		const result = await connection.query(QUERY.ALLOCATE_TEACHER, [
			student_id,
			student_id,
			company_id,
			studyYear,
		]);

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
		logError("teacher_resources.controller.allocateTeacher", error);
		throw error;
	}
};
