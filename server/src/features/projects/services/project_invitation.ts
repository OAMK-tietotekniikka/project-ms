import { redisClient } from "../../../config/redis.config";
import crypto from "crypto";

interface GroupOTP {
	project_id: string;
	createdAt: number;
	expiresAt: number;
}

export class OTPService {
	private static OTP_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
	private static OTP_PREFIX = "project_otp:";
	private static PROJECT_PREFIX = "project_code:";
	private static MAX_GENERATION_ATTEMPTS = 5;

	static async generateProjectOTP(project_id: string): Promise<string> {
		let attempts = 0;

		while (attempts < this.MAX_GENERATION_ATTEMPTS) {
			const otp = crypto.randomInt(100000, 999999).toString();
			const key = `${this.OTP_PREFIX}${otp}`;

			// Check if this OTP already exists
			const exists = await redisClient.exists(key);
			if (!exists) {
				const otpData: GroupOTP = {
					project_id,
					createdAt: Date.now(),
					expiresAt: Date.now() + this.OTP_EXPIRY * 1000,
				};

				// Store OTP
				await redisClient.setEx(key, this.OTP_EXPIRY, JSON.stringify(otpData));

				// Store reverse mapping for project -> code lookup
				await redisClient.setEx(
					`${this.PROJECT_PREFIX}${project_id}`,
					this.OTP_EXPIRY,
					otp,
				);

				return otp;
			}
			attempts++;
		}

		throw new Error("Failed to generate unique OTP after maximum attempts");
	}

	// Check if project already has an active code
	static async getExistingCodeForProject(
		project_id: string,
	): Promise<string | null> {
		const code = await redisClient.get(`${this.PROJECT_PREFIX}${project_id}`);

		// Verify the code still exists and is valid
		if (code) {
			const otpData = await this.getOTPInfo(code);
			if (otpData && otpData.project_id === project_id) {
				return code;
			} else {
				// Clean up invalid reverse mapping
				await redisClient.del(`${this.PROJECT_PREFIX}${project_id}`);
			}
		}

		return null;
	}

	// Validate and get project info from OTP
	static async validateAndJoinProject(
		otp: string,
	): Promise<{ project_id: string } | null> {
		const key = `${this.OTP_PREFIX}${otp}`;
		const otpDataStr = await redisClient.get(key);
		console.log(otp);
		if (!otpDataStr) {
			return null;
		}

		const otpData: GroupOTP = JSON.parse(otpDataStr);

		// Check if expired
		if (Date.now() > otpData.expiresAt) {
			await this.invalidateOTP(otp);
			return null;
		}

		return {
			project_id: otpData.project_id,
		};
	}

	// Get OTP information
	static async getOTPInfo(otp: string): Promise<GroupOTP | null> {
		const otpDataStr = await redisClient.get(`${this.OTP_PREFIX}${otp}`);
		return otpDataStr ? JSON.parse(otpDataStr) : null;
	}

	// Invalidate OTP and clean up reverse mapping
	static async invalidateOTP(otp: string): Promise<boolean> {
		const otpData = await this.getOTPInfo(otp);

		if (otpData) {
			// Remove reverse mapping
			await redisClient.del(`${this.PROJECT_PREFIX}${otpData.project_id}`);
		}

		// Remove OTP
		const result = await redisClient.del(`${this.OTP_PREFIX}${otp}`);
		return result === 1;
	}
}
