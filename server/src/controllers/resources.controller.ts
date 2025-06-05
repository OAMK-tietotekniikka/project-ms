import type { Request, Response } from "express";
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
import type { Resource } from "../interface/resource";
import { R_QUERY } from "../query/resources.query";
import { QUERY } from "../query/teachers.query";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";

type ResultSet = [
	RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
	FieldPacket[],
];

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

export const createResource = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let resource: Resource = { ...req.body };
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [result] = await connection.query<ResultSetHeader>(
			R_QUERY.CREATE_RESOURCE,
			Object.values(resource),
		);
		resource = { resource_id: result.insertId, ...req.body };
		responseHelper.created(res, resource);
		return;
	} catch (error: unknown) {
		logError("createResource", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

export const updateResource = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const resource: Resource = { ...req.body };
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [findResource] = await connection.query<RowDataPacket[]>(
			R_QUERY.SELECT_RESOURCE,
			[req.params.resource_id],
		);
		if (findResource.length === 0) {
			responseHelper.notFound(res);
			return;
		}

		const result: ResultSet = await connection.query(R_QUERY.UPDATE_RESOURCE, [
			resource.teacher_id,
			resource.total_resources,
			resource.used_resources,
			resource.study_year,
			req.params.resource_id,
		]);
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

export const incrementResourceUsage = async (
	teacher_id: number,
	studyYear: string,
): Promise<boolean> => {
	let connection: PoolConnection | null = null;

	if (!teacher_id || !studyYear) {
		return false;
	}

	try {
		connection = await pool.getConnection();

		const [result] = await connection.query<ResultSetHeader>(
			`
            UPDATE resources
            SET used_resources = used_resources + 1
            WHERE teacher_id = ?
              AND study_year = ?
              AND used_resources < total_resources
        `,
			[teacher_id, studyYear],
		);

		if (result.affectedRows === 0) {
			// Check if resource exists but is at capacity
			const [existingResource] = await connection.query<RowDataPacket[]>(
				"SELECT * FROM resources WHERE teacher_id = ? AND study_year = ?",
				[teacher_id, studyYear],
			);

			if (existingResource.length === 0) {
				return false;
			}
		}

		return true;
	} catch (error: unknown) {
		logError("incrementResourceUsage", error);
		return false;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Decrements the used_resources count for a teacher's resource entry
 */
export const decrementResourceUsage = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { teacherId, studyYear } = req.body;
	let connection: PoolConnection | null = null;

	if (!teacherId || !studyYear) {
		responseHelper.badRequest(res);
		return;
	}

	try {
		connection = await pool.getConnection();

		const [result] = await connection.query<ResultSetHeader>(
			R_QUERY.DECREMENT_RESOURCE_USAGE,
			[teacherId, studyYear],
		);

		if (result.affectedRows === 0) {
			responseHelper.notFound(res);
			return;
		}

		responseHelper.ok(res, {
			message: "Resource usage decremented successfully",
		});
		return;
	} catch (error: unknown) {
		logError("decrementResourceUsage", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};
