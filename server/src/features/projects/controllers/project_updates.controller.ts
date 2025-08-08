/**
 * Project updates controller.
 * Manages project updates.
 *
 * @version 0.3.0
 * @since 07.08.2025
 * @module
 */

import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import type { Response } from "express";
import { logRequests } from "../../../shared/utils/log_requests";
import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import { QUERY } from "../queries/projects.query";
import { responseHelper } from "../../../shared/utils/response_helper";
import { formatDate, getStudyYear } from "../../../shared/utils/date_utils";
import { R_QUERY } from "../../teachers/queries/resources.query";
import { logError } from "../../../shared/utils/log_errors";
import { getStudentIdByEmail } from "../../../shared/utils/user_email_lookup";
import {
	notifyProjectDetailsUpdate,
	notifyProjectStatusUpdate,
	notifyProjectTeacherUpdate,
} from "../../notifications/services/notificationService";
import { projectSchema } from "../../../shared/validation/project.schema.";

export const updateProjectTeacher = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		const { projectId } = req.params;
		const { new_teacher_id } = req.body;

		// Validate input
		if (!projectId || !new_teacher_id) {
			await connection.rollback();
			responseHelper.badRequest(res);
			return;
		}

		const projects = await connection.query(QUERY.SELECT_PROJECT, [projectId]);
		if (!projects?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		const project = projects[0];
		const oldTeacherId = project.teacher_id;

		// Check if same teacher
		if (project.teacher_id == new_teacher_id) {
			await connection.rollback();
			responseHelper.conflict(res);
			return;
		}

		// Check resources for new teacher
		const studyYear = getStudyYear(project.start_date);
		const resources = await connection.query(
			`SELECT used_resources, total_resources FROM resources WHERE teacher_id = ? AND study_year = ?`,
			[new_teacher_id, studyYear],
		);

		const hasAvailableResources =
			resources?.length > 0 &&
			resources[0]?.used_resources < resources[0]?.total_resources;
		if (!hasAvailableResources && project.teacher_id) {
			await connection.rollback();
			responseHelper.conflict(res);
			return;
		}

		// Update resource counts - decrement old teacher's usage
		if (project.teacher_id) {
			await connection.query(R_QUERY.DECREMENT_RESOURCE_USAGE, [
				project.teacher_id,
				studyYear,
			]);
		}

		// Increment new teacher's usage
		await connection.query(R_QUERY.INCREMENT_RESOURCE_USAGE, [
			new_teacher_id,
			studyYear,
		]);

		// Update project
		await connection.query(
			`UPDATE projects SET teacher_id = ? WHERE project_id = ?`,
			[new_teacher_id, projectId],
		);

		const [updated_teacher] = await connection.query(
			`SELECT teacher_id, teacher_name from teachers WHERE teacher_id = ?`,
			[new_teacher_id],
		);

		// Commit transaction
		await connection.commit();
		try {
			await notifyProjectTeacherUpdate(
				parseInt(projectId),
				oldTeacherId ? parseInt(oldTeacherId) : null,
				parseInt(new_teacher_id),
			);
		} catch (notificationError) {}

		responseHelper.ok(res, updated_teacher);
	} catch (error) {
		// Rollback on error
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {}
		}
		logError("project_updates.controller.updateProjectTeacher", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const updateProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	const { projectId } = req.params;

	const start_date = new Date(formatDate(new Date(req.body.start_date)));
	const end_date = new Date(formatDate(new Date(req.body.end_date)));
	const studyYear = getStudyYear(start_date);

	const parsed = projectSchema.safeParse({
		project_name: req.body.project_name,
		project_desc: req.body.project_desc,
		project_url: req.body.project_url,
		company_id: req.body.company_id,
		project_status: req.body.project_status,
		start_date: start_date,
		end_date: end_date,
	});

	if (!parsed.success) {
		responseHelper.badRequest(res);
		return;
	}

	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Get current project data
		const originalProject = await connection.query(QUERY.SELECT_PROJECT, [
			projectId,
		]);

		if (!originalProject?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		// Update project
		await connection.query(QUERY.UPDATE_PROJECT, [
			parsed.data.project_name, // project_name
			parsed.data.project_desc, // project_desc
			parsed.data.company_id, // company_id
			parsed.data.project_status, // project_status
			parsed.data.project_url, // project_url
			studyYear, // study_year
			parsed.data.start_date, // start_date
			parsed.data.end_date, // end_date
			projectId,
		]);

		await connection.commit();
		const [new_company_name] = await connection.query(
			`SELECT company_name FROM companies WHERE company_id = ? LIMIT 1`,
			[parsed.data.company_id],
		);

		if (originalProject.teacher_id) {
			try {
				await notifyProjectDetailsUpdate(
					parseInt(projectId),
					parseInt(originalProject.teacher_id),
				);
			} catch (notificationError) {}
		}

		responseHelper.ok(res, {
			project_id: projectId,
			project_name: parsed.data.project_name,
			project_desc: parsed.data.project_desc,
			company_id: parsed.data.company_id,
			company_name: new_company_name?.company_name || "*",
			project_status: parsed.data.project_status,
			project_url: parsed.data.project_url,
			start_date: parsed.data.start_date,
			end_date: parsed.data.end_date,
		});
		return;
	} catch (error) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				logError("updateProject rollback", rollbackError);
			}
		}
		logError("project_updates.controller.updateProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		connection?.release();
	}
};

export const updateProjectStatus = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { projectId } = req.params;
	const { project_status } = req.body;
	let teacher_id;
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		if (req.user?.role === "student") {
			const student_id = await getStudentIdByEmail(
				connection,
				req.user?.email || "",
			);
			const [belongs] = await connection.query(
				QUERY.STUDENT_BELONGS_TO_PROJECT,
				[student_id, projectId],
			);
			console.log("belongs", belongs);
			if (!belongs) {
				responseHelper.unauthorized(res);
				return;
			}
		} else if (req.user?.role === "teacher") {
			[teacher_id] = await connection.query(
				`select teacher_id from projects where project_id = ?`,
				[projectId],
			);
		}
		const status = await connection.query(QUERY.UPDATE_PROJECT_STATUS, [
			project_status,
			projectId,
		]);

		if (teacher_id) {
			try {
				await notifyProjectStatusUpdate(
					parseInt(projectId),
					parseInt(teacher_id?.teacher_id),
					project_status,
				);
			} catch (notificationError) {}
		}

		responseHelper.ok(res, { project_status: project_status });
	} catch (error: unknown) {
		logError("project_updates.controller.updateProjectStatus", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};
