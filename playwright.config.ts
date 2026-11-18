import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against a production build in mock mode. `*.localhost` resolves to 127.0.0.1 in
 * Chromium, so each seeded site is reachable on its real (local) hostname.
 */
const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://nordic-home-de.localhost:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      SHOWCASE_API_MODE: "mock",
      APP_ENV: "local",
      REVALIDATE_WEBHOOK_SECRET: "local-webhook-secret",
      DEV_HOST_ALIASES: "",
      NEXT_PUBLIC_IMAGE_PROVIDER: "none",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
