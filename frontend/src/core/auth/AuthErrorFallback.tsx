import React, { useEffect } from "react";

import { useNavigate } from "react-router-dom";
import general_error from "@/assets/general_error_2.svg";

export const AuthErrorFallback = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const handleLogout = async () => {
			try {
				navigate("/login", { replace: true });
			} catch (error) {
				console.error("Logout failed in fallback:", error);
				// Force navigation even if logout fails
				navigate("/login", { replace: true });
			}
		};

		handleLogout();
	}, [navigate]);

	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<div className="text-center">
				<div className="text-md text-muted-foreground">
					<div className="flex flex-col font-medium items-center text-center space-y-4">
						<img src={general_error} alt="" className="h-52" />
						<p>Authentication error occurred. Please refresh the page</p>
					</div>
				</div>
			</div>
		</div>
	);
};
