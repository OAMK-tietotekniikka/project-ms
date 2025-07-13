import { App } from "./app";
import { connectRedis } from "./shared/config/redis.config";

const start = async (): Promise<void> => {
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
