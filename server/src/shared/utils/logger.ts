import winston from "winston";

const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp({ format: "DD.MM HH:mm:ss" }),
		winston.format.printf(({ level, message, timestamp }) => {
			return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
		}),
	),

	transports: [new winston.transports.Console()],
});

export default logger;
