import type { Request } from "express";
import logger from "./logger";

export function logRequests(
	req: Request,
	additionalInfo?: Record<string, any>,
): void {
	const ip = req.ip || req.socket.remoteAddress || "unknown";

	let userAgent = req.get("User-Agent") || "unknown";
	userAgent = userAgent.replace(/[\n\r]/g, "");
	const contentLength = req.get("Content-Length") || "0";

	let logMessage = `${req.method} ${req.originalUrl} | IP: ${ip}`;

	if ((req as any).user?.email) {
		const email = (req as any).user.email;
		const domain = email.includes("@") ? email.split("@")[0] : email;
		logMessage += ` | User: ${domain}`;
	}

	if (process.env.NODE_ENV === "development") {
		logMessage += ` | UA: ${userAgent.substring(0, 50)}${userAgent.length > 50 ? "..." : ""}`;
		logMessage += ` | Size: ${contentLength}b`;
	}

	// Add any additional context
	if (additionalInfo) {
		logMessage += ` | ${JSON.stringify(additionalInfo)}`;
	}

	logger.info(logMessage);
}

// Performance logging
export function logPerformance(
	operation: string,
	startTime: number,
	additionalInfo?: Record<string, any>,
): void {
	const duration = Date.now() - startTime;
	let message = `${operation} completed in ${duration}ms`;

	if (additionalInfo) {
		message += ` | ${JSON.stringify(additionalInfo)}`;
	}

	// Warn if operation is slow
	if (duration > 1000) {
		logger.warn(`SLOW OPERATION: ${message}`);
	} else {
		logger.info(message);
	}
}

// Database operation logging
export function logDatabaseOperation(
	query: string,
	duration: number,
	rowCount?: number,
): void {
	const sanitizedQuery = query.replace(/\s+/g, " ").trim().substring(0, 100);
	let message = `DB Query: ${sanitizedQuery}... | ${duration}ms`;

	if (rowCount !== undefined) {
		message += ` | ${rowCount} rows`;
	}

	if (duration > 500) {
		logger.warn(`SLOW QUERY: ${message}`);
	} else {
		logger.debug(message);
	}
}

// Security event logging
export function logSecurityEvent(
	event: string,
	details: Record<string, any>,
	req?: Request,
): void {
	let message = `SECURITY: ${event}`;

	if (req) {
		const ip = req.ip || req.socket.remoteAddress || "unknown";
		const sanitizedUrl = req.originalUrl.replace(/[\r\n]/g, "");
		message += ` | IP: ${ip} | Path: ${sanitizedUrl}`;
	}

	message += ` | Details: ${JSON.stringify(details)}`;

	logger.warn(message);
}
