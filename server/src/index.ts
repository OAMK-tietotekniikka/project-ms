import dotenv from "dotenv";
import path from "path";

dotenv.config({
	path: path.resolve(__dirname, "../../.env"),
});

import { App } from "./app";
import { connectRedis } from "./config/redis.config";
import pool from "./config/mariadb.config";

const start = async (): Promise<void> => {
	console.log("Environment variables loaded:");
	console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
	console.log(`SERVER_PORT: ${process.env.SERVER_PORT}`);
	console.log(`DB_HOST: ${process.env.DB_HOST}`);
	console.log(`REDIS_HOST: ${process.env.REDIS_HOST}`);
	try {
		//await connectRedis();
		const app = new App();
		const server = app.listen(); // Store server reference

		// shutdown
		const gracefulShutdown = async (signal: string) => {
			console.log(`\nReceived ${signal}. Starting shutdown...`);

			// Stop accepting new connections
			server.close(async () => {
				console.log("HTTP server closed.");

				try {
					// Close database pool
					console.log("Closing database pool...");
					await pool.end();
					console.log("Database pool closed.");

					// Close Redis connection if needed
					// await redis.quit();

					console.log("Shutdown completed.");
					process.exit(0);
				} catch (error) {
					console.error("Error during graceful shutdown:", error);
					process.exit(1);
				}
			});

			// Force close after timeout
			setTimeout(() => {
				console.error(
					"Could not close connections in time, forcefully shutting down",
				);
				process.exit(1);
			}, 10000);
		};

		process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
		process.on("SIGINT", () => gracefulShutdown("SIGINT"));
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

start();
