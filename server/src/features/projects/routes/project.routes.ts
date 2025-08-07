import { Router } from "express";
import {
	addProjectNote,
	deleteProjectNote,
	listProjectNotes,
} from "../controllers/project_notes.controller";
import {
	createProject,
	deleteProject,
	exportProjects,
	getProject,
	getProjectStatistics,
	listProjectMembers,
	listProjects,
	listUserProjects,
	//	getProjectStatistics,
} from "../controllers/project.controller";
import {
	updateProject,
	updateProjectStatus,
	updateProjectTeacher,
} from "../controllers/project_updates.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";
import {
	generateProjectJoinCode,
	addProjectMember,
} from "../controllers/project_members.controller";

const projectsRouter: Router = Router();

// Projects collection
projectsRouter
	.route("/")
	.get(authenticate, requireRole(["teacher"]), listProjects)
	.post(authenticate, requireRole(["student"]), createProject);

// Current user's projects
projectsRouter.route("/me").get(authenticate, listUserProjects);
projectsRouter
	.route("/export")
	.get(authenticate, requireRole(["teacher"]), exportProjects);

projectsRouter
	.route("/statistics")
	.get(authenticate, requireRole(["teacher"]), getProjectStatistics);

// Individual project
projectsRouter
	.route("/:projectId")
	.get(authenticate, getProject)
	.put(authenticate, updateProject)
	.delete(authenticate, deleteProject);

// Project members subcollection
projectsRouter
	.route("/:projectId/members")
	.get(authenticate, listProjectMembers);

// Project status (special action)
projectsRouter
	.route("/:projectId/updateStatus")
	.put(authenticate, updateProjectStatus);

// Project teacher assignment
projectsRouter
	.route("/:projectId/teacher")
	.put(authenticate, requireRole(["teacher"]), updateProjectTeacher);

// Project notes subcollection
projectsRouter
	.route("/:projectId/notes")
	.get(authenticate, listProjectNotes)
	.post(authenticate, addProjectNote);

// Individual project note
projectsRouter
	.route("/:projectId/notes/:noteId")
	.delete(authenticate, deleteProjectNote);

projectsRouter
	.route("/:projectId/joinCode")
	.get(authenticate, generateProjectJoinCode);

projectsRouter.route("/joinProject").post(authenticate, addProjectMember);

export default projectsRouter;
