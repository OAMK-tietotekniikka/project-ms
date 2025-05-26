import axios from 'axios';
import { baseUrl } from  '../../config/apiConfig';

/**
 * Authenticates a user using database credentials
 */
export const loginWithDbCredentials = async (email: string, password: string, role: string) => {
    try {
        const response = await axios.post(`${baseUrl}/auth/login`, {
            email,
            password,
            role
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Login failed:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
            throw error;
        }
    }
};