import { Router } from "express";
import {
	createStudent,
	deleteStudent,
	getCurrentStudent,
	listStudentProjects,
	listStudents,
	updateStudent,
} from "../controllers/student.controller";
import { batchCreateStudents } from "../controllers/student_batch.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";

const studentsRouter: Router = Router();

studentsRouter
	.route("/")
	.get(authenticate, requireRole(["teacher"]), listStudents)
	.post(authenticate, requireRole(["student"]), createStudent);

studentsRouter
	.route("/batchCreate")
	.post(authenticate, requireRole(["teacher"]), batchCreateStudents);

studentsRouter.route("/me").get(authenticate, getCurrentStudent);

studentsRouter
	.route("/:studentId")
	.put(authenticate, requireRole(["teacher"]), updateStudent)
	.delete(authenticate, requireRole(["teacher"]), deleteStudent);

studentsRouter
	.route("/:studentId/projects")
	.get(authenticate, requireRole(["teacher"]), listStudentProjects);

export default studentsRouter;
