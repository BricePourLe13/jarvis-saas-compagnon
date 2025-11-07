import { test, expect } from '@playwright/test'

test.describe('Kiosk Interface', () => {
  test.skip('should be skipped in CI - requires provisioned kiosk', () => {
    // Ces tests nécessitent un kiosk provisionné
  })

  test('should display kiosk provisioning page', async ({ page }) => {
    // Utiliser un slug de test
    const testSlug = 'test-gym-kiosk'
    await page.goto(`http://localhost:3001/kiosk/${testSlug}`)
    
    // Vérifier qu'on est sur une page kiosk valide
    // (soit provisioning, soit interface voice)
    const hasProvisioning = await page.locator('text=/provisioning|code/i').isVisible().catch(() => false)
    const hasVoiceInterface = await page.locator('text=/jarvis|commencer/i').isVisible().catch(() => false)
    
    expect(hasProvisioning || hasVoiceInterface).toBeTruthy()
  })

  test('should show error for invalid kiosk slug', async ({ page }) => {
    await page.goto('http://localhost:3001/kiosk/invalid-slug-12345')
    
    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.locator('text=/introuvable|erreur|invalid/i')).toBeVisible({ timeout: 5000 })
  })

  test('should load voice interface assets', async ({ page }) => {
    const testSlug = process.env.TEST_KIOSK_SLUG || 'test-gym-kiosk'
    await page.goto(`http://localhost:3001/kiosk/${testSlug}`)
    
    // Vérifier que les assets nécessaires sont chargés
    const scriptsCount = await page.locator('script').count()
    expect(scriptsCount).toBeGreaterThan(0)
    
    // Vérifier qu'il n'y a pas d'erreurs JS critiques
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.waitForLoadState('networkidle')
    
    // Ne pas accepter d'erreurs critiques (pas de "undefined is not a function", etc.)
    const criticalErrors = errors.filter(e => 
      e.includes('is not a function') || 
      e.includes('Cannot read property') ||
      e.includes('is undefined')
    )
    expect(criticalErrors.length).toBe(0)
  })

  test('should have microphone permission prompt', async ({ page, context }) => {
    // Accorder les permissions micro automatiquement pour le test
    await context.grantPermissions(['microphone'])
    
    const testSlug = process.env.TEST_KIOSK_SLUG || 'test-gym-kiosk'
    await page.goto(`http://localhost:3001/kiosk/${testSlug}`)
    
    // Vérifier qu'il y a un bouton pour commencer
    const startButton = page.locator('button:has-text(/commencer|start|démarrer/i)')
    await expect(startButton).toBeVisible({ timeout: 10000 })
  })
})




