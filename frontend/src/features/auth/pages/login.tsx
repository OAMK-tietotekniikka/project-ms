import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "@/config/authConfig";
import icon from "@/assets/icon.svg";

import { useEffect, useState } from "react";
import { useRole } from "@/core/auth/useUserRole.hook";
import { useTranslation } from "react-i18next";

export const LoginPage = () => {
	const { instance } = useMsal();

	const version = __APP_VERSION__;
	const { t, i18n } = useTranslation();

	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();
	//const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
	const isDevelopment = true; // todo change ^^ (docker dev)
	const {
		userRole,
		loading: roleLoading,
		fetchAndSetRole,
		initialized,
		isDevMode,
		setDevMode,
	} = useRole();

	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Dev mode state
	const [showDevMode, setShowDevMode] = useState(false);
	const [devToken, setDevToken] = useState("");
	const [devRole, setDevRole] = useState<"teacher" | "student">("student");

	// Language options - customize these based on your supported languages
	const languages = [{ code: "fi" }, { code: "en" }, { code: "sv" }];

	// Redirect if already authenticated and have role
	useEffect(() => {
		if ((isAuthenticated || isDevMode) && userRole && initialized) {
			navigate("/", { replace: true });
		}
	}, [isAuthenticated, isDevMode, userRole, initialized, navigate]);

	const handleLogin = async (loginType: "popup" | "redirect") => {
		if (isLoggingIn) return;

		setIsLoggingIn(true);
		setError(null);

		try {
			if (loginType === "redirect") {
				await instance.loginRedirect(loginRequest);
				return;
			}

			const response = await instance.loginPopup(loginRequest);
		} catch (err: any) {
			console.error("Login failed:", err);
			if (err.name === "InteractionInProgress") {
				setError("Another login is in progress.");
			} else {
				setError("Login failed. Please try again.");
			}
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleLanguageChange = (languageCode: string) => {
		i18n.changeLanguage(languageCode);
		console.log("Language changed to", languageCode);
	};

	const handleDevLogin = async () => {
		if (!devToken.trim()) {
			setError("Please enter a dev token");
			return;
		}

		setIsLoggingIn(true);
		setError(null);

		try {
			setDevMode(true, devToken.trim(), devRole);

			try {
				await fetchAndSetRole();
			} catch (err) {
				console.warn(
					"Dev token validation failed, but continuing in dev mode.",
				);
			}
		} catch (err) {
			console.error("Dev login failed:", err);
			setError("Dev login failed. Please check your token.");
			setDevMode(false);
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleDevLogout = () => {
		setDevMode(false);
		setDevToken("");
		setShowDevMode(false);
	};

	if (roleLoading || !initialized) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div>Loading...</div>
					{isDevMode && (
						<div className="text-sm text-primary mt-2">Dev Mode Active</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col relative">
			{/* Multiple language buttons */}
			<div className="absolute top-4 right-4">
				<div className="flex space-x-1">
					{languages.map((lang) => (
						<Button
							variant="ghost"
							key={lang.code}
							onClick={() => handleLanguageChange(lang.code)}
							className={`text-xs px-2 py-1 ${
								i18n.language === lang.code
									? ""
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{lang.code.toUpperCase()}
						</Button>
					))}
				</div>
			</div>

			{/* Main content */}
			<div className="flex flex-grow items-center justify-center px-4">
				<div className="flex flex-col items-center text-center w-full max-w-sm">
					<div className="flex items-center justify-center mb-4">
						<img src={icon} alt="logo" className="h-16" />
					</div>

					<p className="text-2xl font-medium mb-8">Project Management System</p>

					{/* Sign in form container */}
					<div className="w-full bg-card border rounded-lg p-6">
						<div className="space-y-2">
							<Button
								variant="secondary"
								className="w-full p-4 hover:cursor-pointer hover:border-none border-2"
								onClick={() => handleLogin("popup")}
							>
								<span>{t("login")}</span>
							</Button>

							{/* Fallback link */}
							<div className="text-center">
								<Button
									onClick={() => handleLogin("redirect")}
									variant="link"
									className="text-sm hover:underline hover:cursor-pointer"
								>
									{t("login_doesNotWork")}
								</Button>
							</div>
						</div>
					</div>

					{isDevelopment && (
						<>
							<div className="relative my-2">
								<div className="relative flex justify-center text-sm">
									<span className="px-2 text-muted-foreground">
										Development Only
									</span>
								</div>
							</div>

							{!isDevMode && !showDevMode ? (
								<Button
									onClick={() => setShowDevMode(true)}
									variant="outline"
									className="w-full text-primary"
								>
									Use Dev Mode
								</Button>
							) : (
								<div className="space-y-3 border rounded-md p-4">
									{isDevMode && (
										<div className="text-sm text-muted-foreground mb-2">
											You are in development mode.
										</div>
									)}

									{!isDevMode && (
										<>
											<div>
												<label className="block text-sm text-left font-medium mb-1">
													Dev Token
												</label>
												<input
													value={devToken}
													onChange={(e) => setDevToken(e.target.value)}
													className="w-full px-3 py-2 border rounded-md shadow-sm"
													placeholder="Enter dev token..."
												/>
											</div>

											<div>
												<label className="block text-sm text-left font-medium mb-1">
													Role
												</label>
												<select
													value={devRole}
													onChange={(e) =>
														setDevRole(e.target.value as "teacher" | "student")
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
												>
													<option value="student">Student</option>
													<option value="teacher">Teacher</option>
												</select>
											</div>

											<div className="flex space-x-2">
												<Button
													onClick={handleDevLogin}
													className="flex-1"
													disabled={isLoggingIn}
												>
													{isLoggingIn ? "Logging in..." : "Dev Login"}
												</Button>
												<Button
													variant="outline"
													className="flex-1"
													onClick={() => setShowDevMode(false)}
												>
													Cancel
												</Button>
											</div>
										</>
									)}

									{isDevMode && (
										<Button
											onClick={handleDevLogout}
											variant="destructive"
											className="w-full"
										>
											Exit Dev Mode
										</Button>
									)}
								</div>
							)}
						</>
					)}

					{/* Version info */}
					<div className="mt-6 text-xs text-muted-foreground">
						<p>v{version}</p>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t py-6 text-center text-sm text-muted-foreground">
				<div className="max-w-md mx-auto space-y-2 ">
					<div className="flex justify-center space-x-4 ">
						<a
							href="https://oamk-tietotekniikka.github.io/docs/en/how-to/contribute/"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							{t("login_contribute")}
						</a>
						<a
							href={__APP_BUGS__}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							{t("login_privacy")}
						</a>
					</div>
					<p>© {new Date().getFullYear()} OAMK | Project MS</p>
					<p className="text-sm">
						<a
							href={__APP_BUGS__}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							{t("login_reportBug")}
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
};
