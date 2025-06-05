import type { Request } from "express";
import logger from "./logger";

export function logRequests(req: Request): void {
	const ip = req.ip || req.socket.remoteAddress;
	logger.info(`${req.method} ${req.originalUrl} | ${ip}`);
}
