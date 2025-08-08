import React from "react";
import { RoleProvider } from "@/core/auth/useUserRole.hook";
import AppRoutes from "@/core/router/AppRoutes";

const App: React.FC = () => {
	return (
		<RoleProvider>
			<AppRoutes />
		</RoleProvider>
	);
};

export default App;
