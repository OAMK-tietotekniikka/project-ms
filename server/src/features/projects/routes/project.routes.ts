import { Router } from "express";
import {
	addProjectNote,
	deleteProjectNote,
	listProjectNotes,
} from "../controllers/project-notes.controller";
import {
	createProject,
	deleteProject,
	getProject,
	listProjectMembers,
	listProjects,
	listUserProjects,
	updateProject,
	updateProjectStatus,
	updateProjectTeacher,
//	getProjectStatistics,
} from "../controllers/project.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";
import {generateProjectJoinCode, addProjectMember} from "../controllers/project-members.controller";

const projectsRouter = Router();

// Projects collection
projectsRouter
	.route("/")
	.get(authenticate, requireRole(["teacher"]), listProjects)
	.post(authenticate, requireRole(["student"]), createProject);

// Current user's projects
projectsRouter
	.route("/me")
	.get(authenticate, listUserProjects);

// Individual project
projectsRouter
	.route("/:projectId")
	.get(authenticate, getProject)
	.put(authenticate, updateProject)
	.delete(authenticate, deleteProject);

// Project members subcollection
projectsRouter
	.route("/:projectId/members")
	.get(authenticate, listProjectMembers)


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

projectsRouter.route("/joinProject")
	.post(authenticate, addProjectMember);

// Project statistics (future feature)
//projectsRouter
//	.route("/statistics")
//	.get(authenticate, requireRole(["teacher"]), getProjectStatistics);

export default projectsRouter;