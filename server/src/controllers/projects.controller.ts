import { type Request, type Response, response } from "express";
import type {
	FieldPacket,
	OkPacket,
	ResultSetHeader,
	RowDataPacket,
} from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import { responseHelper } from "../domain/newResponse";
import type { HttpResponse } from "../domain/response";
import type { StudentProject } from "../interface/studentProject";
import { QUERY } from "../query/projects.query";
import { R_QUERY } from "../query/resources.query";
import { formatDate, getStudyYear } from "../utils/dateUtils";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import { allocateTeacher } from "./resources.controller";

type ResultSet = [
	RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
	FieldPacket[],
];

export const getProjects = async (
	req: Request,
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
		return;
	} catch (error: unknown) {
		logError("getProjects", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const createProject = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let {
		student_id,
		project_name,
		project_desc,
		company_id,
		project_status,
		project_url,
		start_date,
		end_date,
	} = { ...req.body };
	let connection: PoolConnection | null = null;
	start_date = new Date(formatDate(new Date(start_date)));
	end_date = new Date(formatDate(new Date(end_date)));

	try {
		connection = await pool.getConnection();

		await connection.beginTransaction();
		const studyYear = getStudyYear(start_date);
		const [student] = await pool.query<RowDataPacket[]>(
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

		if (teacher_id === 0) {
			teacher_id = null;
		}

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
			// not null

			// Check if the teacher has resources for this year
			const [resources] = await connection.query<RowDataPacket[]>(
				`SELECT * FROM resources
                 WHERE teacher_id = ? AND study_year = ?`,
				[teacher_id, studyYear],
			);

			// Only increment if resources exist and haven't reached the limit
			if (
				resources &&
				resources.length > 0 &&
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
		return;
	} catch (error: unknown) {
		logError("createProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const updateProjectTeacher = async (
	currentTeacherId: number,
	newTeacherId: number,
	studyYear: string,
	connection: PoolConnection | null = null,
): Promise<boolean> => {
	if (!connection) {
		return false;
	}
	try {
		// Check if new teacher has available resources
		const [resources] = await connection.query<RowDataPacket[]>(
			`SELECT used_resources, total_resources FROM resources
             WHERE teacher_id = ? AND study_year = ?`,
			[newTeacherId, studyYear],
		);

		const hasAvailableResources =
			resources &&
			resources.length > 0 &&
			resources[0] &&
			resources[0].used_resources < resources[0].total_resources;

		if (!hasAvailableResources) return false;

		// Update resource counts
		if (currentTeacherId) {
			await connection.query<ResultSetHeader>(
				R_QUERY.DECREMENT_RESOURCE_USAGE,
				[currentTeacherId, studyYear],
			);
		}
		await connection.query<ResultSetHeader>(R_QUERY.INCREMENT_RESOURCE_USAGE, [
			newTeacherId,
			studyYear,
		]);

		return true;
	} catch (error) {
		logError("updateProjectTeacher", error);
		return false;
	}
};

// Update updateProject function to handle teacher changes
export const updateProject = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);

	const {
		project_id,
		project_name,
		project_desc,
		teacher_id,
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

		if (!originalProject?.length) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		const currentTeacherId = originalProject[0].teacher_id;
		let finalTeacherId = currentTeacherId;

		// Handle teacher change if needed
		if (currentTeacherId !== teacher_id && teacher_id) {
			const studyYear = getStudyYear(new Date(start_date));
			const teacherChanged = await updateProjectTeacher(
				currentTeacherId,
				teacher_id,
				studyYear,
				connection,
			);

			if (teacherChanged) {
				finalTeacherId = teacher_id;
			}
		}

		// Update project
		await connection.query(QUERY.UPDATE_PROJECT, [
			project_name,
			project_desc,
			finalTeacherId,
			company_id,
			project_status,
			project_url,
			start_date,
			end_date,
			project_id,
		]);

		await connection.commit();

		responseHelper.ok(res, {
			project_id,
			project_name,
			project_desc,
			teacher_id: finalTeacherId,
			company_id,
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
	req: Request,
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
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const id = req.params.student_id;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [projects] = await pool.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT_PROJECTS_BY_STUDENT_ID,
			id,
		); // critical, should be SELECT_STUDENT_PROJECTS_BY_STUDENT_ID
		if (projects.length === 0) {
			responseHelper.notFound(res);
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

export const createStudentProject = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const studentProject: StudentProject = { ...req.body };
	let projectNumber: number;
	// TBD validation
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [previousProjects] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_STUDENT_PROJECTS_BY_STUDENT_ID,
			[studentProject.student_id],
		);
		if (previousProjects.length === 0) {
			projectNumber = 1;
		} else {
			projectNumber = previousProjects.length + 1;
		}
		//studentProject.project_number = projectNumber;
		const result: ResultSet = await connection.query(
			QUERY.CREATE_STUDENT_PROJECT,
			Object.values(studentProject),
		);
		responseHelper.created(res, studentProject);
		return;
	} catch (error: unknown) {
		logError("createStudentProject", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const addProjectNote = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const note_params = [
			req.params.project_id,
			req.body.note,
			req.body.document_path,
			req.body.created_by,
		];
		const result: ResultSet = await connection.query<ResultSetHeader>(
			QUERY.INSERT_PROJECT_NOTE,
			note_params,
		);
		responseHelper.created(res, req.body); // TBD note parsing
		return;
	} catch (error: unknown) {
		logError("addProjectNote", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const getProjectNotes = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [notes] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_PROJECT_NOTES,
			[req.params.project_id],
		);
		if (notes.length === 0) {
			responseHelper.notFound(res);
			return;
		}
		responseHelper.ok(res, notes);
		return;
	} catch (error: unknown) {
		logError("getProjectNotes", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const deleteProjectNote = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	const { note_id, project_id } = req.params;
	try {
		connection = await pool.getConnection();
		await connection.query<ResultSetHeader>(QUERY.DELETE_PROJECT_NOTE, [
			note_id,
			project_id,
		]);
		responseHelper.noContent(res);
		return;
	} catch (error: unknown) {
		logError("deleteProjectNote", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};
