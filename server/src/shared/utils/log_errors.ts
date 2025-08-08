import logger from "./logger";

export function logError(
	location: string,
	error: unknown,
	context?: Record<string, any>,
): void {
	let errorMessage: string;
	let errorContext = context ? ` | Context: ${JSON.stringify(context)}` : "";

	if (error instanceof Error) {
		const rawMessage = error.stack || error.message;
		errorMessage = rawMessage.replace(/[\n\r]/g, "");

		// Add error type information
		if (error.name !== "Error") {
			errorMessage = `[${error.name}] ${errorMessage}`;
		}
	} else {
		errorMessage = String(error).replace(/[\n\r]/g, "");
	}

	logger.error(`${location}: ${errorMessage}${errorContext}`);
}
