import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import pool from "../config/mysql.config";
import { responseHelper } from "../domain/newResponse";
import type { HttpResponse } from "../domain/response";
import { QUERY } from "../query/companies.query";
import { logError } from "../utils/logError";
import { logRequests } from "../utils/logRequests";

export const getCompanies = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [result] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_COMPANIES,
		);
		return responseHelper.ok(res, result);
	} catch (error: unknown) {
		logError("getCompanies", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const createCompany = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let company: { company_name: string } = {
		company_name: req.body.company_name,
	};
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [result] = await connection.query<ResultSetHeader>(
			QUERY.CREATE_COMPANY,
			[req.body.company_name],
		);
		company = { company_id: result.insertId, ...req.body };
		return responseHelper.created(res, company);
	} catch (error: unknown) {
		logError("createCompany", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const getFavoCompanies = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		const [companies] = await connection.query<RowDataPacket[]>(
			QUERY.SELECT_FAVO_COMPANIES,
			[req.params.teacher_id],
		);
		if (companies.length > 0) {
			return responseHelper.ok(res, companies);
		}
		return responseHelper.notFound(res);
	} catch (error: unknown) {
		logError("getFavoCompanies", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const addFavoCompany = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	const { company_id, teacher_id } = req.body;
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		await connection.query<ResultSetHeader>(QUERY.ADD_FAVO_COMPANY, [
			company_id,
			teacher_id,
		]);
		return responseHelper.created(res, { company_id, teacher_id });
	} catch (error: unknown) {
		logError("addFavoCompany", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};

export const deleteFavoCompany = async (
	req: Request,
	res: Response,
): Promise<Response<HttpResponse>> => {
	logRequests(req);
	let connection: PoolConnection | null = null;
	try {
		connection = await pool.getConnection();
		await connection.query<ResultSetHeader>(QUERY.DELETE_FAVO_COMPANY, [
			req.params.teacher_id,
		]);
		return responseHelper.ok(res);
	} catch (error: unknown) {
		logError("deleteFavoCompany", error);
		return responseHelper.internalServerError(res);
	} finally {
		if (connection) connection.release();
	}
};
