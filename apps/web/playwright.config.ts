import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace=apps/server",
      cwd: "../../",
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "npm run dev --workspace=apps/web",
      cwd: "../../",
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
