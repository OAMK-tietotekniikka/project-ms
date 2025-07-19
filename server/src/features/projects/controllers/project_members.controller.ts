import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import type { Response } from "express";
import { logRequests } from "../../../shared/utils/log_requests";
import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import { getStudentIdByEmail } from "../../../shared/utils/user_email_lookup";
import { responseHelper } from "../../../shared/utils/response_helper";
import { QUERY } from "../queries/projects.query";
import { logError } from "../../../shared/utils/log_errors";
import { OTPService } from "../services/project_invitation";
import { NotificationService } from "../../notifications/services/notificationService";

const MAX_STUDENT_PROJECTS = 8;
const notificationService = NotificationService.getInstance();

export const generateProjectJoinCode = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	let connection: mariadb.PoolConnection | null = null;
	const { projectId } = req.params;
	const project_id = projectId; // ???

	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);
		if (!student_id) {
			responseHelper.unauthorized(res);
			return;
		}

		// Check if student belongs to project
		const [belongs] = await connection.query(QUERY.STUDENT_BELONGS_TO_PROJECT, [
			student_id,
			project_id,
		]);

		if (!belongs) {
			responseHelper.unauthorized(res);
			return;
		}

		// Check if code already exists for this project
		const existingCode = await OTPService.getExistingCodeForProject(project_id);
		if (existingCode) {
			responseHelper.created(res, { joinCode: existingCode });
			return;
		}

		// Generate new unique code
		const joinCode = await OTPService.generateProjectOTP(project_id);
		responseHelper.created(res, { joinCode });
	} catch (error: unknown) {
		logError("generateProjectJoinCode", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};

export const addProjectMember = async (
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> => {
	logRequests(req);
	const { joinCode } = req.body;
	console.log(joinCode);
	let connection: mariadb.PoolConnection | null = null;

	try {
		connection = await pool.getConnection();
		const student_id = await getStudentIdByEmail(
			connection,
			req.user?.email || "",
		);
		if (!student_id) {
			responseHelper.unauthorized(res);
			return;
		}

		// Validate join code and get project info
		const otpResult = await OTPService.validateAndJoinProject(joinCode);
		if (!otpResult) {
			responseHelper.notFound(res);
			return;
		}

		const project_id = otpResult.project_id;
		const [teacher_id] = await connection.query(
			`select teacher_id from projects where project_id = ? LIMIT 1`,
			[project_id],
		);

		// Check if student already belongs to this project
		const existingAssignment = await connection.query(
			QUERY.STUDENT_BELONGS_TO_PROJECT,
			[student_id, project_id],
		);

		if (existingAssignment.length > 0) {
			responseHelper.conflict(res);
			return;
		}

		// Check student's current project count
		const [student] = await connection.query(
			"SELECT current_projects FROM students WHERE student_id = ? LIMIT 1",
			[student_id],
		);

		if (!student || student.current_projects >= MAX_STUDENT_PROJECTS) {
			responseHelper.conflict(res);
			return;
		}

		const capacityResult = await connection.query(QUERY.SELECT_PROJECT, [
			project_id,
		]);
		if (
			capacityResult.length === 0 ||
			capacityResult[0].current_students >= capacityResult[0].max_students
		) {
			responseHelper.conflict(res);
			return;
		}

		// Begin transaction
		await connection.beginTransaction();

		try {
			// Add student to project
			await connection.query(QUERY.CREATE_STUDENT_PROJECT, [
				student_id,
				project_id,
			]);

			await connection.commit();
			try {
				await notificationService.notifyStudentJoinedProject(
					parseInt(project_id),
					parseInt(teacher_id?.teacher_id),
				);
			} catch (notificationError) {}

			responseHelper.created(res);
		} catch (transactionError) {
			await connection.rollback();
			throw transactionError;
		}
	} catch (error: unknown) {
		logError("addProjectMember", error);
		responseHelper.internalServerError(res);
	} finally {
		if (connection) await connection.release();
	}
};
