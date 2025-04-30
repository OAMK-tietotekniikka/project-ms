import { Router } from "express";
import { createResource, getResources, updateResource, allocateTeacher, incrementResourceUsage, decrementResourceUsage } from "../controllers/resources.controller";
import { verifyToken } from "../entraTokenValidation";

const resourcesRouter = Router();

resourcesRouter.route('/')
    .get(getResources)
    .post(createResource);

resourcesRouter.route('/:resource_id')
    .put(updateResource);

// Add new routes
resourcesRouter.post('/allocate-teacher', allocateTeacher);
resourcesRouter.post('/increment-usage', incrementResourceUsage);
resourcesRouter.post('/decrement-usage', decrementResourceUsage);


export default resourcesRouter;


