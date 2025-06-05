import { Router } from "express";
import {
	addProjectNote,
	createProject,
	createStudentProject,
	deleteProject,
	deleteProjectNote,
	getProjectNotes,
	getProjects,
	getStudentProjects,
	updateProject,
} from "../controllers/projects.controller";
import { authenticate, requireRole } from "../middleware/auth";

const projectsRouter = Router();

projectsRouter
	.route("/")
	.get(authenticate, requireRole(["student"]), getProjects)
	.post(authenticate, requireRole(["student"]), createProject);

projectsRouter
	.route("/:project_id")
	.put(authenticate, updateProject)
	.delete(authenticate, deleteProject);

projectsRouter
	.route("/student/:student_id")
	.get(authenticate, getStudentProjects)
	.post(authenticate, createStudentProject);

projectsRouter
	.route("/:project_id/notes")
	.get(authenticate, getProjectNotes)
	.post(authenticate, addProjectNote);

projectsRouter
	.route("/:project_id/notes/:note_id")
	.delete(authenticate, deleteProjectNote);

export default projectsRouter;
