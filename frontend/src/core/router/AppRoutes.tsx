import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useRole } from "@/core/auth/useUserRole.hook";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "@/features/auth/pages/login";
import TeachersDashboard from "@/features/teachers/pages/teachersDashboard";
import StudentsDashboard from "@/features/students/pages/studentsDashboard";
import NavBar from "@/shared/components/layout/Navbar";
import { AuthenticatedRoute } from "@/core/auth/AuthenticatedRoute";
import EditProject from "@/features/projects/pages/projectModify";
import CreateProject from "@/features/projects/pages/projectCreation";
import StudentProjectDetails from "@/features/projects/pages/projectDetails";
import Teachers from "@/features/teachers/pages/teachersAll";
import Projects from "@/features/teachers/components/ProjectOverview";
import Students from "@/features/teachers/pages/studentsAll";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

const LoadingScreen: React.FC<{ message?: string }> = ({
	message = "Loading...",
}) => (
	<div className="flex items-center justify-center min-h-screen">
		{/*<div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
        </div>*/}
	</div>
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div>
		<NavBar />
		<div className="flex flex-col md:pr-20">
			<hr className="m-0" />
			<div className="pb-20 md:pb-0">
				<QueryClientProvider client={queryClient}>
					{children}
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</div>
		</div>
	</div>
);

// Route configuration
const createRoutes = (
	userRole: "teacher" | "student" | null,
	isDevMode: boolean,
	isAuthenticated: boolean,
) => {
	// Helper function to check role access
	const hasRoleAccess = (allowedRoles?: string[]) => {
		if (!allowedRoles) return true;
		return userRole && allowedRoles.includes(userRole);
	};

	// Helper function to wrap routes with authentication (only when needed)
	const withAuth = (element: React.ReactElement, allowedRoles?: string[]) => {
		// In dev mode, only check roles, not authentication
		if (isDevMode) {
			if (allowedRoles && !hasRoleAccess(allowedRoles)) {
				return <Navigate to="/" replace />;
			}
			return element;
		}

		// In normal mode, use AuthenticatedRoute for role-based routes only
		if (allowedRoles) {
			return (
				<AuthenticatedRoute
					allowedRoles={allowedRoles as ("teacher" | "student")[]}
				>
					{element}
				</AuthenticatedRoute>
			);
		}

		// For general authenticated routes, we can skip AuthenticatedRoute
		// since we've already checked authentication at the app level
		return element;
	};

	// Default dashboard based on role
	const DefaultDashboard = () => {
		if (userRole === "teacher") return <TeachersDashboard />;
		return <StudentsDashboard />;
	};

	return (
		<Routes>
			{/* Default route based on user role */}
			<Route path="/" element={<DefaultDashboard />} />

			{/* General authenticated routes - no need for AuthenticatedRoute wrapper */}
			<Route path="/projects/:id/update" element={<EditProject />} />
			<Route path="/projects/create" element={<CreateProject />} />
			<Route path="/projects/:id" element={<StudentProjectDetails />} />

			{/* Teacher-only routes - use AuthenticatedRoute for role checking */}
			<Route path="/teachers" element={withAuth(<Teachers />, ["teacher"])} />
			<Route path="/projects" element={withAuth(<Projects />, ["teacher"])} />
			<Route path="/students" element={withAuth(<Students />, ["teacher"])} />

			{/* Catch all - redirect to home */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

const AppRoutes: React.FC = () => {
	const { userRole, loading, initialized, isDevMode } = useRole();
	const isAuthenticated = useIsAuthenticated();
	const { inProgress } = useMsal();

	// Show loading during initialization - this prevents the flash
	if (loading || !initialized || inProgress === "startup") {
		// Return a loading screen for a better user experience
		return <LoadingScreen message="Initializing session..." />;
	}

	// In dev mode, skip authentication checks
	if (isDevMode) {
		return (
			<AppLayout>
				{createRoutes(userRole, isDevMode, isAuthenticated)}
			</AppLayout>
		);
	}

	// Show login pages if not authenticated (only after initialization)
	if (!isAuthenticated) {
		console.log(
			"not authenticated",
			isAuthenticated,
			userRole,
			loading,
			initialized,
		);
		return <LoginPage />;
	}

	// Show loading if authenticated but no role yet
	if (isAuthenticated && !userRole) {
		return null;
	}

	return (
		<AppLayout>{createRoutes(userRole, isDevMode, isAuthenticated)}</AppLayout>
	);
};

export default AppRoutes;
