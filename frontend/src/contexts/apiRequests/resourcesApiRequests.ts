import axios from 'axios';
import { Resource, NewResource } from '../../interface/resource';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';


export const allocateTeacher = async (companyName: string, startDate: Date, authHeader: any) => {
    try {
        const response = await axios.post(`${baseUrl}/resources/allocate-teacher`, {
            companyName,
            startDate
        }, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to allocate teacher:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
            throw error;
        }
    }
};

/**
 * Increments the used_resources count for a teacher
 */
export const incrementResourceUsage = async (teacherId: number, studyYear: string, authHeader: any) => {
    try {
        const response = await axios.post(`${baseUrl}/resources/increment-usage`, {
            teacherId,
            studyYear
        }, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to increment resource usage:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
            throw error;
        }
    }
};

/**
 * Decrements the used_resources count for a teacher
 */
export const decrementResourceUsage = async (teacherId: number, studyYear: string, authHeader: any) => {
    try {
        const response = await axios.post(`${baseUrl}/resources/decrement-usage`, {
            teacherId,
            studyYear
        }, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to decrement resource usage:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
            throw error;
        }
    }
};