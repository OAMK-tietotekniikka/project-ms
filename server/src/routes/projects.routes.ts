import { Router } from "express";
import {
	addProjectNote,
	deleteProjectNote,
	getProjectNotes,
} from "../controllers/notes.controller";
import {
	addStudentToProject,
	createProject,
	deleteProject,
	getProjectDetails,
	getProjectMembers,
	getProjects,
	getStudentProjects,
	getTeacherProjects,
	updateProject,
	updateProjectStatus,
	updateProjectTeacher,
} from "../controllers/projects.controller";
import { authenticate, requireRole } from "../middleware/auth";

const projectsRouter = Router();

projectsRouter
	.route("/")
	.get(authenticate, requireRole(["teacher"]), getProjects) // GET /projects - list all projects
	.post(authenticate, requireRole(["student"]), createProject); // POST /projects - create new project

projectsRouter.route("/student/me").get(authenticate, getStudentProjects); // GET /projects/me - get current user's projects

projectsRouter.route("/teacher/me").get(authenticate, getTeacherProjects);

projectsRouter
	.route("/:project_id")
	.get(authenticate, getProjectDetails) // !!!!! TODO
	.put(authenticate, updateProject) // PUT /projects/:project_id - update project
	.delete(authenticate, deleteProject); // DELETE /projects/:project_id - delete project

projectsRouter
	.route("/:project_id/members")
	.get(authenticate, getProjectMembers) // GET /projects/:project_id/members - get all project members
	.put(authenticate, addStudentToProject); // POST /projects/:project_id/members - add student to project

projectsRouter
	.route("/:project_id/status")
	.put(authenticate, updateProjectStatus); // PUT /projects/:project_id/status - update project status

projectsRouter
	.route("/:project_id/teacher")
	.put(authenticate, requireRole(["teacher"]), updateProjectTeacher); // PUT /projects/:project_id/teacher - assign/change project teacher

projectsRouter
	.route("/:project_id/notes")
	.get(authenticate, getProjectNotes) // GET /projects/:project_id/notes - list project notes
	.post(authenticate, addProjectNote); // POST /projects/:project_id/notes - create new note

projectsRouter
	.route("/:project_id/notes/:note_id")
	.delete(authenticate, deleteProjectNote); // DELETE /projects/:project_id/notes/:note_id - delete note

export default projectsRouter;
