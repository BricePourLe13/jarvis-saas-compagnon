/**
 * 🔍 SCRIPT DE VÉRIFICATION DES REDIRECTIONS
 * Vérifie que toutes les pages de redirection sont propres et fonctionnelles
 */

const fs = require('fs')
const path = require('path')

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`)

// Pages de redirection attendues
const redirectionPages = [
  {
    path: 'src/app/dashboard/page.tsx',
    target: '/dashboard/sentry',
    description: 'Dashboard principal → Sentry'
  },
  {
    path: 'src/app/admin/page.tsx', 
    target: '/dashboard',
    description: 'Admin → Dashboard'
  },
  {
    path: 'src/app/dashboard/members/[memberId]/page.tsx',
    target: '/dashboard/members/${memberId}/sentry',
    description: 'Profil membre → Sentry'
  },
  {
    path: 'src/app/dashboard/franchises/[id]/page.tsx',
    target: '/dashboard/franchises/${id}/sentry',
    description: 'Franchise → Sentry'
  },
  {
    path: 'src/app/dashboard/franchises/[id]/gyms/[gymId]/page.tsx',
    target: '/dashboard/franchises/${id}/gyms/${gymId}/sentry',
    description: 'Gym → Sentry'
  },
  {
    path: 'src/app/dashboard/sessions/[sessionId]/page.tsx',
    target: '/dashboard/sessions/${sessionId}/sentry',
    description: 'Session → Sentry'
  }
]

// Nouvelles pages Sentry attendues
const sentryPages = [
  {
    path: 'src/app/dashboard/sentry/page.tsx',
    description: 'Dashboard principal Sentry'
  },
  {
    path: 'src/app/dashboard/members/[memberId]/sentry/page.tsx',
    description: 'Profil membre Sentry'
  },
  {
    path: 'src/app/dashboard/franchises/[id]/sentry/page.tsx',
    description: 'Franchise Sentry'
  },
  {
    path: 'src/app/dashboard/franchises/[id]/gyms/[gymId]/sentry/page.tsx',
    description: 'Gym Sentry'
  },
  {
    path: 'src/app/dashboard/sessions/[sessionId]/sentry/page.tsx',
    description: 'Session Sentry'
  }
]

function checkFileExists(filePath) {
  return fs.existsSync(filePath)
}

function checkRedirectionFile(filePath, expectedTarget) {
  if (!checkFileExists(filePath)) {
    return { exists: false, valid: false, error: 'Fichier manquant' }
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Vérifications basiques
    const hasUseClient = content.includes("'use client'")
    const hasUseEffect = content.includes('useEffect')
    const hasRouter = content.includes('useRouter')
    const hasRedirect = content.includes('router.replace')
    const hasSpinner = content.includes('Spinner')
    
    // Vérifier la cible de redirection
    const hasCorrectTarget = content.includes(expectedTarget.replace('${', '${'))
    
    // Vérifier qu'il n'y a pas d'ancien code problématique
    const hasOldCode = content.includes('/* ANCIEN CODE') || 
                      content.includes('// ANCIEN CODE') ||
                      content.includes('function ') && content.split('function ').length > 2
    
    const issues = []
    if (!hasUseClient) issues.push("Manque 'use client'")
    if (!hasUseEffect) issues.push("Manque useEffect")
    if (!hasRouter) issues.push("Manque useRouter")
    if (!hasRedirect) issues.push("Manque router.replace")
    if (!hasSpinner) issues.push("Manque Spinner")
    if (!hasCorrectTarget) issues.push(`Cible incorrecte (attendu: ${expectedTarget})`)
    if (hasOldCode) issues.push("Contient encore de l'ancien code")
    
    return {
      exists: true,
      valid: issues.length === 0,
      issues: issues,
      hasOldCode: hasOldCode
    }
  } catch (error) {
    return { exists: true, valid: false, error: error.message }
  }
}

function checkSentryFile(filePath) {
  if (!checkFileExists(filePath)) {
    return { exists: false, valid: false, error: 'Fichier manquant' }
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Vérifications basiques pour les pages Sentry
    const hasUseClient = content.includes("'use client'")
    const hasSentryLayout = content.includes('SentryDashboardLayout')
    const hasSupabase = content.includes('getSupabaseSingleton')
    const hasUseEffect = content.includes('useEffect')
    
    const issues = []
    if (!hasUseClient) issues.push("Manque 'use client'")
    if (!hasSentryLayout) issues.push("Manque SentryDashboardLayout")
    if (!hasSupabase) issues.push("Manque getSupabaseSingleton")
    if (!hasUseEffect) issues.push("Manque useEffect")
    
    return {
      exists: true,
      valid: issues.length === 0,
      issues: issues
    }
  } catch (error) {
    return { exists: true, valid: false, error: error.message }
  }
}

function main() {
  log('blue', '🔍 VÉRIFICATION DES REDIRECTIONS DASHBOARD\n')
  
  let allValid = true
  let totalChecks = 0
  let validChecks = 0

  // Vérifier les pages de redirection
  log('yellow', '📄 Pages de redirection:')
  for (const page of redirectionPages) {
    totalChecks++
    const result = checkRedirectionFile(page.path, page.target)
    
    if (result.exists && result.valid) {
      log('green', `✅ ${page.description}`)
      validChecks++
    } else if (result.exists && !result.valid) {
      log('red', `❌ ${page.description}`)
      if (result.issues) {
        result.issues.forEach(issue => log('red', `   • ${issue}`))
      }
      if (result.error) {
        log('red', `   • Erreur: ${result.error}`)
      }
      allValid = false
    } else {
      log('red', `❌ ${page.description} - ${result.error}`)
      allValid = false
    }
  }

  log('yellow', '\n🎯 Pages Sentry:')
  for (const page of sentryPages) {
    totalChecks++
    const result = checkSentryFile(page.path)
    
    if (result.exists && result.valid) {
      log('green', `✅ ${page.description}`)
      validChecks++
    } else if (result.exists && !result.valid) {
      log('red', `❌ ${page.description}`)
      if (result.issues) {
        result.issues.forEach(issue => log('red', `   • ${issue}`))
      }
      if (result.error) {
        log('red', `   • Erreur: ${result.error}`)
      }
      allValid = false
    } else {
      log('red', `❌ ${page.description} - ${result.error}`)
      allValid = false
    }
  }

  // Résumé
  log('blue', '\n📊 RÉSUMÉ:')
  log('blue', `Total vérifié: ${totalChecks}`)
  log('green', `Valide: ${validChecks}`)
  log('red', `Problèmes: ${totalChecks - validChecks}`)
  
  if (allValid) {
    log('green', '\n🎉 Toutes les redirections sont correctes !')
  } else {
    log('red', '\n⚠️  Des problèmes ont été détectés.')
    log('yellow', '\n💡 Actions recommandées:')
    log('yellow', '   1. Corriger les fichiers de redirection problématiques')
    log('yellow', '   2. Supprimer l\'ancien code des fichiers de redirection')
    log('yellow', '   3. Vérifier que toutes les pages Sentry existent')
    log('yellow', '   4. Relancer ce script pour vérifier')
  }

  process.exit(allValid ? 0 : 1)
}

main()
