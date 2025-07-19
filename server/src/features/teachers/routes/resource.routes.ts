import { Router } from "express";
import {
	createResource,
	listTeacherResources,
	getCurrentUserResources,
	updateResource,
	//	deleteResource,
} from "../controllers/teacher_resources.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";

const resourcesRouter: Router = Router();

// Current user's resources
resourcesRouter
	.route("/me")
	.get(authenticate, requireRole(["teacher"]), getCurrentUserResources)
	.post(authenticate, requireRole(["teacher"]), createResource);

// Individual resource
resourcesRouter
	.route("/:resourceId")
	.put(authenticate, requireRole(["teacher"]), updateResource);
//.delete(authenticate, requireRole(["teacher"]), deleteResource);

// Teacher's resources
resourcesRouter
	.route("/teachers/:teacherId")
	.get(authenticate, requireRole(["teacher"]), listTeacherResources);

export default resourcesRouter;
