const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:43173",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 43173 --bind 127.0.0.1",
    port: 43173,
    reuseExistingServer: false
  }
});
