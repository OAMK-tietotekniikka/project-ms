import type { AuthenticatedRequest } from "../middleware/auth";
import type { Response } from "express";
import { logRequests } from "../utils/logRequests";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { QUERY } from "../query/projects.query";
import { responseHelper } from "../domain/newResponse";
import { logError } from "../utils/logError";

export const addProjectNote = async (
	req: AuthenticatedRequest,
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
		const result = await connection.query<ResultSetHeader>(
			QUERY.INSERT_PROJECT_NOTE,
			note_params,
		);
		responseHelper.created(res, req.body); // TODO note parsing
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
	req: AuthenticatedRequest,
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
			responseHelper.ok(res);
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
	req: AuthenticatedRequest,
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
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("deleteProjectNote", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};
