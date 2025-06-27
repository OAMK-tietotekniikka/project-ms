import axios from "axios";

export const api = axios.create({
	baseURL: "http://localhost:8081/",
	timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		// Get token from localStorage, context, or wherever you store it
		const token = localStorage.getItem("token");

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Handle token expiration
			// redirect to login or dispatch a logout action
		}

		return Promise.reject(error);
	},
);

// Generic API functions
export const apiClient = {
	get: (url: string, config?) => api.get(url, config),
	post: (url: string, data?, config?) => api.post(url, data, config),
	put: (url: string, data?, config?) => api.put(url, data, config),
	delete: (url: string, config?) => api.delete(url, config),
};
