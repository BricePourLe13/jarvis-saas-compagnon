import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour tests E2E
 * Focus : Authentification + Isolation données
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout par test
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Lancer tous les tests en parallèle
  fullyParallel: true,
  
  // Fail le build si des tests sont focusés (.only)
  forbidOnly: !!process.env.CI,
  
  // Retry en CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['list']
  ],
  
  // Configuration globale pour tous les tests
  use: {
    // Base URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture video on retry
    video: 'retain-on-failure',
    
    // Trace on retry
    trace: 'on-first-retry',
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Dev server (optionnel, pour lancer npm run dev automatiquement)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes
  },
})

