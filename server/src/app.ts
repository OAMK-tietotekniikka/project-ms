import cors from "cors";
import express, {
	type Application,
	ErrorRequestHandler,
	NextFunction,
	type Request,
	type Response,
} from "express";

import authRouter from "./features/auth/routes/auth.routes";
import companiesRouter from "./features/companies/routes/company.routes";
import projectsRouter from "./features/projects/routes/project.routes";
import resourcesRouter from "./features/teachers/routes/resource.routes";
import studentsRouter from "./features/students/routes/student.routes";
import teachersRouter from "./features/teachers/routes/teacher.routes";
import { logError } from "./shared/utils/log_errors";

export class App {
	private readonly app: Application;
	private readonly APPLICATION_RUNNING = "Application running on: ";
	private readonly ROUTE_NOT_FOUND = "Route does not exist!";
	private readonly INTERNAL_SERVER_ERROR = "Internal server error";

	constructor(
		private readonly port: number | string = process.env.SERVER_PORT || 8080,
	) {
		this.app = express();
		this.setupMiddlewares();
		this.routes();
		this.setupErrorHandling();
	}

	listen(): void {
		this.app.listen(this.port, () => {
			console.info(`${this.APPLICATION_RUNNING} port: ${this.port}`);
		});
	}

	private setupMiddlewares(): void {
		this.app.use(
			cors({
				origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
				credentials: true,
			}),
		);
		this.app.use(express.json({ limit: "10mb" }));
		this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

		this.app.use(this.timeoutMiddleware());
	}

	private routes(): void {
		this.app.use("/api/v2/students", studentsRouter);
		this.app.use("/api/v2/projects", projectsRouter);
		this.app.use("/api/v2/companies", companiesRouter);
		this.app.use("/api/v2/teachers", teachersRouter);
		this.app.use("/api/v2/resources", resourcesRouter);

		const current_env = "development"; // should be remove later on
		if (current_env === "development") {
			this.app.use("/api/v2/auth", authRouter);
		}

		this.app.get("/health", (req: Request, res: Response) => {
			res
				.status(200)
				.json({ status: "OK", timestamp: new Date().toISOString() });
		});

		this.app.all("/*splat", (req: Request, res: Response) => {
			logError("Route not found", `${req.method} ${req.originalUrl}`);
			res.status(404).send({ message: this.ROUTE_NOT_FOUND });
		});
	}

	private setupErrorHandling(): void {
		this.app.use(this.globalErrorHandler.bind(this));
	}

	private timeoutMiddleware() {
		return (req: Request, res: Response, next: NextFunction): void => {
			const timeout = setTimeout(() => {
				if (!res.headersSent) {
					logError("Request timeout", `${req.method} ${req.originalUrl}`);
					res.status(408).json({
						error: "Request timeout",
						message: "Request took too long to process",
					});
				}
			}, 15000);

			res.on("finish", () => clearTimeout(timeout));
			res.on("close", () => clearTimeout(timeout));
			next();
		};
	}

	private globalErrorHandler: ErrorRequestHandler = (
		error: Error,
		req: Request,
		res: Response,
		next: NextFunction,
	): void => {
		// Log the error
		logError("Global error handler", error);

		// Don't send response if headers already sent
		if (res.headersSent) {
			return next(error);
		}

		const errorResponse = this.buildErrorResponse(error, req);
		res.status(errorResponse.status).json(errorResponse.body);
	};

	private buildErrorResponse(error: Error, req: Request) {
		const isDevelopment = process.env.NODE_ENV === "development";

		// Default error response
		let status = 500;
		let message = this.INTERNAL_SERVER_ERROR;
		let details: any = undefined;

		const errorBody: any = {
			error: error.name || "InternalServerError",
			message,
			timestamp: new Date().toISOString(),
			path: req.originalUrl,
			method: req.method,
		};

		if (isDevelopment) {
			errorBody.details = error.message;
			errorBody.stack = error.stack;
		}

		return { status, body: errorBody };
	}
}
