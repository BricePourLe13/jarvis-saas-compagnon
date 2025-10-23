import { test, expect } from '@playwright/test'

/**
 * TESTS E2E - ISOLATION DES DONNÉES
 * 
 * Ces tests vérifient que l'isolation par gym_id et franchise_id fonctionne :
 * - Gym manager ne peut pas accéder aux autres salles
 * - Franchise manager ne peut pas accéder aux autres franchises
 * - Les données affichées sont filtrées correctement
 */

test.describe('Isolation des données', () => {
  
  test.describe('Gym Manager', () => {
    test.skip('Ne peut pas accéder à une autre salle', async ({ page, context }) => {
      // NOTE: Nécessite un utilisateur de test gym_manager
      
      // 1. Se connecter en tant que gym manager de la salle A
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_GYMMANAGER_A_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_GYMMANAGER_A_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      // Attendre la redirection vers sa salle
      await page.waitForURL(/\/dashboard\/gyms\//, { timeout: 5000 })
      
      // Récupérer l'ID de sa salle depuis l'URL
      const url = page.url()
      const gymAId = url.match(/\/gyms\/([a-f0-9-]+)/)?.[1]
      
      // 2. Tenter d'accéder à la salle B (ID différent)
      const gymBId = process.env.TEST_GYM_B_ID || 'other-gym-id'
      await page.goto(`/dashboard/gyms/${gymBId}`)
      
      // 3. Devrait être redirigé vers SA salle
      await expect(page).toHaveURL(`/dashboard/gyms/${gymAId}`)
    })
    
    test.skip('Voit uniquement les membres de sa salle', async ({ page }) => {
      // NOTE: Nécessite des données de test
      
      // Se connecter en tant que gym manager
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_GYMMANAGER_A_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_GYMMANAGER_A_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL(/\/dashboard\/gyms\//, { timeout: 5000 })
      
      // Aller sur la page membres
      await page.goto('/dashboard/members')
      
      // Vérifier que SEULS les membres de sa salle sont affichés
      // NOTE: Adapter selon votre UI
      const memberCards = await page.locator('[data-testid="member-card"]').all()
      
      // Chaque carte devrait avoir un attribut data-gym-id correspondant à SA salle
      const gymId = process.env.TEST_GYM_A_ID
      for (const card of memberCards) {
        const cardGymId = await card.getAttribute('data-gym-id')
        expect(cardGymId).toBe(gymId)
      }
    })
    
    test.skip('Voit uniquement les sessions de sa salle', async ({ page }) => {
      // Se connecter
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_GYMMANAGER_A_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_GYMMANAGER_A_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL(/\/dashboard\/gyms\//, { timeout: 5000 })
      
      // Aller sur la page sessions
      await page.goto('/dashboard/sessions/live')
      
      // Vérifier isolation
      const sessionCards = await page.locator('[data-testid="session-card"]').all()
      
      const gymId = process.env.TEST_GYM_A_ID
      for (const card of sessionCards) {
        const cardGymId = await card.getAttribute('data-gym-id')
        expect(cardGymId).toBe(gymId)
      }
    })
  })
  
  test.describe('Franchise Manager', () => {
    test.skip('Ne peut pas accéder à une autre franchise', async ({ page }) => {
      // Se connecter en tant que franchise manager X
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_FRANCHISEMANAGER_X_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_FRANCHISEMANAGER_X_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL(/\/dashboard\/franchises\//, { timeout: 5000 })
      
      // Récupérer l'ID de sa franchise
      const url = page.url()
      const franchiseXId = url.match(/\/franchises\/([a-f0-9-]+)/)?.[1]
      
      // Tenter d'accéder à la franchise Y
      const franchiseYId = process.env.TEST_FRANCHISE_Y_ID || 'other-franchise-id'
      await page.goto(`/dashboard/franchises/${franchiseYId}`)
      
      // Devrait être redirigé vers SA franchise
      await expect(page).toHaveURL(`/dashboard/franchises/${franchiseXId}`)
    })
    
    test.skip('Voit uniquement les salles de sa franchise', async ({ page }) => {
      // Se connecter
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_FRANCHISEMANAGER_X_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_FRANCHISEMANAGER_X_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL(/\/dashboard\/franchises\//, { timeout: 5000 })
      
      // Aller sur la page salles
      await page.goto('/dashboard/gyms')
      
      // Vérifier isolation
      const gymCards = await page.locator('[data-testid="gym-card"]').all()
      
      const franchiseId = process.env.TEST_FRANCHISE_X_ID
      for (const card of gymCards) {
        const cardFranchiseId = await card.getAttribute('data-franchise-id')
        expect(cardFranchiseId).toBe(franchiseId)
      }
    })
  })
  
  test.describe('Super Admin', () => {
    test.skip('Peut accéder à toutes les franchises', async ({ page }) => {
      // Se connecter en tant que super admin
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_SUPERADMIN_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_SUPERADMIN_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard', { timeout: 5000 })
      
      // Aller sur la page franchises
      await page.goto('/dashboard/franchises')
      
      // Devrait voir TOUTES les franchises
      const franchiseCards = await page.locator('[data-testid="franchise-card"]').all()
      expect(franchiseCards.length).toBeGreaterThan(0)
    })
    
    test.skip('Peut accéder à toutes les salles', async ({ page }) => {
      // Se connecter
      await page.goto('/login')
      await page.fill('input[type="email"]', process.env.TEST_SUPERADMIN_EMAIL || '')
      await page.fill('input[type="password"]', process.env.TEST_SUPERADMIN_PASSWORD || '')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard', { timeout: 5000 })
      
      // Aller sur la page salles
      await page.goto('/dashboard/gyms')
      
      // Devrait voir TOUTES les salles
      const gymCards = await page.locator('[data-testid="gym-card"]').all()
      expect(gymCards.length).toBeGreaterThan(0)
    })
  })
})

