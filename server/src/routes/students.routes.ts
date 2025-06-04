import { Router } from "express";
import {
	createStudent,
	deleteStudent,
	getStudent,
	getStudents,
	updateStudent,
} from "../controllers/students.controller";
import { createMultipleStudents } from "../controllers/students_bulk.controller";

const studentsRouter = Router();

studentsRouter.route("/").get(getStudents).post(createStudent);

studentsRouter.route("/batch-create").post(createMultipleStudents);

studentsRouter.route("/:student_id").put(updateStudent).delete(deleteStudent);

studentsRouter.route("/:email").get(getStudent);

export default studentsRouter;
