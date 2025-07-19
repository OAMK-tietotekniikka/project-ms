import React, {
	createContext,
	useState,
	useEffect,
	useCallback,
	useContext,
	ReactNode,
} from "react";
import { useMsal } from "@azure/msal-react";
import { apiClient } from "@/core/api/api";

// Check if we're in development mode
const isDevelopment = import.meta.env.VITE_RUNNING_ENV === "development";

// Define the shape of the context data
interface RoleContextType {
	userRole: "teacher" | "student" | null;
	loading: boolean;
	error: string | null;
	updateRole: (role: "teacher" | "student" | null) => void;
	clearRole: () => void;
	fetchAndSetRole: () => Promise<"teacher" | "student" | null>;
	initialized: boolean;
	isDevMode: boolean;
	setDevMode: (
		enabled: boolean,
		token?: string,
		role?: "teacher" | "student",
	) => void;
}

// Create the context with a default undefined value
export const RoleContext = createContext<RoleContextType | undefined>(
	undefined,
);

// Define the props for our provider
interface RoleProviderProps {
	children: ReactNode;
}

// Create the Provider Component
export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
	const { accounts, inProgress } = useMsal();
	const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [isDevMode, setIsDevMode] = useState(false);

	// Check if dev mode is enabled
	const checkDevMode = useCallback(() => {
		if (isDevelopment) {
			const devModeEnabled =
				localStorage.getItem("dev_mode_enabled") === "true";
			setIsDevMode(devModeEnabled);
			return devModeEnabled;
		}
		return false;
	}, []);

	const fetchAndSetRole = useCallback(async (): Promise<
		"teacher" | "student" | null
	> => {
		console.log("fetchAndSetRole called");
		try {
			setError(null);
			const response = await apiClient.login();
			const role = response?.role;

			console.log("RESPONSE", response);

			if (role === "teacher" || role === "student") {
				localStorage.setItem("role", role);
				setUserRole(role);
				return role;
			} else {
				throw new Error("Invalid role received from backend");
			}
		} catch (err) {
			console.error("Failed to fetch user role from backend:", err);
			setError("Could not retrieve user role from the server.");
			localStorage.removeItem("role");
			setUserRole(null);
			return null;
		}
	}, []);

	const setDevMode = useCallback(
		(enabled: boolean, token?: string, role?: "teacher" | "student") => {
			if (!isDevelopment) {
				console.warn("Dev mode is only available in development environment");
				return;
			}

			if (enabled) {
				localStorage.setItem("dev_mode_enabled", "true");
				if (token) {
					apiClient.dev.setToken(token);
				}
				if (role) {
					localStorage.setItem("role", role);
					setUserRole(role);
				}
				setIsDevMode(true);
				console.log("Dev mode enabled", { token: !!token, role });
			} else {
				localStorage.removeItem("dev_mode_enabled");
				apiClient.dev.clearToken();
				localStorage.removeItem("role");
				setUserRole(null);
				setIsDevMode(false);
				console.log("Dev mode disabled");
			}
		},
		[],
	);

	useEffect(() => {
		const initializeRole = async () => {
			try {
				const devModeEnabled = checkDevMode();
				console.log("initialized called");
				if (devModeEnabled) {
					// Dev mode - check for stored role
					const storedRole = localStorage.getItem("role") as
						| "teacher"
						| "student"
						| null;
					if (
						storedRole &&
						(storedRole === "teacher" || storedRole === "student")
					) {
						setUserRole(storedRole);
						console.log("Dev mode: Using stored role:", storedRole);
					} else {
						// Try to fetch role from backend with dev token
						try {
							await fetchAndSetRole();
						} catch (err) {
							console.warn(
								"Dev mode: Failed to fetch role from backend, role will be null",
							);
							setUserRole(null);
						}
					}
				} else {
					// Normal mode - wait for MSAL to finish initialization
					if (inProgress !== "none") {
						return; // Still initializing MSAL
					}

					if (accounts.length > 0) {
						// User is authenticated - check for cached role first
						const storedRole = localStorage.getItem("role") as
							| "teacher"
							| "student"
							| null;

						if (
							storedRole &&
							(storedRole === "teacher" || storedRole === "student")
						) {
							setUserRole(storedRole);
						} else {
							// No cached role, fetch from backend
							await fetchAndSetRole();
						}
					} else {
						// User is not authenticated
						setUserRole(null);
						localStorage.removeItem("role");
					}
				}
			} catch (err) {
				console.error("Role initialization failed:", err);
				setError("Failed to initialize user role");
				setUserRole(null);
				localStorage.removeItem("role");
			} finally {
				setInitialized(true);
				setLoading(false);
			}
		};

		initializeRole();
	}, [accounts.length, inProgress, fetchAndSetRole, checkDevMode]);

	const updateRole = useCallback((role: "teacher" | "student" | null) => {
		setUserRole(role);
		if (role) {
			localStorage.setItem("role", role);
		} else {
			localStorage.removeItem("role");
		}
	}, []);

	const clearRole = useCallback(() => {
		updateRole(null);
		setError(null);

		// Also clear dev mode if active
		if (isDevMode) {
			setDevMode(false);
		}
	}, [updateRole, isDevMode, setDevMode]);

	const value = {
		userRole,
		loading,
		error,
		updateRole,
		clearRole,
		fetchAndSetRole,
		initialized,
		isDevMode,
		setDevMode,
	};

	return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useRole = (): RoleContextType => {
	const context = useContext(RoleContext);
	if (context === undefined) {
		throw new Error("useRole must be used within a RoleProvider");
	}
	return context;
};
