import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";

import authRouter from "./features/auth/routes/auth.routes";
import companiesRouter from "./features/companies/routes/company.routes";
import projectsRouter from "./features/projects/routes/project.routes";
import resourcesRouter from "./features/teachers/routes/resource.routes";
import studentsRouter from "./features/students/routes/student.routes";
import teachersRouter from "./features/teachers/routes/teacher.routes";

export class App {
	private readonly app: Application;
	private readonly APPLICATION_RUNNING = "Application running on: ";
	private readonly ROUTE_NOT_FOUND = "Route does not exist!";

	constructor(
		private readonly port: number | string = process.env.SERVER_PORT || 8080,
	) {
		this.app = express();
		this.middlewares();
		this.routes();
	}

	listen(): void {
		this.app.listen(this.port, () => {
			console.info(`${this.APPLICATION_RUNNING} port: ${this.port}`);
		});
	}

	private middlewares(): void {
		this.app.use(cors({ origin: "*" }));
		this.app.use(express.json());
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

		this.app.all("/*splat", (req: Request, res: Response) => {
			res.status(404).send({ message: this.ROUTE_NOT_FOUND });
		});
	}
}
