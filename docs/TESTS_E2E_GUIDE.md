# 🧪 TESTS E2E - Guide Complet

**Date** : 23 octobre 2025  
**Phase** : 1.4 - Tests E2E  
**Framework** : Playwright  
**Statut** : ✅ Implémenté

---

## 🎯 OBJECTIF

Tester automatiquement les fonctionnalités critiques :
- **Authentification** : Redirections, login, logout
- **Isolation données** : Gym manager, franchise manager, super admin

---

## 🏗️ STRUCTURE

```
jarvis-saas-compagnon/
├── playwright.config.ts ← Configuration Playwright
├── tests/
│   └── e2e/
│       ├── auth.spec.ts ← Tests authentification
│       ├── isolation.spec.ts ← Tests isolation
│       └── helpers/
│           └── auth.ts ← Helpers login/logout
└── .env.test.example ← Template variables de test
```

---

## ⚙️ INSTALLATION & SETUP

### 1. Installer Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Configurer les variables de test

```bash
# Copier le template
cp .env.test.example .env.test

# Éditer .env.test avec vos credentials de test
nano .env.test
```

### 3. Créer les utilisateurs de test

**Option A : BDD de test dédiée** (recommandé)

```sql
-- Créer une base Supabase de test
-- Insérer des utilisateurs de test dans la table users
INSERT INTO users (id, email, role, gym_id, franchise_id, is_active)
VALUES
  -- Super admin
  ('00000000-0000-0000-0000-000000000000', 'superadmin@test.jarvis.com', 'super_admin', NULL, NULL, true),
  
  -- Franchise managers
  ('00000000-0000-0000-0000-000000000001', 'franchise_x@test.jarvis.com', 'franchise_manager', NULL, '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000002', 'franchise_y@test.jarvis.com', 'franchise_manager', NULL, '00000000-0000-0000-0000-000000000002', true),
  
  -- Gym managers
  ('00000000-0000-0000-0000-000000000011', 'gym_a@test.jarvis.com', 'gym_manager', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000012', 'gym_b@test.jarvis.com', 'gym_manager', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', true);
```

**Option B : BDD locale** (développement)

Utiliser votre BDD locale avec des utilisateurs de test existants.

---

## 🚀 LANCER LES TESTS

### Lancer tous les tests

```bash
npm run test:e2e
```

### Lancer les tests en mode UI (recommandé pour debug)

```bash
npx playwright test --ui
```

### Lancer un fichier de test spécifique

```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Lancer les tests en mode headed (voir le navigateur)

```bash
npx playwright test --headed
```

### Lancer les tests avec rapport HTML

```bash
npx playwright test
npx playwright show-report
```

---

## 📋 TESTS IMPLÉMENTÉS

### 1. Tests Authentification (`auth.spec.ts`)

#### ✅ Tests actifs

```typescript
// Test 1: Redirection si non authentifié
test('Utilisateur non authentifié est redirigé vers /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

// Test 2: Page login accessible
test('Page /login est accessible', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

// Test 3: Login invalide affiche erreur
test('Login avec credentials invalides affiche une erreur', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'invalid@example.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=/Invalid|Incorrect|Erreur/')).toBeVisible()
})
```

#### ⏭️ Tests skipped (nécessitent credentials)

```typescript
// Login réussi super admin
test.skip('Super admin est redirigé vers /dashboard')

// Login réussi gym manager
test.skip('Gym manager est redirigé vers sa salle')
```

**Pour activer** : Configurer `.env.test` avec credentials valides.

### 2. Tests Isolation (`isolation.spec.ts`)

#### ⏭️ Tous les tests sont skipped (nécessitent BDD de test)

```typescript
// Gym Manager
test.skip('Ne peut pas accéder à une autre salle')
test.skip('Voit uniquement les membres de sa salle')
test.skip('Voit uniquement les sessions de sa salle')

// Franchise Manager
test.skip('Ne peut pas accéder à une autre franchise')
test.skip('Voit uniquement les salles de sa franchise')

// Super Admin
test.skip('Peut accéder à toutes les franchises')
test.skip('Peut accéder à toutes les salles')
```

**Pour activer** :
1. Configurer `.env.test`
2. Créer utilisateurs + données de test
3. Supprimer `.skip`

---

## 🧩 HELPERS DISPONIBLES

### `tests/e2e/helpers/auth.ts`

```typescript
import { login, logout, getTestUsers } from './tests/e2e/helpers/auth'

// Récupérer les utilisateurs de test
const users = getTestUsers()

// Se connecter
await login(page, users.superAdmin)

// Se déconnecter
await logout(page)
```

---

## 📝 ÉCRIRE DE NOUVEAUX TESTS

### Template de base

```typescript
import { test, expect } from '@playwright/test'
import { login, getTestUsers } from './helpers/auth'

test.describe('Ma feature', () => {
  test('Devrait faire X', async ({ page }) => {
    // 1. Setup
    const users = getTestUsers()
    await login(page, users.superAdmin)
    
    // 2. Action
    await page.goto('/dashboard/ma-feature')
    await page.click('[data-testid="mon-bouton"]')
    
    // 3. Assertion
    await expect(page.locator('[data-testid="resultat"]')).toBeVisible()
  })
})
```

### Best practices

1. **Utiliser data-testid** : Ajouter `data-testid` dans vos composants React
   ```tsx
   <Button data-testid="submit-button">Envoyer</Button>
   ```

2. **Isoler les tests** : Chaque test doit être indépendant
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Reset state si nécessaire
   })
   ```

3. **Attendre les animations**
   ```typescript
   await page.waitForTimeout(300) // Si animation CSS
   await page.waitForLoadState('networkidle') // Si chargement async
   ```

4. **Capturer screenshots**
   ```typescript
   await page.screenshot({ path: 'debug.png' })
   ```

---

## 🔧 CONFIGURATION AVANCÉE

### Tester sur plusieurs navigateurs

```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

### Tester en mobile

```typescript
projects: [
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
]
```

### Configurer timeout custom

```typescript
// Pour un test spécifique
test('Long test', async ({ page }) => {
  test.setTimeout(60000) // 60 secondes
  // ...
})
```

---

## 🐛 TROUBLESHOOTING

### "TimeoutError: page.goto: Timeout 30000ms exceeded"

**Cause** : Le dev server ne démarre pas assez vite.

**Solution** :
```typescript
// playwright.config.ts
webServer: {
  timeout: 120 * 1000, // 2 minutes
}
```

### "Cannot find element"

**Cause** : L'élément n'est pas encore visible (chargement async).

**Solution** :
```typescript
// Attendre l'élément avant d'interagir
await page.waitForSelector('[data-testid="mon-element"]', { 
  state: 'visible',
  timeout: 10000 
})
```

### Tests flaky (passent/échouent aléatoirement)

**Causes** :
- Race conditions (async)
- Animations CSS
- Timeouts trop courts

**Solutions** :
```typescript
// Désactiver animations CSS
await page.addStyleTag({ content: '* { transition: none !important; }' })

// Augmenter timeout
await expect(page.locator('...')).toBeVisible({ timeout: 10000 })
```

---

## 📊 CI/CD INTEGRATION

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests E2E

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.TEST_BASE_URL }}
          TEST_SUPERADMIN_EMAIL: ${{ secrets.TEST_SUPERADMIN_EMAIL }}
          TEST_SUPERADMIN_PASSWORD: ${{ secrets.TEST_SUPERADMIN_PASSWORD }}
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## ✅ CHECKLIST TESTS E2E

- [x] Playwright installé
- [x] Configuration créée
- [x] Tests auth de base ✅
- [x] Tests isolation structure créée
- [x] Helpers auth créés
- [x] Documentation complète
- [ ] Variables .env.test configurées (à faire par l'utilisateur)
- [ ] Utilisateurs de test créés en BDD (à faire par l'utilisateur)
- [ ] Tests isolation activés (après setup)
- [ ] CI/CD configuré (optionnel)

---

## 📚 RESSOURCES

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

**FIN DU GUIDE TESTS E2E**

✅ Structure tests créée  
✅ Tests auth de base fonctionnels  
✅ Helpers réutilisables  
✅ Documentation complète  
🔄 Tests isolation à activer (avec BDD de test)

