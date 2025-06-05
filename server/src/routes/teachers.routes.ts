import { Router } from "express";
import {
	createTeacher,
	getTeacher,
	getTeachers,
	getTeachersByCompany,
	updateTeacher,
} from "../controllers/teachers.controller";

const teachersRouter = Router();

teachersRouter.route("/").get(getTeachers).post(createTeacher);

teachersRouter.route("/:teacher_id").put(updateTeacher);

teachersRouter.route("/:email").get(getTeacher);

teachersRouter.route("/company/:company_name").get(getTeachersByCompany);

export default teachersRouter;
