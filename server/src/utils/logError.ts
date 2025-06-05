import logger from "./logger";

export function logError(location: string, error: unknown): void {
	let errorMessage: string;

	if (error instanceof Error) {
		errorMessage = error.stack || error.message;
	} else {
		errorMessage = String(error);
	}

	logger.error(`${location}: ${errorMessage}`);
}
