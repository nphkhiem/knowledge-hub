import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    // The site is published under a project path, so the base lives here and
    // specs use paths relative to it rather than repeating the prefix.
    baseURL: "http://127.0.0.1:4321/knowledge-hub/",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm --filter @knowledge-hub/site preview --host 127.0.0.1",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        reducedMotion: "reduce",
      },
    },
  ],
});
