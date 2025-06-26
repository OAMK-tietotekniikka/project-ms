import { Router } from "express";
import {
	createResource,
	decrementResourceUsage,
	getAnyTeacherResources,
	getIndividualResources,
	getResources,
	updateResource,
} from "../controllers/resources.controller";
import { authenticate, requireRole } from "../middleware/auth";

const resourcesRouter = Router();

resourcesRouter
	.route("/me")
	.get(
		authenticate,
		requireRole(["teacher"]),
		getIndividualResources,
		//getResources)
	)
	.post(authenticate, requireRole(["teacher"]), createResource);

resourcesRouter
	.route("/:resource_id")
	.put(authenticate, requireRole(["teacher"]), updateResource);

resourcesRouter
	.route("/:teacher_id")
	.get(authenticate, requireRole(["teacher"]), getAnyTeacherResources);
export default resourcesRouter;
