/**
 * Utility functions for date handling in the Project Management System
 */

/**
 * Calculates the academic study year based on a date
 * For example: 2023-07-15 returns "2022-2023", 2023-08-15 returns "2023-2024"
 * 
 * @param date The date to calculate the study year for
 * @returns The study year string in format "YYYY-YYYY"
 */
export const getStudyYear = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: 0 = January, 7 = August

    // If month is before August (0-indexed, so 7 = August), it's part of the previous academic year
    if (month < 7) {
        return `${year - 1}-${year}`;
    } else {
        return `${year}-${year + 1}`;
    }
};

/**
 * Formats a date object to YYYY-MM-DD string for MySQL
 * 
 * @param date The date to format
 * @returns The formatted date string
 */
export const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};