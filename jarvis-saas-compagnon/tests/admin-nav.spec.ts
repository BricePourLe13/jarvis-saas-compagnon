import { test, expect } from '@playwright/test'

test('navigation franchises → gyms → gym detail → back', async ({ page }) => {
  // Aller à la page franchises
  await page.goto('/admin/franchises')
  await expect(page).toHaveURL(/\/admin\/franchises$/)

  // Cliquer sur la première carte franchise si présente
  const firstFranchiseCard = page.locator('text=/.*Salle(s)?/').first()
  // Si aucune franchise, on s'arrête proprement
  if (!(await firstFranchiseCard.count())) return

  await page.locator('[role="button"]:has-text("Voir les salles")').first().click()
  await expect(page).toHaveURL(/\/admin\/franchises\/.+\/gyms$/)

  // Aller au détail de la première salle si présente
  const firstGymCard = page.locator('button:has-text("Gérer →")').first()
  if (!(await firstGymCard.count())) return
  await firstGymCard.click()
  await expect(page).toHaveURL(/\/admin\/franchises\/.+\/gyms\/.+$/)

  // Retour vers la liste des salles
  await page.getByRole('button', { name: 'Retour' }).click()
  await expect(page).toHaveURL(/\/admin\/franchises\/.+\/gyms$/)
})

