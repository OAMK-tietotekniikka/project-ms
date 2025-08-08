import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/config/authConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().catch((error) => {
	console.error("MSAL initialization failed:", error);
});
