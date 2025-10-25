import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login')
  })

  test('should display login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/JARVIS/)
    await expect(page.locator('h1')).toContainText('Connexion')
  })

  test('should show validation errors for empty form', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Vérifier que des erreurs s'affichent
    await expect(page.locator('text=requis')).toBeVisible({ timeout: 2000 })
  })

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.locator('text=/erreur|invalide|incorrect/i')).toBeVisible({ timeout: 5000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Utiliser les credentials de test
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@jarvis-group.net')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should redirect to MFA if enabled', async ({ page }) => {
    // Ce test nécessiterait un user avec MFA activé
    // Pour l'instant on le skip si pas configuré
    if (!process.env.TEST_USER_MFA_ENABLED) {
      test.skip()
    }
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL_MFA || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD_MFA || '')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Vérifier qu'on arrive sur la page MFA
    await expect(page).toHaveURL(/\/auth\/verify-mfa/, { timeout: 5000 })
  })

  test('should logout successfully', async ({ page }) => {
    // D'abord se connecter
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@jarvis-group.net')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')
    
    // Attendre d'être sur le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Trouver et cliquer sur le bouton de déconnexion
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Se déconnecter")')
    await logoutButton.click()
    
    // Vérifier qu'on est redirigé vers la page login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
