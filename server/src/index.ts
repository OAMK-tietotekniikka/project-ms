import dotenv from "dotenv";
import path from "path";

dotenv.config({
	path: path.resolve(__dirname, "../../.env"),
});

import { App } from "./app";
import { connectRedis } from "./config/redis.config";

const start = async (): Promise<void> => {
	console.log("Environment variables loaded:");
	console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
	console.log(`SERVER_PORT: ${process.env.SERVER_PORT}`);
	console.log(`DB_HOST: ${process.env.DB_HOST}`);
	console.log(`REDIS_HOST: ${process.env.REDIS_HOST}`);
	try {
		await connectRedis();
		const app = new App();
		app.listen();
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

start();
