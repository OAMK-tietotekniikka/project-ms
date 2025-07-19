import { useMsal } from "@azure/msal-react";
import { useRole } from "@/core/auth/useUserRole.hook";

export const useLogout = () => {
	const { instance } = useMsal();
	const { clearRole } = useRole();

	const logout = async () => {
		try {
			clearRole();
			await instance.logoutRedirect({
				onRedirectNavigate: (url) => {
					return false;
				},
			});
		} catch (error) {
			console.error("Logout failed:", error);
			localStorage.clear();
			sessionStorage.clear();
			window.location.href = "/login";
		}
	};

	return { logout };
};
