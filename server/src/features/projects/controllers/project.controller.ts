import { type Response, response } from "express";
import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import { responseHelper } from "../../../shared/utils/response_helper";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { QUERY } from "../queries/projects.query";
import { R_QUERY } from "../../teachers/queries/resources.query";
import { formatDate, getStudyYear } from "../../../shared/utils/date_utils";
import { logError } from "../../../shared/utils/log_errors";
import { logRequests } from "../../../shared/utils/log_requests";
import { allocateTeacher } from "../../teachers/controllers/teacher_resources.controller";
import {
	getStudentIdByEmail,
	getTeacherIdByEmail,
} from "../../../shared/utils/user_email_lookup";
import { projectSchema } from "../../../shared/validation/project.schema.";
import { notifyProjectDetailsUpdate } from "../../notifications/services/notificationService";

const MAX_STUDENT_PROJECTS = 8;

export const listProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const { studyYear } = req.query;
	if (!studyYear) {
		responseHelper.badRequest(res);
		return;
	}
	try {
		connection = await pool.getConnection();
		const projects = await connection.query(
			QUERY.SELECT_PROJECTS_BY_YEAR,
			studyYear,
		);
		responseHelper.ok(res, projects);
	} catch (error: unknown) {
		logError("project.controller.listProjects", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const exportProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	console.log("\n\n\nexporting projects");
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const projects = await connection.query(QUERY.SELECT_PROJECTS_FOR_EXPORT);
		console.log(projects);
		responseHelper.ok(res, projects);
	} catch (error: unknown) {
		logError("project.controller.exportProjects", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const getProjectStatistics = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	console.log("\n\n\nexporting projects");
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const projects = await connection.query(
			QUERY.SELECT_PROJECTS_BY_COMPANY_AND_YEAR,
		);
		responseHelper.ok(res, projects);
	} catch (error: unknown) {
		logError("project.controller.getProjectStatistics", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const createProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	let connection: mariadb.PoolConnection | null = null;

	const start_date = new Date(formatDate(new Date(req.body.start_date)));
	const end_date = new Date(formatDate(new Date(req.body.end_date)));

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

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);
		if (!student_id) {
			responseHelper.notFound(res);
			return;
		}

		const studyYear = getStudyYear(parsed.data.start_date);
		const [student] = await connection.query(
			"SELECT * FROM students WHERE student_id = ? LIMIT 1",
			[student_id],
		);

		if (!student) {
			await connection.rollback();
			responseHelper.badRequest(res);
			return;
		}
		console.log("current_projects", student.current_projects);
		if (student.current_projects >= MAX_STUDENT_PROJECTS) {
			await connection.rollback();
			console.log(MAX_STUDENT_PROJECTS, student);
			responseHelper.conflict(res);
			return;
		}

		let teacher_id: number | null = await allocateTeacher(
			parsed.data.company_id,
			studyYear,
			student_id,
			connection,
		);
		if (teacher_id === 0) teacher_id = null;

		const project = await connection.query(QUERY.CREATE_PROJECT, [
			parsed.data.project_name, // project_name
			parsed.data.project_desc, // project_desc
			teacher_id, // teacher_id
			parsed.data.company_id, // company_id
			parsed.data.project_status, // project_status
			parsed.data.project_url, // project_url
			studyYear, // study_year
			parsed.data.start_date, // start_date
			parsed.data.end_date, // end_date
		]);
		await connection.query(QUERY.CREATE_STUDENT_PROJECT, [
			student_id,
			project[0].project_id,
		]);

		// If a teacher is assigned, increment their resource usage
		if (teacher_id) {
			const resources = await connection.query(
				`SELECT * FROM resources WHERE teacher_id = ? AND study_year = ?`,
				[teacher_id, studyYear],
			);
			// Only increment if resources exist and haven't reached the limit
			if (
				resources?.length > 0 &&
				resources[0].used_resources < resources[0].total_resources
			) {
				await connection.query(R_QUERY.INCREMENT_RESOURCE_USAGE, [
					teacher_id,
					studyYear,
				]);
			}
		}
		await connection.commit();
		if (teacher_id) {
			try {
				await notifyProjectDetailsUpdate(
					parseInt(project[0].project_id),
					teacher_id,
				);
			} catch (notificationError) {}
		}
		responseHelper.created(res, project);
	} catch (error: unknown) {
		logError("project.controller.createProject", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

// Update  deleteProject function to decrement resources
export const deleteProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();

		// Get the project details before deletion to find the teacher
		const project = await connection.query(QUERY.SELECT_PROJECT, [
			req.params.projectId,
		]);

		if (!project || project.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		// Extract teacher ID and start date before deleting
		const teacherId = project[0].teacher_id;
		const startDate = new Date(project[0].start_date);

		// Delete the project and related data
		await connection.query(QUERY.DELETE_PROJECT_BY_ID, [req.params.project_id]);
		await connection.query(QUERY.DELETE_STUDENT_PROJECT_BY_PROJECT_ID, [
			req.params.project_id,
		]);
		await connection.query(QUERY.DELETE_PROJECT_NOTES_BY_PROJECT_ID, [
			req.params.project_id,
		]);

		// Decrement teacher resources if applicable
		if (teacherId) {
			const studyYear = getStudyYear(startDate);
			await connection.query(R_QUERY.DECREMENT_RESOURCE_USAGE, [
				teacherId,
				studyYear,
			]);
		}

		responseHelper.noContent(res);
		return;
	} catch (error: unknown) {
		logError("project.controller.deleteProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

export const listUserProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		const userEmail = req.user?.email || "";

		if (!userEmail) {
			responseHelper.unauthorized(res);
			return;
		}

		// try to get student ID
		const studentId = await getStudentIdByEmail(connection, userEmail);

		if (studentId) {
			// User is a student
			const projects = await connection.query(
				QUERY.SELECT_STUDENT_PROJECTS_BY_STUDENT_ID,
				[studentId],
			);
			responseHelper.ok(res, projects);
			return;
		}

		// If not a student, try to get teacher ID
		const teacherId = await getTeacherIdByEmail(connection, userEmail);

		if (teacherId) {
			// User is a teacher
			const projects = await connection.query(
				QUERY.SELECT_STUDENT_PROJECTS_BY_TEACHER_ID,
				[teacherId],
			);
			responseHelper.ok(res, projects);
			return;
		}

		// User is neither student nor teacher
		responseHelper.unauthorized(res);
		return;
	} catch (error: unknown) {
		logError("project.controller.listUserProjects", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};

export const listProjectMembers = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { projectId } = req.params;
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);

		if (student_id) {
			const [belongs] = await connection.query(
				QUERY.STUDENT_BELONGS_TO_PROJECT,
				[student_id, projectId],
			);

			if (!belongs) {
				responseHelper.notFound(res);
				return;
			}

			const members = await connection.query(QUERY.GET_PROJECT_MEMBERS, [
				projectId,
			]);
			responseHelper.ok(res, members);
			return;
		}

		const members = await connection.query(QUERY.GET_PROJECT_MEMBERS, [
			projectId,
		]);
		responseHelper.ok(res, members);
		return;
	} catch (error: unknown) {
		logError("project.controller.listProjectMembers", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const getProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const { projectId } = req.params;

		if (req.user?.role == "teacher") {
			console.log("teacher");
			const [project] = await connection.query(
				QUERY.SELECT_STUDENT_PROJECT_BY_PROJECT_ID,
				[projectId],
			);
			console.log(project);
			responseHelper.ok(res, project);
		} else if (req.user?.role == "student") {
			const student_id = await getStudentIdByEmail(
				connection,
				req.user?.email || "",
			);
			if (!student_id) {
				responseHelper.unauthorized(res);
				return;
			}
			const [project] = await connection.query(
				QUERY.SELECT_STUDENT_PROJECT_BY_STUDENT_AND_PROJECT_ID,
				[projectId, student_id],
			);
			responseHelper.ok(res, project);
		} else {
			responseHelper.unauthorized(res);
		}
	} catch (error: unknown) {
		logError("project.controller.getProjects", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};
