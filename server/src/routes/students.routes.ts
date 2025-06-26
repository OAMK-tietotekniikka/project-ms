import { Router } from "express";
import {
	createStudent,
	deleteStudent,
	getStudent,
	getStudentUpdated,
	getStudents,
	updateStudent,
} from "../controllers/students.controller";
import { createMultipleStudents } from "../controllers/students_bulk.controller";
import { authenticate, requireRole } from "../middleware/auth";

const studentsRouter = Router();

studentsRouter
	.route("/")
	.get(authenticate, requireRole("teacher"), getStudents)
	.post(authenticate, requireRole("student"), createStudent);

studentsRouter
	.route("/batch")
	.post(authenticate, requireRole(["teacher"]), createMultipleStudents);

studentsRouter
	.route("/:student_id")
	.put(authenticate, updateStudent)
	.delete(authenticate, deleteStudent);

studentsRouter.route("/me").get(authenticate, getStudentUpdated);

studentsRouter.route("/:email").get(getStudent);

export default studentsRouter;
