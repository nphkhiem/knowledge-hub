import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["packages/**/*.test.ts", "lessons/**/*.test.ts"],
          name: "node",
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: ["apps/site/src/**/*.test.ts"],
          name: "site",
          setupFiles: ["./apps/site/src/test/setup.ts"],
        },
      },
    ],
  },
});
