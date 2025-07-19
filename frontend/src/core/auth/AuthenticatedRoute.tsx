import React from "react";
import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRole } from "@/core/auth/useUserRole.hook";

interface AuthenticatedRouteProps {
	children: React.ReactNode;
	allowedRoles?: ("teacher" | "student")[];
}

export const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
	children,
	allowedRoles,
}) => {
	const isAuthenticated = useIsAuthenticated();
	const { userRole, loading, isDevMode, initialized } = useRole();

	// Don't render anything until initialization is complete
	// prevents flashing during the initial load
	if (!initialized || loading) {
		return null; // Let the parent handle loading states
	}

	// In dev mode, skip authentication checks
	if (isDevMode) {
		// Still check role-based access in dev mode
		if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
			return <Navigate to="/" replace />;
		}
		return <>{children}</>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Check role-based access
	if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
		return <Navigate to="/" replace />;
	}

	// If we have allowed roles but no user role yet, don't render
	// This case should be handled by the parent component's loading states
	if (allowedRoles && !userRole) {
		return null;
	}

	return <>{children}</>;
};
