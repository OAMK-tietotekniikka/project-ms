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
import { createStudentSchema } from "../../../shared/validation/student.schema";
import { TeacherSchema } from "../../../shared/validation/teacher.schema";

export const login = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);

	const { name, email, role } = req?.user ?? {};
	let parsed_name,
		parsed_email: string | null = null;
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
		if (!student_id && !teacher_id) {
			console.log("Creating new user");
			if (role === "teacher") {
				let teacherRaw = TeacherSchema.safeParse({
					teacher_name: req.user?.name,
					email: req.user?.email,
				});
				if (!teacherRaw.success) {
					responseHelper.badRequest(res);
					return;
				}

				parsed_name = teacherRaw.data.teacher_name;
				parsed_email = teacherRaw.data.email;
			} else if (role === "student") {
				let studentRaw = createStudentSchema.safeParse({
					student_name: req.user?.name,
					email: req.user?.email,
				});

				if (!studentRaw.success) {
					responseHelper.badRequest(res);
					return;
				}

				parsed_name = studentRaw.data.student_name;
				parsed_email = studentRaw.data.email;
			}

			await connection.query(
				`INSERT INTO ${table} (${name_field}, email) VALUES (?, ?)`,
				[parsed_name, parsed_email],
			);
			responseHelper.created(res, { role: role });
			return;
		} else {
			if (teacher_id && role === "teacher") {
				responseHelper.ok(res, { role: "teacher" });
				return;
			} else if (student_id && role === "student") {
				responseHelper.ok(res, { role: "student" });
				return;
			} else {
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

		logError("auth.controller.login", error);
		responseHelper.internalServerError(res);
		return;
	} finally {
		if (connection) await connection.release();
	}
};
