import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "@/locales/en/default.json";
import fiTranslations from "@/locales/fi/default.json";
import svTranslations from "@/locales/sv/default.json";

const savedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
	lng: savedLanguage,
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
	resources: {
		en: { translation: enTranslations },
		fi: { translation: fiTranslations },
		sv: { translation: svTranslations },
	},
	react: {
		useSuspense: false,
	},
});

i18n.on("languageChanged", (lng) => {
	localStorage.setItem("language", lng);
});

export default i18n;
