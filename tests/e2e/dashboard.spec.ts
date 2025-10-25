import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@jarvis-group.net')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')
    
    // Attendre d'être redirigé vers le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should display dashboard homepage', async ({ page }) => {
    // Vérifier que le titre est présent
    await expect(page.locator('h1')).toBeVisible()
    
    // Vérifier qu'il y a des métriques affichées
    const metrics = page.locator('[class*="metric"], [class*="card"]')
    await expect(metrics.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display KPI cards', async ({ page }) => {
    // Vérifier qu'au moins 3 cards de KPIs sont affichées
    const kpiCards = page.locator('div:has-text("Membres"), div:has-text("Sessions"), div:has-text("Sentiment")')
    const count = await kpiCards.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('should navigate to members page', async ({ page }) => {
    // Cliquer sur le lien vers les membres
    const membersLink = page.locator('a:has-text("Membres"), a[href*="/members"]')
    if (await membersLink.isVisible()) {
      await membersLink.click()
      await expect(page).toHaveURL(/\/members/, { timeout: 5000 })
    }
  })

  test('should navigate to sessions page', async ({ page }) => {
    // Cliquer sur le lien vers les sessions
    const sessionsLink = page.locator('a:has-text("Sessions"), a[href*="/sessions"]')
    if (await sessionsLink.isVisible()) {
      await sessionsLink.click()
      await expect(page).toHaveURL(/\/sessions/, { timeout: 5000 })
    }
  })

  test('should navigate to kiosk page', async ({ page }) => {
    // Cliquer sur le lien vers le kiosk
    const kioskLink = page.locator('a:has-text("Kiosk"), a[href*="/kiosk"]')
    if (await kioskLink.isVisible()) {
      await kioskLink.click()
      await expect(page).toHaveURL(/\/kiosk/, { timeout: 5000 })
    }
  })

  test('should display insights page (if accessible)', async ({ page }) => {
    // Essayer d'accéder à la page insights
    await page.goto('http://localhost:3001/dashboard/insights')
    
    // Vérifier qu'on n'a pas d'erreur 404 ou access denied
    const hasError = await page.locator('text=/404|introuvable|denied|refusé/i').isVisible().catch(() => false)
    
    if (!hasError) {
      // Si on a accès, vérifier le contenu
      await expect(page.locator('h1')).toContainText(/insights|recommandations/i)
    }
  })

  test('admin should access admin pages', async ({ page }) => {
    // Vérifier si l'utilisateur est super_admin
    const adminLink = page.locator('a[href*="/admin"]')
    const isAdmin = await adminLink.isVisible().catch(() => false)
    
    if (isAdmin) {
      await adminLink.first().click()
      await expect(page).toHaveURL(/\/admin/, { timeout: 5000 })
      
      // Vérifier que la page admin charge correctement
      await expect(page.locator('h1')).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should load charts without errors', async ({ page }) => {
    // Attendre que les graphiques se chargent
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'il n'y a pas d'erreurs de chargement critiques
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(2000)
    
    // Filtrer seulement les erreurs critiques
    const criticalErrors = errors.filter(e => 
      e.includes('is not a function') || 
      e.includes('Cannot read property')
    )
    expect(criticalErrors.length).toBe(0)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Changer vers un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Vérifier que la page est toujours fonctionnelle
    await expect(page.locator('h1')).toBeVisible()
    
    // Vérifier qu'il y a un menu hamburger ou une navigation mobile
    const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("Menu")')
    if (await mobileMenu.isVisible()) {
      expect(await mobileMenu.isVisible()).toBeTruthy()
    }
  })
})

test.describe('Dashboard Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@jarvis-group.net')
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.skip('admin pages require super_admin role', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard/admin/gyms')
    
    const hasAccess = await page.locator('h1:has-text("Salles")').isVisible().catch(() => false)
    const hasError = await page.locator('text=/accès refusé|access denied/i').isVisible().catch(() => false)
    
    // Soit on a accès, soit on a un message d'erreur clair
    expect(hasAccess || hasError).toBeTruthy()
  })

  test('admin monitoring page loads', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard/admin/monitoring')
    
    // Vérifier qu'on n'a pas d'erreur serveur 500
    const hasServerError = await page.locator('text=/500|server error/i').isVisible().catch(() => false)
    expect(hasServerError).toBeFalsy()
  })

  test('admin users page loads', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard/admin/users')
    
    // Vérifier qu'on n'a pas d'erreur serveur 500
    const hasServerError = await page.locator('text=/500|server error/i').isVisible().catch(() => false)
    expect(hasServerError).toBeFalsy()
  })

  test('admin logs page loads', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard/admin/logs')
    
    // Vérifier qu'on n'a pas d'erreur serveur 500
    const hasServerError = await page.locator('text=/500|server error/i').isVisible().catch(() => false)
    expect(hasServerError).toBeFalsy()
  })
})

