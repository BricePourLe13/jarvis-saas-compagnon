import { test, expect } from '@playwright/test'

/**
 * TESTS E2E - AUTHENTIFICATION
 * 
 * Ces tests vérifient que le système d'authentification fonctionne correctement :
 * - Redirection si non authentifié
 * - Login réussi
 * - Redirection selon rôle
 */

test.describe('Authentification', () => {
  
  test('Utilisateur non authentifié est redirigé vers /login', async ({ page }) => {
    // Tenter d'accéder au dashboard sans être connecté
    await page.goto('/dashboard')
    
    // Devrait être redirigé vers /login avec paramètre redirect
    await expect(page).toHaveURL(/\/login/)
    await expect(page.url()).toContain('redirect=%2Fdashboard')
  })
  
  test('Utilisateur non authentifié ne peut pas accéder à /dashboard/franchises', async ({ page }) => {
    // Tenter d'accéder à une page protégée
    await page.goto('/dashboard/franchises')
    
    // Devrait être redirigé vers /login
    await expect(page).toHaveURL(/\/login/)
  })
  
  test('Page /login est accessible', async ({ page }) => {
    await page.goto('/login')
    
    // Vérifier que la page login s'affiche
    await expect(page).toHaveURL('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
  
  test.describe('Login avec credentials valides', () => {
    test.skip('Super admin est redirigé vers /dashboard', async ({ page }) => {
      // NOTE: Ce test nécessite des credentials de test
      // À configurer via variables d'environnement
      
      await page.goto('/login')
      
      await page.fill('input[type="email"]', process.env.TEST_SUPERADMIN_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_SUPERADMIN_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      // Attendre la redirection
      await page.waitForURL('/dashboard', { timeout: 5000 })
      
      // Vérifier qu'on est bien sur le dashboard
      await expect(page).toHaveURL(/\/dashboard/)
    })
    
    test.skip('Gym manager est redirigé vers sa salle', async ({ page }) => {
      // NOTE: Ce test nécessite des credentials de test
      
      await page.goto('/login')
      
      await page.fill('input[type="email"]', process.env.TEST_GYMMANAGER_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_GYMMANAGER_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      // Attendre la redirection vers sa salle
      await page.waitForURL(/\/dashboard\/gyms\/[a-f0-9-]+/, { timeout: 5000 })
      
      // Vérifier qu'on est bien sur la page de sa salle
      await expect(page.url()).toContain('/dashboard/gyms/')
    })
  })
  
  test('Login avec credentials invalides affiche une erreur', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Vérifier qu'un message d'erreur s'affiche
    // NOTE: Adapter le sélecteur selon votre UI
    await expect(page.locator('text=/Invalid|Incorrect|Erreur/')).toBeVisible({ timeout: 3000 })
  })
})

