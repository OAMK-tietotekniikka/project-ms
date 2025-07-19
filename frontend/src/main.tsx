import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nextProvider } from "react-i18next";
import i18n from "@/locales/i18next";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/core/ThemeProvider";
import { Toaster } from "@/shared/components/ui/sonner";
import "./index.css";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/core/auth/auth";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<React.StrictMode>
		<BrowserRouter>
			<MsalProvider instance={msalInstance}>
				<I18nextProvider i18n={i18n}>
					<ThemeProvider>
						<App />
						<Toaster position="top-center" duration={1500} />
					</ThemeProvider>
				</I18nextProvider>
			</MsalProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
