// Get API URL from environment variables or use default
export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Export auth header creation function
export const createAuthHeader = (token: string | null) => {
    if (!token) return {};
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};