import { loadEnv } from "./config/env";
loadEnv();
import { App } from "./app";
import pool from "./config/mariadb.config";

const start = async (): Promise<void> => {
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
