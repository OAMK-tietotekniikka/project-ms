import axios from "axios";
import { msalInstance } from "@/core/auth/auth";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { performLogout } from "@/core/auth/logout";

export const api = axios.create({
	baseURL: "http://localhost:8000/api/v2",
	timeout: 10000,
});

const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

// Dev mode constants
const DEV_TOKEN_KEY = "dev_auth_token";
const DEV_MODE_KEY = "dev_mode_enabled";

const isDevModeEnabled = (): boolean => {
	return isDevelopment && localStorage.getItem(DEV_MODE_KEY) === "true";
};

// Get dev token
const getDevToken = (): string | null => {
	return localStorage.getItem(DEV_TOKEN_KEY);
};

export const setDevToken = (token: string): void => {
	if (isDevelopment) {
		localStorage.setItem(DEV_TOKEN_KEY, token);
		localStorage.setItem(DEV_MODE_KEY, "true");
	}
};

export const clearDevToken = (): void => {
	localStorage.removeItem(DEV_TOKEN_KEY);
	localStorage.removeItem(DEV_MODE_KEY);
};

// Token acquisition helper
const getAccessToken = async (): Promise<string> => {
	// Check if dev mode is enabled first
	if (isDevModeEnabled()) {
		const devToken = getDevToken();
		if (devToken) {
			return devToken;
		}
		// If dev mode is enabled but no token, fall back to MSAL
		console.warn("Dev mode enabled but no dev token found");
		throw new Error("No dev token available");
	}

	const accounts = msalInstance.getAllAccounts();
	if (accounts.length === 0) {
		throw new Error("No accounts found");
	}

	const request = {
		scopes: ["openid", "profile", "email", "User.Read"],
		account: accounts[0],
	};

	try {
		const response = await msalInstance.acquireTokenSilent(request);
		return response.idToken;
	} catch (error) {
		if (error instanceof InteractionRequiredAuthError) {
			const response = await msalInstance.acquireTokenPopup(request);
			return response.idToken;
		}
		throw error;
	}
};

api.interceptors.request.use(
	async (config) => {
		try {
			const token = await getAccessToken();
			config.headers.Authorization = `Bearer ${token}`;

			// Add dev mode header for backend identification
			if (isDevModeEnabled()) {
				config.headers["X-Dev-Mode"] = "true";
			}
		} catch (error) {
			console.error("Failed to get access token:", error);
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Axios interceptors
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.error("401/403 Unauthorized");

			if (isDevModeEnabled()) {
				console.error("Dev token appears to be invalid — logging out.");
			}

			await performLogout(); // clear tokens, user state, etc.
			return Promise.reject(error);
		}

		return Promise.reject(error);
	},
);

// API client
export const apiClient = {
	get: (url: string, config?: any) => api.get(url, config),
	post: (url: string, data?: any, config?: any) => api.post(url, data, config),
	put: (url: string, data?: any, config?: any) => api.put(url, data, config),
	delete: (url: string, config?: any) => api.delete(url, config),

	login: async () => {
		try {
			const response = await api.post("/auth/login");
			return response.data.data;
		} catch (error) {
			console.error("Backend login failed:", error);

			// In dev mode, don't perform logout on login failure
			if (!isDevModeEnabled()) {
				await performLogout();
			}
			throw error;
		}
	},

	// Dev mode utilities - consolidated here instead of separate devUtils
	dev: {
		isEnabled: isDevModeEnabled,
		setToken: setDevToken,
		clearToken: clearDevToken,
		getToken: getDevToken,

		// Helper methods for console usage
		enable: (token: string, role: "teacher" | "student" = "student") => {
			if (!isDevelopment) {
				console.warn("Dev mode only available in development");
				return;
			}

			setDevToken(token);
			localStorage.setItem("role", role);
			console.log("Dev mode enabled. Reload pages to apply changes.");
		},

		disable: () => {
			clearDevToken();
			localStorage.removeItem("role");
		},

		status: () => {
			const enabled = isDevModeEnabled();
			const token = getDevToken();
			const role = localStorage.getItem("role");
			return { enabled, hasToken: !!token, role };
		},
	},
};
