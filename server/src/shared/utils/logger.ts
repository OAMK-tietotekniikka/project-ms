import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: winston.format.combine(
		winston.format.timestamp({ format: "DD.MM HH:mm:ss" }),
		winston.format.errors({ stack: true }),
		winston.format.printf(({ level, message, timestamp, stack }) => {
			const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
			return stack ? `${logMessage}\n${stack}` : logMessage;
		}),
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.timestamp({ format: "DD.MM HH:mm:ss" }),
				winston.format.printf(({ level, message, timestamp }) => {
					return `[${timestamp}] ${level}: ${message}`;
				}),
			),
		}),
	],
});

// Add file transport in production
// TODO remove cond
if (process.env.NODE_ENV === "production") {
	logger.add(
		new DailyRotateFile({
			filename: "logs/[error]-%DATE%.log",
			datePattern: "DD-MM-YYYY",
			level: "error",
			maxSize: "3m", // ~ 3000 errors per day
			maxFiles: "365d",
		}),
	);

	logger.add(
		new DailyRotateFile({
			filename: "logs/[combined]-%DATE%.log",
			datePattern: "DD-MM-YYYY",
			maxSize: "8m", // ~ 8000 requests per day
			maxFiles: "45d",
		}),
	);
}

export default logger;
