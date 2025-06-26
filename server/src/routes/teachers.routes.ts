import { Router } from "express";
import {
	createTeacher,
	getAvailableTeachers,
	getCurrentTeacher,
	getTeachers,
	getTeachersByCompany,
	updateTeacher,
} from "../controllers/teachers.controller";
import { authenticate, requireRole } from "../middleware/auth";

const teachersRouter = Router();

teachersRouter.route("/me").get(authenticate, getCurrentTeacher);

// TODO: we have own teacher creation, should add new teacher route (if teacher on sick leave or so)

teachersRouter
	.route("/")
	.get(
		authenticate,
		requireRole("teacher"), // TODO Only admins should see all teachers
		getTeachers,
	)
	.post(
		authenticate,
		requireRole("teacher"), // TODO Only admins should create new teachers
		createTeacher,
	);

teachersRouter
	.route("/available/:study_year")
	.get(authenticate, requireRole(["teacher"]), getAvailableTeachers); // TODO available teachers

teachersRouter
	.route("/:teacher_id") // TODO remove / teacher_id if we only decide to update the current_teacher, not all
	.put(authenticate, requireRole("teacher"), updateTeacher);

teachersRouter.route("/company/:company_name").get(getTeachersByCompany);

export default teachersRouter;
