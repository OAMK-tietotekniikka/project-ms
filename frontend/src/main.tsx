import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18next";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import { ThemeProvider } from "@/components/theme-provider";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<MsalProvider instance={msalInstance}>
			<BrowserRouter>
				<I18nextProvider i18n={i18n}>
					<ThemeProvider defaultTheme="dark" storageKey="theme">
						<App />
						<Toaster position="top-center" duration={1500} />
					</ThemeProvider>
				</I18nextProvider>
			</BrowserRouter>
		</MsalProvider>
	</React.StrictMode>,
);
