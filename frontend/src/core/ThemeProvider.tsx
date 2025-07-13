import { createContext, useContext, useEffect, useState } from "react";

type SystemTheme = "dark" | "light";

type ThemeProviderProps = {
	children: React.ReactNode;
};

type ThemeProviderState = {
	theme: SystemTheme;
};

const initialState: ThemeProviderState = {
	theme: "dark",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	const [theme, setTheme] = useState<SystemTheme>(() => {
		if (typeof window !== "undefined") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		}
		return "light";
	});

	useEffect(() => {
		const root = window.document.documentElement;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const applyTheme = (isDark: boolean) => {
			const newTheme = isDark ? "dark" : "light";


			root.classList.remove("light", "dark");
			root.classList.add(newTheme);

			setTheme(newTheme);
		};

		applyTheme(mediaQuery.matches);

		// Listen for system theme changes
		const handleChange = (e: MediaQueryListEvent) => {
			applyTheme(e.matches);
		};

		mediaQuery.addEventListener("change", handleChange);

		// Cleanup listener
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const value = {
		theme,
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};