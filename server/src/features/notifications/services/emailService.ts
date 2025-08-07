import FormData from "form-data";
import Mailgun from "mailgun.js";
import { redisClient } from "../../../config/redis.config";
import pool from "../../../config/mariadb.config";
import { getUserSummary } from "./notificationService";
import { NotificationSummary } from "../../../core/types/notification";
// Initialize Mailgun
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
	username: "api",
	key: "",
	url: "https://api.eu.mailgun.net",
});

const EMAIL_QUEUE_KEY = "notifications:queue:email";
const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const processEmailQueue = async (): Promise<void> => {
	try {
		// Get all pending email tasks from Redis queue
		const emailTasks = await redisClient.lRange(EMAIL_QUEUE_KEY, 0, -1);

		if (emailTasks.length === 0) {
			console.log("No pending email tasks in queue");
			return;
		}

		console.log(`Processing ${emailTasks.length} email tasks`);

		for (const taskJson of emailTasks) {
			try {
				const task = JSON.parse(taskJson);
				await sendNotificationEmail(task.userId, task.userType, task.date);

				// Remove processed task from queue
				await redisClient.lRem(EMAIL_QUEUE_KEY, 1, taskJson);
				await delay(500);
			} catch (error) {
				console.error("Error processing email task:", error);
			}
		}
	} catch (error) {
		console.error("Error processing email queue:", error);
	}
};

export const sendDailySummaryEmails = async (): Promise<void> => {
	const today = new Date().toISOString().split("T")[0];

	try {
		const [teachers] = await Promise.all([
			redisClient.sMembers("notifications:users:teacher"),
			//redisClient.sMembers("notifications:users:student")
		]);

		// Process teachers
		for (const teacherId of teachers) {
			await queueNotificationEmail(parseInt(teacherId), "teacher", today);
		}

		console.log(`Queued daily summary emails for ${teachers.length} teachers`);
	} catch (error) {
		console.error("Error queuing daily summary emails:", error);
	}
};

const queueNotificationEmail = async (
	userId: number,
	userType: "teacher" | "student",
	date: string,
): Promise<void> => {
	// Check if user has notifications for this date
	const summary = await getUserSummary(userId, userType, date);
	console.log(summary);
	if (!summary) {
		return; // No notifications to send
	}

	const emailTask = {
		userId,
		userType,
		date,
		timestamp: new Date().toISOString(),
	};

	await redisClient.lPush(EMAIL_QUEUE_KEY, JSON.stringify(emailTask));
};

const sendNotificationEmail = async (
	userId: number,
	userType: "teacher" | "student",
	date: string,
): Promise<void> => {
	try {
		// Get user info and summary
		const [userInfo, summary] = await Promise.all([
			getUserInfo(userId, userType),
			getUserSummary(userId, userType, date),
		]);

		if (!userInfo || !summary) {
			console.log(`No data found for user ${userId} (${userType})`);
			return;
		}

		console.log("user", userInfo);

		const emailHtml = generateEmailTemplate(userInfo, summary);

		const emailData = {
			from: "Project Management System <noreply@pms.oulu.se>",
			to: [userInfo.email],
			subject: `Päivittäinen aktiivisuusyhteenveto: ${formatDate(date)}`,
			html: emailHtml,
		};

		const result = await mg.messages.create("pms.oulu.se", emailData);
		console.log(`Email sent to ${userInfo.email}:`, result.id);
	} catch (error) {
		console.error(`Error sending email to user ${userId}:`, error);
		throw error; // Re-throw to handle in queue processing
	}
};

const getUserInfo = async (
	userId: number,
	userType: "teacher" | "student",
): Promise<any> => {
	let connection = null;
	try {
		connection = await pool.getConnection();

		const table = userType === "teacher" ? "teachers" : "students";
		const query = `SELECT teacher_id, teacher_name, email FROM ${table} WHERE teacher_id = ?`;
		const result = await connection.query(query, [userId]);

		return result[0] || null;
	} catch (error) {
		console.error("Error getting user info:", error);
		return null;
	} finally {
		if (connection) connection.release();
	}
};

const generateEmailTemplate = (
	userInfo: any,
	summary: NotificationSummary,
): string => {
	const { events } = summary;

	return `
    <!DOCTYPE html>
    <html lang="fi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Päivittäinen yhteenveto</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Google Sans', Arial, sans-serif; background-color: #f8f9fa;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
            <tr>
                <td align="center" style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #dadce0;" role="presentation">
                        
                        <!-- Header -->
                        <tr>
                            <td align="left" style="padding: 24px 24px 16px; border-bottom: 1px solid #dadce0;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #202124;">Hei!</h1>
                                <p style="margin: 4px 0 0; color: #5f6368; font-size: 16px;">
                                Päivittäinen aktiivisuusyhteenvetosi ${formatDate(summary.date)}
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Stats Grid Section -->
                        <tr>
                            <td style="padding: 24px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                    <tr>
                                        <td align="center" width="50%" style="padding-bottom: 16px; padding-right: 8px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 8px;" role="presentation">
                                                <tr>
                                                    <td align="center" style="padding: 16px;">
                                                        <div style="font-size: 28px; font-weight: 700; color: #FF8800; margin-bottom: 4px;">${events.teacher_updates}</div>
                                                        <div style="font-size: 14px; color: #5f6368; font-weight: 500;">
                                                        Opettajapäivitykset
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td align="center" width="50%" style="padding-bottom: 16px; padding-left: 8px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 8px;" role="presentation">
                                                <tr>
                                                    <td align="center" style="padding: 16px;">
                                                        <div style="font-size: 28px; font-weight: 700; color: #FF8800; margin-bottom: 4px;">${events.project_updates.count}</div>
                                                        <div style="font-size: 14px; color: #5f6368; font-weight: 500;">
                                                        Projektipäivitykset  
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" width="50%" style="padding-top: 0; padding-right: 8px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 8px;" role="presentation">
                                                <tr>
                                                    <td align="center" style="padding: 16px;">
                                                        <div style="font-size: 28px; font-weight: 700; color: #FF8800; margin-bottom: 4px;">${events.resource_updates.count}</div>
                                                        <div style="font-size: 14px; color: #5f6368; font-weight: 500;">
                                                        Resurssipäivitykset  
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td align="center" width="50%" style="padding-top: 0; padding-left: 8px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 8px;" role="presentation">
                                                <tr>
                                                    <td align="center" style="padding: 16px;">
                                                        <div style="font-size: 28px; font-weight: 700; color: #FF8800; margin-bottom: 4px;">${events.students_joined}</div>
                                                        <div style="font-size: 14px; color: #5f6368; font-weight: 500;">
                                                        Uudet opiskelijat  
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        ${events.project_updates.count > 0 ? generateProjectsSection(events.project_updates.project_ids) : ""}
                        
                        <!-- Footer CTA -->
                        <tr>
                            <td align="center" style="padding: 16px 24px 24px; border-top: 1px solid #dadce0;">
                                <a href="${process.env.VITE_API_URL || "#"}/dashboard" style="display: inline-block; background-color: #FF8800; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                                Siirry hallintapaneeliin
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

const generateProjectsSection = (projectIds: number[]): string => {
	if (projectIds.length === 0) return "";

	const projectLinks = projectIds.slice(0, 8).map((id, index) => {
		const style =
			"padding-bottom: 8px; vertical-align: top; font-size: 15px; color: #5f6368; line-height: 1.6;";
		return `<td style="${style}">&bull; <a href="${process.env.VITE_API_URL || "#"}/projects/${id}" style="color: #1a73e8; text-decoration: none;">Projekti ${id}</a></td>`;
	});

	let rows = "";
	for (let i = 0; i < projectLinks.length; i += 2) {
		rows += `<tr>${projectLinks[i]}${projectLinks[i + 1] || "<td></td>"}</tr>`;
	}

	return `
    <tr>
        <td style="padding: 0 24px 24px;">
            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #202124;">Päivitetyt projektit</h2>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                ${rows}
                ${
									projectIds.length > 24
										? `
                <tr>
                    <td colspan="2">
                        <a href="${process.env.VITE_API_URL || "#"}" style="color: #1a73e8; font-weight: 500; text-decoration: none; font-size: 15px;">Näytä kaikki ${projectIds.length} päivitetyt projektit &rarr;</a>
                    </td>
                </tr>`
										: ""
								}
            </table>
        </td>
    </tr>`;
};

const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString("fi-FI", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};
