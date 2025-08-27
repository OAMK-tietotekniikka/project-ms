import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rootPkg from "../package.json";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file from project root
	const env = loadEnv(mode, path.resolve(__dirname, ".."), "");
	return {
		// define the plugins that Vite should use
		envDir: path.resolve(__dirname, "../"),
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},

		// define which port the preview server should run on
		build: {
			minify: false, // Disable minification
			sourcemap: true, // Optional: Include source maps for better debugging
		},

		server: {
			host: "0.0.0.0",
			port: parseInt(env.VITE_FRONTEND_PORT) || 3000,
			proxy: {
				"/api": {
					target: env.VITE_API_URL || "http://localhost:8000",
					changeOrigin: true,
				},
			},
		},

		preview: {
			host: "0.0.0.0",
			port: parseInt(env.VITE_FRONTEND_PORT) || 3000,
		},

		define: {
			__APP_VERSION__: JSON.stringify(rootPkg.version),
			__APP_BUGS__: JSON.stringify(rootPkg.bugs.url),
		},
	};
});
