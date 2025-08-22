import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		pool: "forks",
		environment: "node",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		coverage: {
			provider: "v8",
			//enabled: true,
			reporter: ["text", "text-summary"],
		},
	},
});
