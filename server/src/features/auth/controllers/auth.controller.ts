import { Request, Response } from "express";

import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { responseHelper } from "../../../shared/utils/response_helper";
import {
	getStudentIdByEmail,
	getTeacherIdByEmail,
} from "../../../shared/utils/user_email_lookup";
import { logError } from "../../../shared/utils/log_errors";
import { logRequests } from "../../../shared/utils/log_requests";

export const login = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	const { name, email, role } = req?.user ?? {};
	console.log(req.user);
	if (!name || !email || !role) {
		responseHelper.badRequest(res);
		return;
	}

	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();

		// Determine which table to query based on role
		let table = "";
		let name_field = "";

		if (role === "teacher") {
			table = "teachers";
			name_field = "teacher_name";
		} else if (role === "student") {
			table = "students";
			name_field = "student_name";
		} else {
			responseHelper.badRequest(res);
			return;
		}

		const teacher_id = await getTeacherIdByEmail(
			connection,
			req.user?.email || "",
		);
		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);
		console.log("Teacher ID:", teacher_id);
		console.log("Student ID:", student_id);
		if (!student_id && !teacher_id) {
			console.log("Creating new user");
			await connection.query(
				`INSERT INTO ${table} (${name_field}, email) VALUES (?, ?)`,
				[name, email],
			);
			console.log("User created", { role: role });
			responseHelper.created(res, { role: role });
			return;
		} else {
			console.log("User already exists");
			if (teacher_id && role === "teacher") {
				responseHelper.ok(res, { role: "teacher" });
				return;
			} else if (student_id && role === "student") {
				responseHelper.ok(res, { role: "student" });
				return;
			} else {
				console.log("User already exists but has incorrect role", role);
				responseHelper.internalServerError(res);
				return;
			}
		}
	} catch (error: any) {
		if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
			console.log(
				"Caught duplicate entry race condition. Treating as success.",
			);
			// The user was created by a parallel request, which is a success state for us.
			responseHelper.ok(res, { role: req.user?.role });
			return;
		}

		logError("auth", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};
