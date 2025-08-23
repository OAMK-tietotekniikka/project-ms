import dotenv from "dotenv";
import path from "path";

export const loadEnv = () => {
	const nodeEnv = process.env.NODE_ENV === "test" ? ".test" : "";
	const rootPath = path.resolve(__dirname, "..", "..", "..");
	console.log("env file: ", rootPath, nodeEnv);

	// Load environment-specific file
	// e.g., .env.development, .env.test
	const envFile = `.env${nodeEnv}`;
	dotenv.config({
		path: path.join(rootPath, envFile),
	});
};
