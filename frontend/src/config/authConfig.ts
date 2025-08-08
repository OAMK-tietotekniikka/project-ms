import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
	auth: {
		clientId: "6926162d-b563-44d6-a70f-2b6eaea6bb52",
		authority:
			"https://login.microsoftonline.com/9f9ce49a-5101-4aa3-8c75-0d5935ad6525",
		redirectUri: "https://projects-ms-client-tvt-projects.apps.ocp1.oulu.fi/",
	},
	cache: {
		cacheLocation: "localStorage", // This configures where your cache will be stored
		storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
	},
	system: {
		loggerOptions: {
			loggerCallback: (level: any, message: any, containsPii: any) => {
				if (containsPii) {
					return;
				}
				switch (level) {
					case LogLevel.Error:
						console.error(message);
						return;
					case LogLevel.Info:
						console.info(message);
						return;
					case LogLevel.Verbose:
						console.debug(message);
						return;
					case LogLevel.Warning:
						console.warn(message);
						return;
					default:
						return;
				}
			},
		},
	},
};

export const loginRequest = {
	scopes: ["openid", "profile", "email", "User.Read"],
};
