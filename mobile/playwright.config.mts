import { defineConfig } from '@playwright/test';
const webPort = Number(process.env.EXPO_WEB_PORT || 8081);
if (!Number.isInteger(webPort) || webPort < 1 || webPort > 65535) throw new Error('EXPO_WEB_PORT inválida.');
const webUrl = 'http://localhost:' + webPort;
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 60000,
  use: { baseURL: webUrl, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-web', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop-web', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: 'npm run web -- --port ' + webPort, url: webUrl,
    reuseExistingServer: !process.env.CI, timeout: 120000,
    env: { EXPO_PUBLIC_API_URL: apiUrl, BROWSER: 'none', CI: '1' },
  },
});
