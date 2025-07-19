import { msalInstance } from "@/core/auth/auth";
import { apiClient } from "@/core/api/api";

export const performLogout = async () => {
	try {
		localStorage.removeItem("role");
		if (apiClient.dev.isEnabled()) {
			console.log("Dev mode enabled. Disabling...");
			apiClient.dev.disable();
		}

		await msalInstance.logoutRedirect({
			onRedirectNavigate: () => false,
		});
	} catch (err) {
		console.error("Forced logout failed:", err);
		localStorage.clear();
		window.location.href = "/login";
	}
};
