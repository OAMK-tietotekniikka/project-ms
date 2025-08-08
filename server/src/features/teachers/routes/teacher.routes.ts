import { Router } from "express";
import {
	createTeacher,
	//deleteTeacher,
	listAvailableTeachers,
	getCurrentTeacher,
	listTeachers,
	updateTeacher,
} from "../controllers/teacher.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";

const teachersRouter: Router = Router();

// Current user's teacher profile
teachersRouter.route("/me").get(authenticate, getCurrentTeacher);

// Teachers collection
teachersRouter
	.route("/")
	.get(authenticate, requireRole(["teacher"]), listTeachers)
	.post(authenticate, requireRole(["teacher"]), createTeacher);

// Available teachers for assignment
teachersRouter
	.route("/available/:studyYear")
	.get(authenticate, requireRole(["teacher"]), listAvailableTeachers);

// Individual teacher
teachersRouter
	.route("/:teacherId")
	.put(authenticate, requireRole(["teacher"]), updateTeacher); // Only admins should update other teachers
//.delete(authenticate, requireRole(["teacher"]), deleteTeacher);

export default teachersRouter;
