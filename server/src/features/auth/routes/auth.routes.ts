import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { authenticate } from "../../../shared/middleware/auth";

const authRouter: Router = Router();

authRouter.route("/login").post(authenticate, login);

export default authRouter;
