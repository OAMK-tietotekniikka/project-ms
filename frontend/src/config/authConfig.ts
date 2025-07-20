import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
	auth: {
		clientId: "ff037fae-df69-47a8-85ac-5ef3546d7f63",
		authority:
			"https://login.microsoftonline.com/cb972b7b-f7df-4cd9-9e35-62de157705f5",
		redirectUri: "http://localhost:3000/",
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
