/**
 * Project notes controller.
 * Manages retrieving, adding, deleting notes in/to projects.
 *
 * @version 2.1.0
 * @since 5.07.2025
 * @module
 */

import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import type { Response } from "express";
import { logRequests } from "../../../shared/utils/logRequests";
import pool from "../../../shared/config/mariadb.config";
import mariadb from "mariadb";
import { QUERY } from "../queries/projects.query";
import { responseHelper } from "../../../shared/utils/response-helper";
import { logError } from "../../../shared/utils/logError";
import {getStudentIdByEmail, getTeacherIdByEmail} from "../../../shared/utils/getUsersByEmail";
import {no} from "zod/dist/types/v4/locales";

/**
 * Adds a new project note.
 *
 * Creates and attaches a new note to the specified project by the authenticated user.
 * Returns the newly created note (req.body if success).
 */

export const addProjectNote = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const validNoteTypes = ['text', 'link', 'feedback', 'milestone'];
	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(connection, req.user?.email || "");

		if (student_id) {
			const [belongs] = await connection.query(QUERY.STUDENT_BELONGS_TO_PROJECT, [
				student_id,
				req.params.projectId,
			]);

			if (!belongs) {
				responseHelper.unauthorized(res);
				return;
			}
		}

		let noteContent = req.body.note_content || null;

		if (noteContent && noteContent.length > 500) {
			noteContent = noteContent.slice(0, 500);
		}
		const safeNoteType = validNoteTypes.includes(req.body.note_type)
			? req.body.note_type
			: 'text';

		const email = req.user?.email || "";
		const created_by = email.match(/^[A-Za-z]+/)?.[0] || "";
		if ((noteContent == "" || !noteContent) && safeNoteType == "link") {
			noteContent = "";
		}

		const note_params = [
			req.params.projectId,
			req.body.note_title,
			noteContent,
			req.body.note_url || null,
			safeNoteType,
			created_by,
		];
		const note = await connection.query(
			QUERY.INSERT_PROJECT_NOTE,
			note_params,
		);

		responseHelper.created(res, note);
		return;

	} catch (error) {
		logError("newNoteAdd", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) {
			connection.release();
		}
	}
};

/**
 * Retrieves project notes.
 *
 * Fetches all notes related to a specific project, accessible by the authenticated user.
 * Returns a list of project notes.
 */
export const listProjectNotes = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const notes = await connection.query(
			QUERY.SELECT_PROJECT_NOTES,
			[req.params.projectId],
		);
		if (notes.length === 0) {
			responseHelper.ok(res);
			return;
		}
		responseHelper.ok(res, notes);
		return;
	} catch (error: unknown) {
		logError("listProjectNotes", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Deletes a project note.
 *
 * Removes a specific note from a project, if the authenticated user has permission.
 * Returns a success / error response.
 */
export const deleteProjectNote = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const { noteId, projectId } = req.params;
	try {
		connection = await pool.getConnection();
		await connection.query(QUERY.DELETE_PROJECT_NOTE, [
			noteId,
			projectId,
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
