/**
 * Companies controller.
 * Manages retrieving and deleting companies and their related data.
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
import { QUERY } from "../query/companies.query";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";
import { getTeacherIdByEmail } from "../utils/getUsersByEmail";
import { AuthenticatedRequest } from "../middleware/auth";

/**
 * Retrieves companies.
 *
 * Fetches a list of all companies accessible by the authenticated user.
 * Returns a list of companies.
 */
export const getCompanies = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [result] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_COMPANIES,
		);
		responseHelper.ok(res, result);
		return;
	} catch (error: unknown) {
		logError("getCompanies", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Creates a new company.
 *
 * Adds a new company to the database and returns the created or existing record with ID and name.
 */

export const createCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let company: { company_name: string } = {
		company_name: req.body.company_name,
	};
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [existing_company] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_BY_NAME,
			[req.body.company_name],
		);
		if (existing_company && existing_company.length > 0) {
			responseHelper.conflict(res); // add {company_id: existing_company[0].company_id}
			return;
		}
		const [result] = await connection.query<ResultSetHeader>(
			QUERY.CREATE_COMPANY,
			[req.body.company_name],
		);
		company = { company_id: result.insertId, ...req.body };
		responseHelper.created(res, company);
		return;
	} catch (error: unknown) {
		logError("createCompany", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Deletes a company.
 *
 * Removes a company reference from all projects, deletes company-teacher relations,
 * and deletes the company itself, if the authenticated user is a teacher.
 * Returns a success / error response.
 */
export const deleteCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { company_id } = req.params;
	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		// Check if company exists
		const [existing_company] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_COMPANY,
			[company_id],
		);

		if (!existing_company || existing_company.length === 0) {
			await connection.rollback();
			responseHelper.notFound(res); // Company not found
			return;
		}

		// Update projects to remove company reference (nullify company_id)
		await connection.query<ResultSetHeader>(QUERY.DELETE_COMPANY_IN_PROJECTS, [
			company_id,
		]);

		// Delete company-teacher relationships
		await connection.query<ResultSetHeader>(
			QUERY.DELETE_COMPANY_IN_COMPANY_TEACHERS,
			[company_id],
		);

		// Delete the company
		const [deleteResult] = await connection.query<ResultSetHeader>(
			QUERY.DELETE_COMPANY_IN_COMPANIES,
			[company_id],
		);

		if (deleteResult.affectedRows === 0) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		await connection.commit();
		responseHelper.ok(res, { message: "Company deleted successfully" });
		return;
	} catch (error: unknown) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				logError("rollback error in delete company", rollbackError);
			}
		}
		logError("delete company", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) {
			connection.release();
		}
	}
};

/**
 * Retrieves favorite companies for a teacher.
 *
 * Fetches all companies marked as favorite by the authenticated teacher.
 * Returns a list of favorite companies.
 */
export const getFavoCompanies = async (
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

		const [companies] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_FAVO_COMPANIES,
			[teacher_id],
		);
		if (companies.length > 0) {
			responseHelper.ok(res, companies);
			return;
		}
		responseHelper.ok(res, []);
	} catch (error: unknown) {
		logError("getFavoCompanies", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Adds a favorite company for a teacher.
 *
 * Adds a company to the authenticated teacher’s list of favorite companies.
 * Returns a success (company_id, teacher_id) / error response.
 */
export const addFavoCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { company_id } = req.body;
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

		await connection.query<ResultSetHeader>(QUERY.ADD_FAVO_COMPANY, [
			company_id,
			teacher_id,
		]);
		responseHelper.created(res, { company_id, teacher_id });
		return;
	} catch (error: unknown) {
		logError("addFavoCompany", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};

/**
 * Deletes a favorite company for a teacher.
 *
 * Removes a company from the authenticated teacher’s list of favorite companies.
 * Returns a success / error response.
 */
export const deleteFavoCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		const { company_id } = req.body;
		const teacher_id = await getTeacherIdByEmail(
			connection,
			req.user?.email || "",
		);

		if (!teacher_id || !company_id) {
			responseHelper.notFound(res);
			return;
		}

		await connection.query<ResultSetHeader>(QUERY.DELETE_FAVO_COMPANY, [
			teacher_id,
			company_id,
		]);
		responseHelper.ok(res);
		return;
	} catch (error: unknown) {
		logError("deleteFavoCompany", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) connection.release();
	}
};
