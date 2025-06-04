import { Router } from "express";
import {
	createResource,
	decrementResourceUsage,
	getResources,
	updateResource,
} from "../controllers/resources.controller";

const resourcesRouter = Router();

resourcesRouter.route("/").get(getResources).post(createResource);

resourcesRouter.route("/:resource_id").put(updateResource);

// Add new routes
resourcesRouter.post("/decrement-usage", decrementResourceUsage);

export default resourcesRouter;
