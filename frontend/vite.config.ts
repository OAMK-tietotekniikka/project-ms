import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	// define the plugins that Vite should use

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
		port: 5000,
	},

	preview: {
		host: true,
		port: 5000,
	},
});
