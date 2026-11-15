import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
      include: [
        "src/learning/engine/AdaptiveLearningEngine.ts",
        "src/assessment/AssessmentIntelligence.ts",
        "src/planning/planning.ts",
        "src/components/charts/BarChart.tsx",
        "src/components/charts/LineChart.tsx",
      ],
      exclude: [
        "src/__tests__/**",
        "node_modules/**",
        "dist/**",
      ],
    },
  },
});
