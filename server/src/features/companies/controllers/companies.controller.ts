/**
 * Companies controller.
 * Manages retrieving and deleting companies and their related data.
 *
 * @version 2.1.0
 * @since 5.07.2025
 * @module
 */

import type { Request, Response } from "express";
import mariadb from "mariadb";
import pool from "../../../shared/config/mariadb.config";
import { responseHelper } from "../../../shared/utils/response-helper";
import { QUERY } from "../queries/companies.query";
import { logError } from "../../../shared/utils/logError";
import { logRequests } from "../../../shared/utils/logRequests";
import { getTeacherIdByEmail } from "../../../shared/utils/getUsersByEmail";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";

/**
 * Retrieves companies.
 *
 * Fetches a list of all companies accessible by the authenticated user.
 * Returns a list of companies.
 */
export const listCompanies = async (
	req: Request,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const result = await connection.query(
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
	let connection: mariadb.PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const existing_company = await connection.query(
			QUERY.SELECT_BY_NAME,
			[req.body.company_name],
		);
		if (existing_company && existing_company.length > 0) {
			responseHelper.conflict(res); // add {company_id: existing_company[0].company_id}
			return;
		}
		const result = await connection.query(
			QUERY.CREATE_COMPANY,
			[req.body.company_name],
		);
		responseHelper.created(res, result);
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
	const { companyId } = req.params;
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		await connection.beginTransaction();

		const existing_company = await connection.query(
			QUERY.SELECT_COMPANY,
			[companyId],
		);

		if (!existing_company || existing_company.length === 0) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}


		const projects = await connection.query(
			"SELECT COUNT(*) as count FROM projects WHERE company_id = ?",
			[companyId]
		);

		if (projects[0].count > 0) {
			await connection.rollback();
			responseHelper.badRequest(res);
			return;
		}

		// safe to delete company (no projects reference it)
		const deleteResult = await connection.query(
			QUERY.DELETE_COMPANY_IN_COMPANIES,
			[companyId],
		);

		if (deleteResult.affectedRows === 0) {
			await connection.rollback();
			responseHelper.notFound(res);
			return;
		}

		await connection.commit();
		responseHelper.ok(res);
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
export const listFavoriteCompanies = async (
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

		const companies = await connection.query(
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
export const addFavoriteCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { company_id } = req.body;
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

		await connection.query(QUERY.ADD_FAVO_COMPANY, [
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
export const removeFavoriteCompany = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		const { companyId } = req.params;
		const teacher_id = await getTeacherIdByEmail(
			connection,
			req.user?.email || "",
		);

		if (!companyId) {
			responseHelper.badRequest(res);
			return;
		}

		await connection.query(QUERY.DELETE_FAVO_COMPANY, [
			teacher_id,
			companyId,
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
