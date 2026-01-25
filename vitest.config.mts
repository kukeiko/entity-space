import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        coverage: { reporter: ["html", "json-summary"] },
        setupFiles: ["./src/test/custom-matchers.ts"],
    },
});
