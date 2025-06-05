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

const projectsRouter = Router();

projectsRouter.route("/").get(getProjects).post(createProject);

projectsRouter.route("/:project_id").put(updateProject).delete(deleteProject);

projectsRouter
	.route("/student/:student_id")
	.get(getStudentProjects)
	.post(createStudentProject);

projectsRouter
	.route("/:project_id/notes")
	.get(getProjectNotes)
	.post(addProjectNote);

projectsRouter.route("/:project_id/notes/:note_id").delete(deleteProjectNote);

export default projectsRouter;
