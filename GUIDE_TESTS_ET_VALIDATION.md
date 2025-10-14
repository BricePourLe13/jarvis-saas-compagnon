# 🧪 GUIDE TESTS E2E & VALIDATION BDD

**Objectif :** Éviter les bugs en production liés aux incohérences entre code et base de données

---

## 🎯 PARTIE 1 : GÉNÉRATION TYPES DEPUIS SUPABASE

### ✅ Solution 1 : CLI Supabase (RECOMMANDÉ)

#### Installation
```bash
npm install -g supabase
```

#### Configuration
```bash
# Se connecter à votre projet
supabase login

# Lier le projet local
supabase link --project-ref vurnokaxnvittopqteno
```

#### Génération automatique des types
```bash
# Générer les types TypeScript depuis votre schéma
supabase gen types typescript --project-id vurnokaxnvittopqteno > src/types/database-generated.ts
```

#### Script NPM à ajouter dans `package.json`
```json
{
  "scripts": {
    "types:generate": "supabase gen types typescript --project-id vurnokaxnvittopqteno > src/types/database-generated.ts",
    "types:check": "tsc --noEmit"
  }
}
```

#### Utilisation
```bash
# Régénérer les types après chaque migration
npm run types:generate

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run types:check
```

---

### ✅ Solution 2 : MCP Supabase + Script personnalisé

Si vous ne voulez pas installer la CLI Supabase, créez un script qui utilise l'API :

**`scripts/generate-types.ts`**
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function generateTypes() {
  try {
    const projectRef = 'vurnokaxnvittopqteno'
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN
    
    if (!accessToken) {
      throw new Error('SUPABASE_ACCESS_TOKEN non défini')
    }

    console.log('🔄 Génération des types depuis Supabase...')
    
    const { stdout } = await execAsync(
      `curl -X GET "https://api.supabase.com/v1/projects/${projectRef}/types/typescript" \\
        -H "Authorization: Bearer ${accessToken}" \\
        > src/types/database-generated.ts`
    )
    
    console.log('✅ Types générés avec succès!')
  } catch (error) {
    console.error('❌ Erreur génération types:', error)
    process.exit(1)
  }
}

generateTypes()
```

**Ajout dans `package.json`:**
```json
{
  "scripts": {
    "types:generate": "ts-node scripts/generate-types.ts"
  }
}
```

---

## 🧪 PARTIE 2 : TESTS E2E AVEC PLAYWRIGHT

### Installation (déjà fait dans votre projet)
```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration `playwright.config.ts`

Créez ou modifiez le fichier :

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  
  // Timeout pour chaque test
  timeout: 30 * 1000,
  
  // Tests en parallèle
  fullyParallel: true,
  
  // Réessayer les tests qui échouent
  retries: process.env.CI ? 2 : 0,
  
  // Workers (tests en parallèle)
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: 'html',
  
  use: {
    // Base URL de votre app
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001',
    
    // Trace pour le débogage
    trace: 'on-first-retry',
    
    // Screenshot à chaque échec
    screenshot: 'only-on-failure',
  },

  // Projets de test (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Serveur de dev (optionnel)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

### Tests critiques pour JARVIS

**`tests/critical-paths.spec.ts`**
```typescript
import { test, expect } from '@playwright/test'

// ========================================
// TESTS CRITIQUES DASHBOARD
// ========================================

test.describe('Dashboard Critical Paths', () => {
  
  test('Doit afficher la liste des franchises sans erreur', async ({ page }) => {
    await page.goto('/dashboard/franchises')
    
    // Vérifier que la page charge
    await expect(page.locator('h1')).toContainText('Franchises')
    
    // Vérifier qu'il n'y a pas d'erreur 404
    const response = await page.waitForResponse(
      response => response.url().includes('/franchises') && response.status() === 200
    )
    expect(response.ok()).toBeTruthy()
    
    // Vérifier que les cartes de franchises s'affichent
    await expect(page.locator('[data-testid="franchise-card"]').first()).toBeVisible()
  })
  
  test('Doit charger le détail d\'une franchise avec ses salles', async ({ page }) => {
    await page.goto('/dashboard/franchises')
    
    // Cliquer sur la première franchise
    await page.locator('[data-testid="franchise-card"]').first().click()
    
    // Attendre le chargement de la page détail
    await expect(page.locator('h1')).toBeVisible()
    
    // Vérifier qu'il n'y a PAS d'erreur "gyms.is_active does not exist"
    page.on('console', msg => {
      if (msg.type() === 'error') {
        expect(msg.text()).not.toContain('is_active does not exist')
      }
    })
    
    // Vérifier que les salles s'affichent (ou message vide si aucune)
    const hasSalles = await page.locator('[data-testid="gym-card"]').count() > 0
    const hasEmptyMessage = await page.locator('text=Aucune salle').isVisible()
    
    expect(hasSalles || hasEmptyMessage).toBeTruthy()
  })
  
  test('Doit rediriger vers le kiosk avec le bon slug', async ({ page }) => {
    // Aller sur une page de salle
    await page.goto('/dashboard/franchises')
    await page.locator('[data-testid="franchise-card"]').first().click()
    
    // Cliquer sur "Accéder au Kiosk" (si présent)
    const kioskButton = page.locator('button:has-text("Accéder au Kiosk")')
    
    if (await kioskButton.isVisible() && await kioskButton.isEnabled()) {
      await kioskButton.click()
      
      // Vérifier que l'URL utilise un SLUG et pas un UUID
      await page.waitForURL(/\/kiosk\/gym-[a-z0-9]+/)
      const url = page.url()
      
      // L'URL NE DOIT PAS contenir un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      expect(url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)
    }
  })
  
  test('Doit charger /dashboard/issues sans 404', async ({ page }) => {
    await page.goto('/dashboard/issues')
    
    // Vérifier que la page existe (pas de 404)
    await expect(page.locator('h1')).toBeVisible()
    expect(page.url()).toContain('/dashboard/issues')
  })
  
  test('Doit charger /dashboard/gyms sans 404', async ({ page }) => {
    await page.goto('/dashboard/gyms')
    
    // Vérifier que la page existe
    await expect(page.locator('h1')).toContainText('Salles')
  })
})

// ========================================
// TESTS VALIDATION SCHÉMA BDD
// ========================================

test.describe('Database Schema Validation', () => {
  
  test('Les queries gyms NE doivent PAS référencer is_active', async ({ page }) => {
    // Intercepter les requêtes vers Supabase
    const badQueries: string[] = []
    
    page.on('request', request => {
      const url = request.url()
      
      // Si c'est une requête Supabase qui mentionne "gyms" ET "is_active"
      if (url.includes('supabase') && url.includes('gyms')) {
        const queryParams = new URLSearchParams(new URL(url).search)
        const select = queryParams.get('select')
        
        if (select && select.includes('is_active')) {
          badQueries.push(url)
        }
      }
    })
    
    // Naviguer sur les pages qui chargent des gyms
    await page.goto('/dashboard/franchises')
    await page.locator('[data-testid="franchise-card"]').first().click()
    await page.waitForTimeout(2000)
    
    // Vérifier qu'aucune mauvaise query n'a été faite
    expect(badQueries).toHaveLength(0)
  })
})
```

---

### Tests API

**`tests/api/kiosk.spec.ts`**
```typescript
import { test, expect } from '@playwright/test'

test.describe('API Kiosk', () => {
  
  test('GET /api/kiosk/[slug] doit accepter un SLUG valide', async ({ request }) => {
    // Utiliser un slug réel de votre BDD
    const response = await request.get('/api/kiosk/gym-iy990xkt')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.valid).toBeTruthy()
    expect(data.kiosk).toBeDefined()
    expect(data.kiosk.name).toBeDefined()
  })
  
  test('GET /api/kiosk/[uuid] doit retourner 404', async ({ request }) => {
    // Essayer avec un UUID (devrait échouer)
    const response = await request.get('/api/kiosk/dff6c3c9-5899-4248-976d-cd27decc9c8d')
    
    expect(response.status()).toBe(404)
    const data = await response.json()
    
    expect(data.valid).toBeFalsy()
    expect(data.error).toContain('non trouvé')
  })
})
```

---

## 🔄 PARTIE 3 : PRE-COMMIT HOOKS

### Installation Husky
```bash
npm install -D husky lint-staged
npx husky init
```

### Configuration `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Régénérer les types avant commit
npm run types:generate

# Vérifier TypeScript
npm run types:check

# Linter
npm run lint

# Tests E2E critiques
npm run test:e2e:critical
```

### Ajout dans `package.json`
```json
{
  "scripts": {
    "test:e2e:critical": "playwright test tests/critical-paths.spec.ts",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 🚀 PARTIE 4 : CI/CD GITHUB ACTIONS

**`.github/workflows/test.yml`**
```yaml
name: Tests & Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate types from Supabase
        run: npm run types:generate
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: TypeScript check
        run: npm run types:check
      
      - name: Lint
        run: npm run lint
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ secrets.PREVIEW_URL }}
      
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📊 PARTIE 5 : VALIDATION CONTINUE

### Script de validation quotidien

**`scripts/validate-schema.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function validateSchema() {
  console.log('🔍 Validation du schéma BDD...\n')
  
  // Vérifier que gyms n'a PAS is_active
  const { data: gymsColumns } = await supabase
    .from('gyms')
    .select('*')
    .limit(1)
  
  if (gymsColumns && gymsColumns[0]) {
    const columns = Object.keys(gymsColumns[0])
    
    if (columns.includes('is_active')) {
      console.error('❌ ERREUR: La table gyms a une colonne is_active (ne devrait pas)')
      process.exit(1)
    }
    
    if (!columns.includes('status')) {
      console.error('❌ ERREUR: La table gyms n\'a pas de colonne status')
      process.exit(1)
    }
    
    console.log('✅ Table gyms: Schema correct')
  }
  
  // Vérifier que franchises a is_active
  const { data: franchises } = await supabase
    .from('franchises')
    .select('*')
    .limit(1)
  
  if (franchises && franchises[0]) {
    const columns = Object.keys(franchises[0])
    
    if (!columns.includes('is_active')) {
      console.error('❌ ERREUR: La table franchises n\'a pas de colonne is_active')
      process.exit(1)
    }
    
    console.log('✅ Table franchises: Schema correct')
  }
  
  console.log('\n✅ Validation schéma BDD: SUCCÈS')
}

validateSchema()
```

**Ajout cron job:**
```json
{
  "scripts": {
    "validate:schema": "ts-node scripts/validate-schema.ts"
  }
}
```

---

## 🎯 RÉCAPITULATIF : WORKFLOW RECOMMANDÉ

### 1. Lors du développement
```bash
# Avant de coder, générer les types
npm run types:generate

# Développer avec autocomplétion correcte
# ...

# Avant de commit
git add .
# Husky va automatiquement:
# - Régénérer les types
# - Vérifier TypeScript
# - Lancer les tests critiques
git commit -m "feat: nouvelle fonctionnalité"
```

### 2. Avant chaque migration BDD
```bash
# 1. Appliquer la migration sur Supabase
# 2. Régénérer les types
npm run types:generate

# 3. Fixer les erreurs TypeScript qui apparaissent
npm run types:check

# 4. Commit
git commit -m "chore: update types after migration"
```

### 3. CI/CD automatique
- À chaque push sur `main` → Tests E2E complets
- À chaque PR → Validation schéma + tests
- Déploiement bloqué si tests échouent

---

## ✅ CHECKLIST MISE EN PLACE

- [ ] Installer Supabase CLI
- [ ] Configurer script `types:generate`
- [ ] Créer tests E2E critiques dans `tests/`
- [ ] Installer Husky pour pre-commit hooks
- [ ] Configurer GitHub Actions
- [ ] Ajouter script validation schéma
- [ ] Documenter le workflow pour l'équipe

---

**Temps estimé mise en place:** 2-3 heures  
**Gain de temps futur:** Évite 90% des bugs BDD en production  
**ROI:** Énorme ✨

