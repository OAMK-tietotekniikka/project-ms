import { NextFunction, Request, Response } from "express";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient, { SigningKey } from "jwks-rsa";
import { authConfig } from "../authConfig";

interface DecodedToken {
	oid?: string;
	upn?: string;
	email?: string;
	roles?: string[];
	groups?: string[];
	sub?: string;
	iss?: string;
	aud?: string;
	exp?: number;
	role?: string;
	[key: string]: any;
}

export interface AuthenticatedRequest extends Request {
	user?: DecodedToken;
}

const client = jwksClient({
	jwksUri: authConfig.jwksUri,
	cache: true,
	cacheMaxAge: 24 * 1000 * 60 * 60,
	cacheMaxEntries: 3,
});

function getKey(header: JwtHeader, callback: SigningKeyCallback): void {
	client.getSigningKey(
		header.kid as string,
		(err: Error | null, key?: SigningKey) => {
			if (err || !key) {
				callback(err, undefined);
				console.log("Error retrieving signing key");
				return;
			}
			const signingKey = key?.getPublicKey();
			callback(null, signingKey);
			console.log("Signing key retrieved", signingKey);
			return;
		},
	);
}

export const validateToken = (token: string): Promise<DecodedToken> => {
	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			getKey,
			{
				algorithms: ["RS256"],
				audience: authConfig.audience,
				issuer: authConfig.authority,
			},
			(err, decoded) => {
				if (err) {
					reject(err);
				} else {
					const payload = decoded as DecodedToken;

					resolve({
						email: payload.email,
						role: assignRole(payload.groups?.[0]),
					});
				}
			},
		);
	});
};

export const decodeTokenTest = (token: string): Promise<DecodedToken> => {
	return new Promise((resolve, reject) => {
		try {
			const decoded = jwt.decode(token) as DecodedToken | null;

			if (!decoded) {
				return reject(new Error("Invalid token"));
			}

			resolve({
				email: decoded.email,
				role: assignRole(decoded.groups?.[0]),
			});
		} catch (err) {
			reject(err);
		}
	});
};

const assignRole = (groupid: undefined | string): string => {
	let role: string;
	if (groupid === "559e9aa0-84e4-49ac-b339-b41ae22740fa") {
		role = "student";
	} else if (groupid === "10073ee5-6b85-4701-ada7-e6bad5c4718d") {
		role = "teacher";
	} else {
		role = "visitor";
	}
	return role;
};

export const authenticate = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			res.status(401).json({
				error: "Bad token",
			});
			return;
		}

		const token = authHeader.substring(7);
		//req.user = await validateToken(token); !! TBD PRODUCTION
		req.user = await decodeTokenTest(token);
		next();
	} catch (error) {
		res.status(401).json({
			error: "Bad token",
		});
		return;
	}
};

export const requireRole = (allowedRoles: string[] | string) => {
	const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({
				error: "User not authenticated",
			});
			return;
		}
		const userRole = req.user.role;

		const hasRequiredRole = roles.some((role) => userRole === role);
		if (!hasRequiredRole) {
			res.status(403).json({
				error: "Insufficient permissions",
				required: roles,
				current: userRole,
			});
			return;
		}
		next();
	};
};
