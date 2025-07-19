import { redisClient } from "../../../config/redis.config";
import mariadb from "mariadb";
import pool from "../../../config/mariadb.config";
import {
	NotificationEvent,
	NotificationSummary,
} from "../../../core/types/notification";

export class NotificationService {
	private static instance: NotificationService;

	public static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}
		return NotificationService.instance;
	}

	// Redis Keys
	private getActiveUsersKey(userType: "teacher" | "student"): string {
		return `notifications:users:${userType}`;
	}

	private getEventsKey(date: string): string {
		return `notifications:events:${date}`;
	}

	private getSummaryKey(
		userId: number,
		userType: "teacher" | "student",
		date: string,
	): string {
		return `notifications:summary:${userType}:${userId}:${date}`;
	}

	private getEmailQueueKey(): string {
		return `notifications:queue:email`;
	}

	public async refreshActiveUsers(): Promise<void> {
		let connection: mariadb.PoolConnection | null = null;

		try {
			connection = await pool.getConnection();

			// Get teachers who want email notifications
			const teachersQuery = `
                SELECT DISTINCT user_id 
                FROM notification_preferences 
                WHERE user_type = 'teacher' 
                AND email_enabled = TRUE
            `;
			const teachers = await connection.query(teachersQuery);

			// Get students who want email notifications
			const studentsQuery = `
                SELECT DISTINCT user_id 
                FROM notification_preferences 
                WHERE user_type = 'student' 
                AND email_enabled = TRUE
            `;
			const students = await connection.query(studentsQuery);

			// Clear and repopulate Redis sets
			await redisClient.del(this.getActiveUsersKey("teacher"));
			await redisClient.del(this.getActiveUsersKey("student"));

			if (teachers.length > 0) {
				await redisClient.sAdd(
					this.getActiveUsersKey("teacher"),
					teachers.map((t: any) => t.user_id.toString()),
				);
			}

			if (students.length > 0) {
				await redisClient.sAdd(
					this.getActiveUsersKey("student"),
					students.map((s: any) => s.user_id.toString()),
				);
			}

			console.log(
				`Refreshed ${teachers.length} teachers and ${students.length} students for notifications`,
			);
		} catch (error) {
			console.error("Error refreshing active users:", error);
		} finally {
			if (connection) connection.release();
		}
	}

	public async addEvent(event: NotificationEvent): Promise<void> {
		const today = new Date().toISOString().split("T")[0];
		const eventKey = this.getEventsKey(today);

		try {
			// 1 day
			await redisClient.expire(eventKey, 24 * 60 * 60);

			// Update user's daily summary
			await this.updateUserSummary(event, today);
		} catch (error) {
			console.error("Error adding notification event:", error);
		}
	}

	private async updateUserSummary(
		event: NotificationEvent,
		date: string,
	): Promise<void> {
		const baseKey = `notifications:summary:${event.userType}:${event.userId}:${date}`;

		try {
			switch (event.type) {
				case "teacher_update":
					// Just increment counter for teacher updates
					await redisClient.hIncrBy(baseKey, "teacher_updates", 1);
					break;

				case "resource_update":
					// Store unique study years in a set
					await redisClient.sAdd(
						`${baseKey}:resource_years`,
						event.data.studyYears,
					);
					break;

				case "project_details_update":
				case "project_teacher_update":
				case "project_status_update":
					// Store unique project IDs in a set
					if (event.relatedIds?.projectId) {
						await redisClient.sAdd(
							`${baseKey}:updated_projects`,
							event.relatedIds.projectId.toString(),
						);
					}
					break;

				case "project_note_added":
					// Count towards project updates AND increment notes counter
					if (event.relatedIds?.projectId) {
						await redisClient.sAdd(
							`${baseKey}:updated_projects`,
							event.relatedIds.projectId.toString(),
						);
					}
					await redisClient.hIncrBy(baseKey, "new_notes", 1);
					break;

				case "student_joined_project":
					// Count towards project updates AND increment students counter
					if (event.relatedIds?.projectId) {
						await redisClient.sAdd(
							`${baseKey}:updated_projects`,
							event.relatedIds.projectId.toString(),
						);
					}
					await redisClient.hIncrBy(baseKey, "students_joined", 1);
					break;
			}

			// Set expiration on all keys
			await redisClient.expire(baseKey, 24 * 60 * 60);
			await redisClient.expire(`${baseKey}:updated_projects`, 24 * 60 * 60);
			await redisClient.expire(`${baseKey}:resource_years`, 24 * 60 * 60);

			const r = await this.getUserSummary(event.userId, event.userType, date);
			console.log("--------");
			console.log(r);
			console.log("resources", r?.events.resource_updates.study_years);
			console.log("projects", r?.events.project_updates.project_ids);
		} catch (error) {
			console.error("Error updating user summary:", error);
		}
	}

	public async getUserSummary(
		userId: number,
		userType: "teacher" | "student",
		date: string,
	): Promise<NotificationSummary | null> {
		const baseKey = `notifications:summary:${userType}:${userId}:${date}`;

		try {
			// Get all data in parallel
			const [counters, updatedProjects, resourceYears] = await Promise.all([
				redisClient.hGetAll(baseKey),
				redisClient.sMembers(`${baseKey}:updated_projects`),
				redisClient.sMembers(`${baseKey}:resource_years`),
			]);

			if (
				Object.keys(counters).length === 0 &&
				updatedProjects.length === 0 &&
				resourceYears.length === 0
			) {
				return null;
			}

			return {
				userId,
				userType,
				date,
				events: {
					teacher_updates: parseInt(counters.teacher_updates || "0"),

					// Projects: count + list of IDs
					project_updates: {
						count: updatedProjects.length,
						project_ids: updatedProjects.map((id) => parseInt(id)),
					},

					// Resources: count + list of years
					resource_updates: {
						count: resourceYears.length,
						study_years: resourceYears,
					},

					// Simple counters
					new_notes: parseInt(counters.new_notes || "0"),
					students_joined: parseInt(counters.students_joined || "0"),
				},
			};
		} catch (error) {
			console.error("Error getting user summary:", error);
			return null;
		}
	}

	public async notifyTeacherUpdate(
		teacherId: number,
		newName: string,
	): Promise<void> {
		// Check if teacher wants notifications
		const isActive = await redisClient.sIsMember(
			this.getActiveUsersKey("teacher"),
			teacherId.toString(),
		);

		if (isActive) {
			const event: NotificationEvent = {
				type: "teacher_update",
				timestamp: new Date().toISOString(),
				userId: teacherId,
				userType: "teacher",
				data: { newName },
				relatedIds: { teacherId },
			};

			await this.addEvent(event);
		}
	}

	public async notifyResourceUpdate(
		teacherId: number,
		studyYears: string,
		oldResources: number,
		newResources: number,
	): Promise<void> {
		const isActive = await redisClient.sIsMember(
			this.getActiveUsersKey("teacher"),
			teacherId.toString(),
		);
		if (isActive) {
			const event: NotificationEvent = {
				type: "resource_update",
				timestamp: new Date().toISOString(),
				userId: teacherId,
				userType: "teacher",
				data: { studyYears, oldResources, newResources },
				relatedIds: { teacherId },
			};
			console.log("yes", event);
			await this.addEvent(event);
		}
	}

	public async notifyProjectTeacherUpdate(
		projectId: number,
		oldTeacherId: number | null,
		newTeacherId: number | null,
	): Promise<void> {
		// Notify old teacher
		console.log("old", oldTeacherId);
		console.log("new", newTeacherId);
		console.log("project", projectId);
		if (oldTeacherId) {
			const isActive = await redisClient.sIsMember(
				this.getActiveUsersKey("teacher"),
				oldTeacherId.toString(),
			);
			if (isActive) {
				const event: NotificationEvent = {
					type: "project_teacher_update",
					timestamp: new Date().toISOString(),
					userId: oldTeacherId,
					userType: "teacher",
					data: { projectId, action: "removed" },
					relatedIds: { teacherId: oldTeacherId, projectId },
				};
				console.log(event);
				await this.addEvent(event);
			}
		}

		// Notify new teacher
		if (newTeacherId) {
			const isActive = await redisClient.sIsMember(
				this.getActiveUsersKey("teacher"),
				newTeacherId.toString(),
			);
			if (isActive) {
				const event: NotificationEvent = {
					type: "project_teacher_update",
					timestamp: new Date().toISOString(),
					userId: newTeacherId,
					userType: "teacher",
					data: { projectId, action: "assigned" },
					relatedIds: { teacherId: newTeacherId, projectId },
				};
				console.log(event);
				await this.addEvent(event);
			}
		}
	}

	public async notifyProjectStatusUpdate(
		projectId: number,
		teacherId: number,
		newStatus: string,
	): Promise<void> {
		const isActive = await redisClient.sIsMember(
			this.getActiveUsersKey("teacher"),
			teacherId.toString(),
		);
		if (isActive) {
			const event: NotificationEvent = {
				type: "project_status_update",
				timestamp: new Date().toISOString(),
				userId: teacherId,
				userType: "teacher",
				data: { projectId, newStatus },
				relatedIds: { teacherId, projectId },
			};

			await this.addEvent(event);
		}
	}

	public async notifyProjectDetailsUpdate(
		projectId: number,
		teacherId: number,
	): Promise<void> {
		const isActive = await redisClient.sIsMember(
			this.getActiveUsersKey("teacher"),
			teacherId.toString(),
		);

		if (isActive) {
			const event: NotificationEvent = {
				type: "project_details_update",
				timestamp: new Date().toISOString(),
				userId: teacherId,
				userType: "teacher",
				data: { projectId },
				relatedIds: { teacherId, projectId },
			};

			await this.addEvent(event);
		}
	}

	public async notifyStudentJoinedProject(
		projectId: number,
		teacherId: number,
	): Promise<void> {
		// Notify teacher
		const isTeacherActive = await redisClient.sIsMember(
			this.getActiveUsersKey("teacher"),
			teacherId.toString(),
		);
		if (isTeacherActive) {
			const event: NotificationEvent = {
				type: "student_joined_project",
				timestamp: new Date().toISOString(),
				userId: teacherId,
				userType: "teacher",
				data: { projectId, action: "student_joined" },
				relatedIds: { teacherId, projectId },
			};
			await this.addEvent(event);
		}
	}
}
