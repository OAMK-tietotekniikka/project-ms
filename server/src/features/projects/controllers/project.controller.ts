import { type Response, response } from "express";
import mariadb from "mariadb";
import pool from "../../../shared/config/mariadb.config";
import { responseHelper } from "../../../shared/utils/response-helper";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { QUERY } from "../queries/projects.query";
import { R_QUERY } from "../../teachers/queries/resources.query";
import { formatDate, getStudyYear } from "../../../shared/utils/dateUtils";
import { logError } from "../../../shared/utils/logError";
import { logRequests } from "../../../shared/utils/logRequests";
import { allocateTeacher } from "../../teachers/controllers/teacher-resources.controller";
import {
	getStudentIdByEmail,
	getTeacherIdByEmail,
} from "../../../shared/utils/getUsersByEmail";

const MAX_STUDENT_PROJECTS = 8;

export const listProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const projects = await connection.query(
			QUERY.SELECT_PROJECTS,
		);
		responseHelper.ok(res, projects);
	} catch (error: unknown) {
		logError("listProjects", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const createProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let {
		project_name,
		project_desc,
		company_id,
		project_status,
		project_url,
		start_date,
		end_date,
	} = req.body;
	let connection: mariadb.PoolConnection | null = null;

	start_date = new Date(formatDate(new Date(start_date)));
	end_date = new Date(formatDate(new Date(end_date)));

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

		const studyYear = getStudyYear(start_date);
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
			company_id,
			studyYear,
			student_id,
			connection,
		);
		if (teacher_id === 0) teacher_id = null;

		const project = await connection.query(
			QUERY.CREATE_PROJECT,
			[
				project_name,   // project_name
				project_desc,   // project_desc
				teacher_id,     // teacher_id
				company_id,     // company_id
				project_status, // project_status
				project_url,    // project_url
				studyYear,      // study_year
				start_date,     // start_date
				end_date,       // end_date
			],
		);
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
		responseHelper.created(res, project);
	} catch (error: unknown) {
		logError("createProject", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

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

		const projects = await connection.query(
			QUERY.SELECT_PROJECT,
			[projectId],
		);
		if (!projects?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		const project = projects[0];
		// Check if same teacher
		if (project.teacher_id == new_teacher_id) {
			await connection.rollback();
			console.log("Same teacher assigned");
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
			console.log("No available resources", resources);
			await connection.rollback();
			responseHelper.conflict(res);
			return;
		}

		// Update resource counts - decrement old teacher's usage
		if (project.teacher_id) {
			await connection.query(
				R_QUERY.DECREMENT_RESOURCE_USAGE,
				[project.teacher_id, studyYear],
			);
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
			[new_teacher_id]
		)

		// Commit transaction
		await connection.commit();
		responseHelper.ok(res, updated_teacher);
	} catch (error) {
		// Rollback on error
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				logError("updateProjectTeacher - rollback failed", rollbackError);
			}
		}
		logError("updateProjectTeacher", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const updateProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	const { projectId } = req.params;
	const {
		project_name,
		project_desc,
		company_id,
		project_status,
		project_url,
		start_date: rawStartDate,
		end_date: rawEndDate,
	} = req.body;

	const start_date = new Date(formatDate(new Date(rawStartDate)));
	const end_date = new Date(formatDate(new Date(rawEndDate)));
	const studyYear = getStudyYear(start_date);


	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Get current project data
		const originalProject = await connection.query(
			QUERY.SELECT_PROJECT,
			[projectId],
		);

		if (!originalProject?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		// Update project
		await connection.query(QUERY.UPDATE_PROJECT, [
			project_name, // project_name
			project_desc, // project_desc
			company_id, // company_id
			project_status, // project_status
			project_url, // project_url
			studyYear, // study_year
			start_date, // start_date
			end_date, // end_date
			projectId
		]);

		await connection.commit();
		const new_company_name = await connection.query(
			`SELECT company_name FROM companies WHERE company_id = ? LIMIT 1`,
			[company_id],
		); // TODO optimize

		responseHelper.ok(res, {
			project_id: projectId,
			project_name,
			project_desc,
			company_id,
			company_name: new_company_name[0].company_name || "*",
			project_status,
			project_url,
			start_date,
			end_date,
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
		logError("updateProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		connection?.release();
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
		const project = await connection.query(
			QUERY.SELECT_PROJECT,
			[req.params.projectId],
		);

		if (!project || project.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		// Extract teacher ID and start date before deleting
		const teacherId = project[0].teacher_id;
		const startDate = new Date(project[0].start_date);

		// Delete the project and related data
		const result = await connection.query(
			QUERY.DELETE_PROJECT_BY_ID,
			[req.params.project_id],
		);
		const result2 = await connection.query(
			QUERY.DELETE_STUDENT_PROJECT_BY_PROJECT_ID,
			[req.params.project_id],
		);
		const result3 = await connection.query(
			QUERY.DELETE_PROJECT_NOTES_BY_PROJECT_ID,
			[req.params.project_id],
		);

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
		logError("deleteProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
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
		logError("listUserProjects", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const addProjectMember = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { email } = req.body;
	const { projectId } = req.params;
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(connection, email || "");
		if (!student_id) {
			responseHelper.notFound(res);
			return;
		}

		const existingAssignment = await connection.query(
			'SELECT 1 FROM student_project WHERE student_id = ? AND project_id = ?',
			[student_id, projectId]
		);

		if (existingAssignment.length > 0) {
			console.log("existingAssignment", existingAssignment);
			responseHelper.conflict(res);
			return;
		}

		const [student] = await connection.query(
			"SELECT student_id FROM students WHERE student_id = ? LIMIT 1",
			[student_id],
		);


		if (student.current_projects >= MAX_STUDENT_PROJECTS ) {
			await connection.rollback();
			responseHelper.conflict(res);
			return;
		}

		const capacityResult = await connection.query(QUERY.SELECT_PROJECT, [projectId]);
		console.log("capacityResult (is it [] or not in mdb)", capacityResult[0]);
		if (capacityResult.length === 0 || (capacityResult[0].current_students >= capacityResult[0].max_students)) {
			console.log("capacityResult");
			responseHelper.conflict(res);
			return;
		}

		await connection.query(QUERY.CREATE_STUDENT_PROJECT, [
			student_id,
			projectId,
		]);
		responseHelper.created(res);
	} catch (error: unknown) {
		logError("addStudentToProject", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
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
		const student_id = await getStudentIdByEmail(connection, req.user?.email || "");

		if (student_id) {
			const [belongs] = await connection.query(QUERY.STUDENT_BELONGS_TO_PROJECT, [
				student_id,
				projectId,
			]);

			if (!belongs) {
				responseHelper.notFound(res);
				return;
			}

			const members = await connection.query(
				QUERY.GET_PROJECT_MEMBERS,
				[projectId],
			);
			responseHelper.ok(res, members);
			return;

		}

		const members = await connection.query(
			QUERY.GET_PROJECT_MEMBERS,
			[projectId],
		);
		responseHelper.ok(res, members);
		return;


	} catch (error: unknown) {
		logError("listProjectMembers", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const updateProjectStatus = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { projectId } = req.params;
	const { project_status } = req.body;
	let connection: mariadb.PoolConnection | null = null;
	try {

		connection = await pool.getConnection(); // TODO add check if student is in the current project
		const status = await connection.query(
			QUERY.UPDATE_PROJECT_STATUS,
			[project_status, projectId],
		);
		responseHelper.ok(res, {project_status: project_status});
	} catch (error: unknown) {
		logError("updateProjectStatus", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
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
		logError("getProjects", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

