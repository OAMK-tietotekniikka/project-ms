import { type Response, response } from "express";
import type {
	FieldPacket,
	OkPacket,
	ResultSetHeader,
	RowDataPacket,
} from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import { responseHelper } from "../domain/newResponse";
import type { AuthenticatedRequest } from "../middleware/auth";
import { QUERY } from "../query/projects.query";
import { R_QUERY } from "../query/resources.query";
import { formatDate, getStudyYear } from "../utils/dateUtils";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import { allocateTeacher } from "./resources.controller";
import {
	getStudentIdByEmail,
	getTeacherIdByEmail,
} from "../utils/getUsersByEmail";

type ResultSet = [
	RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
	FieldPacket[],
];

export const getProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [projects] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECTS,
		);
		responseHelper.ok(res, projects);
	} catch (error: unknown) {
		logError("getProjects", error);
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
	let connection: PoolConnection | null = null;

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
		const [student] = await connection.query<RowDataPacket[]>(
			"SELECT student_id FROM students WHERE student_id = ? LIMIT 1",
			student_id,
		);
		if (student.length === 0) {
			await connection.rollback();
			responseHelper.badRequest(res);
			return;
		}

		let teacher_id: number | null = await allocateTeacher(
			company_id,
			studyYear,
			student_id,
			connection,
		);
		if (teacher_id === 0) teacher_id = null;

		const [project] = await connection.query<ResultSetHeader>(
			QUERY.CREATE_PROJECT,
			[
				project_name,
				project_desc,
				teacher_id,
				company_id,
				project_status,
				project_url,
				start_date,
				end_date,
			],
		);
		await connection.query(QUERY.CREATE_STUDENT_PROJECT, [
			student_id,
			project.insertId,
			100,
		]);
		console.log(teacher_id, project.insertId);

		// If a teacher is assigned, increment their resource usage
		if (teacher_id) {
			const [resources] = await connection.query<RowDataPacket[]>(
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
	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		const { project_id } = req.params;
		const { new_teacher_id } = req.body;

		// Validate input
		if (!project_id || !new_teacher_id) {
			await connection.rollback();
			responseHelper.badRequest(res);
			return;
		}

		const [projects] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECT,
			[project_id],
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
		const [resources] = await connection.query<RowDataPacket[]>(
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
			await connection.query<ResultSetHeader>(
				R_QUERY.DECREMENT_RESOURCE_USAGE,
				[project.teacher_id, studyYear],
			);
		}

		// Increment new teacher's usage
		await connection.query<ResultSetHeader>(R_QUERY.INCREMENT_RESOURCE_USAGE, [
			new_teacher_id,
			studyYear,
		]);

		// Update project
		await connection.query<ResultSetHeader>(
			`UPDATE projects SET teacher_id = ? WHERE project_id = ?`,
			[new_teacher_id, project_id],
		);

		// Commit transaction
		await connection.commit();
		responseHelper.ok(res, { message: "Teacher updated successfully" });
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

	const { project_id } = req.params;
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

	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Get current project data
		const [originalProject] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECT,
			[project_id],
		);

		console.log(originalProject);
		if (!originalProject?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		// Update project
		await connection.query(QUERY.UPDATE_PROJECT, [
			project_name,
			project_desc,
			company_id,
			project_status,
			project_url,
			start_date,
			end_date,
			project_id,
		]);

		await connection.commit();
		const [new_company_name] = await connection.query<RowDataPacket[]>(
			`SELECT company_name FROM companies WHERE company_id = ? LIMIT 1`,
			[company_id],
		); // TODO optimize

		responseHelper.ok(res, {
			project_id,
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
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();

		// Get the project details before deletion to find the teacher
		const [project] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECT,
			[req.params.project_id],
		);

		if (!project || project.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		// Extract teacher ID and start date before deleting
		const teacherId = project[0].teacher_id;
		const startDate = new Date(project[0].start_date);

		// Delete the project and related data
		const result: ResultSet = await connection.query(
			QUERY.DELETE_PROJECT_BY_ID,
			[req.params.project_id],
		);
		const result2: ResultSet = await connection.query(
			QUERY.DELETE_STUDENT_PROJECT_BY_PROJECT_ID,
			[req.params.project_id],
		);
		const result3: ResultSet = await connection.query(
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

export const getStudentProjects = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const id = await getStudentIdByEmail(connection, req.user?.email || "");

		if (!id) {
			responseHelper.notFound(res);
			return;
		}

		const [projects] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT_PROJECTS_BY_STUDENT_ID,
			[id],
		);
		if (projects.length === 0) {
			responseHelper.ok(res, []);
			return;
		}
		responseHelper.ok(res, projects);
		return;
	} catch (error: unknown) {
		logError("getStudentProjects", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const getTeacherProjects = async (
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

		const [projects] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT_PROJECTS_BY_TEACHER_ID,
			[id],
		);
		if (projects.length === 0) {
			responseHelper.ok(res, []);
			return;
		}
		responseHelper.ok(res, projects);
		return;
	} catch (error: unknown) {
		logError("getStudentProjectsByTeacherId", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const addStudentToProject = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { email } = req.body;
	const { project_id } = req.params;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const id = await getStudentIdByEmail(connection, email || "");
		if (!id) {
			responseHelper.notFound(res);
			return;
		}
		await connection.query<ResultSetHeader>(QUERY.CREATE_STUDENT_PROJECT, [
			id,
			project_id,
			0,
		]);
		responseHelper.created(res);
	} catch (error: unknown) {
		logError("addStudentToProject", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getProjectMembers = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { project_id } = req.params;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const id =
			(await getStudentIdByEmail(connection, req.user?.email || "")) ||
			(await getTeacherIdByEmail(connection, req.user?.email || ""));
		if (!id) {
			responseHelper.notFound(res);
			return;
		}
		const [result] = await connection.query<RowDataPacket[]>(
			QUERY.GET_PROJECT_MEMBERS,
			[project_id],
		);
		responseHelper.ok(res, result);
	} catch (error: unknown) {
		logError("getProjectMembers", error);
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
	const { project_id } = req.params;
	const { project_status } = req.body;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection(); // TODO add check if student is in the current project
		const [result] = await connection.query<ResultSetHeader>(
			QUERY.UPDATE_PROJECT_STATUS,
			[project_status, project_id],
		);
		responseHelper.ok(res, result);
	} catch (error: unknown) {
		logError("getProjectMembers", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getProjectDetails = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const { project_id } = req.params;

		if (req.user?.role == "teacher") {
			console.log("teacher");
			const [project] = await connection.query<RowDataPacket[]>(
				QUERY.SELECT_STUDENT_PROJECT_BY_PROJECT_ID,
				[project_id],
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
			const [project] = await connection.query<RowDataPacket[]>(
				QUERY.SELECT_STUDENT_PROJECT_BY_STUDENT_AND_PROJECT_ID,
				[project_id, student_id],
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

/*export const getProjectsByCompanyAndYear = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);


	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [result] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECTS_BY_COMPANY_AND_YEAR,
		);
		responseHelper.ok(res, result);
		return;
	} catch (error: unknown) {
		logError("getProjectMembers", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};*/
