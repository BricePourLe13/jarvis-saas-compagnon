import { Page } from '@playwright/test'

/**
 * HELPERS AUTHENTIFICATION POUR TESTS E2E
 */

export interface TestUser {
  email: string
  password: string
  role: 'super_admin' | 'franchise_manager' | 'gym_manager' | 'receptionist'
  gymId?: string
  franchiseId?: string
}

/**
 * Se connecter avec un utilisateur de test
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/login')
  
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  
  // Attendre la redirection (varie selon le rôle)
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

/**
 * Se déconnecter
 */
export async function logout(page: Page) {
  // NOTE: Adapter selon votre UI
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-button"]')
  
  // Attendre la redirection vers /login
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Vérifier que l'utilisateur est bien authentifié
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Vérifier la présence d'un élément qui n'apparaît que si authentifié
  // NOTE: Adapter selon votre UI
  return await page.locator('[data-testid="user-menu"]').isVisible()
}

/**
 * Récupérer les utilisateurs de test depuis les variables d'environnement
 */
export function getTestUsers() {
  return {
    superAdmin: {
      email: process.env.TEST_SUPERADMIN_EMAIL || 'superadmin@test.com',
      password: process.env.TEST_SUPERADMIN_PASSWORD || 'testpassword',
      role: 'super_admin' as const,
    },
    franchiseManagerX: {
      email: process.env.TEST_FRANCHISEMANAGER_X_EMAIL || 'franchise_x@test.com',
      password: process.env.TEST_FRANCHISEMANAGER_X_PASSWORD || 'testpassword',
      role: 'franchise_manager' as const,
      franchiseId: process.env.TEST_FRANCHISE_X_ID || 'franchise-x-id',
    },
    franchiseManagerY: {
      email: process.env.TEST_FRANCHISEMANAGER_Y_EMAIL || 'franchise_y@test.com',
      password: process.env.TEST_FRANCHISEMANAGER_Y_PASSWORD || 'testpassword',
      role: 'franchise_manager' as const,
      franchiseId: process.env.TEST_FRANCHISE_Y_ID || 'franchise-y-id',
    },
    gymManagerA: {
      email: process.env.TEST_GYMMANAGER_A_EMAIL || 'gym_a@test.com',
      password: process.env.TEST_GYMMANAGER_A_PASSWORD || 'testpassword',
      role: 'gym_manager' as const,
      gymId: process.env.TEST_GYM_A_ID || 'gym-a-id',
    },
    gymManagerB: {
      email: process.env.TEST_GYMMANAGER_B_EMAIL || 'gym_b@test.com',
      password: process.env.TEST_GYMMANAGER_B_PASSWORD || 'testpassword',
      role: 'gym_manager' as const,
      gymId: process.env.TEST_GYM_B_ID || 'gym-b-id',
    },
  }
}

