import * as cron from "node-cron";
import { refreshActiveUsers } from "./notificationService";
import { processEmailQueue, sendDailySummaryEmails } from "./emailService";

let scheduledTasks: cron.ScheduledTask[] = [];

export const startScheduledTasks = (): void => {
	return;

	/*
    // Refresh active users every hour

    const refreshUsersTask = cron.schedule("0 * * * *", async () => {
        console.log("Running scheduled task: Refresh active users");
        try {
            await refreshActiveUsers();
            console.log("Active users refreshed successfully");
        } catch (error) {
            console.error("Error refreshing active users:", error);
        }
    });



    // Send daily summary emails at 5 AM
    const dailySummaryTask = cron.schedule("0 5 * * *", async () => {
        console.log("Running scheduled task: Send daily summary emails");
        try {
            await sendDailySummaryEmails();
            console.log("Daily summary emails sent successfully");
            await processEmailQueue();
            console.log("Email queue processed successfully");
        } catch (error) {
            console.error("Error sending daily summary emails:", error);
        }
    });

    scheduledTasks = [refreshUsersTask, dailySummaryTask];
    console.log("Scheduled tasks started");

     */
};

export const stopScheduledTasks = (): void => {
	scheduledTasks.forEach((task) => task.destroy());
	scheduledTasks = [];
	console.log("All scheduled tasks stopped");
};
