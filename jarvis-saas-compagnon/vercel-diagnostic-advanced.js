#!/usr/bin/env node
// 🔍 Diagnostic Vercel avancé avec API officielle
// Usage: node vercel-diagnostic-advanced.js

const VERCEL_TOKEN = 'mMVrFl7nGgVBomJGVEbqsv4U'
const PROJECT_NAME = 'jarvis-saas-compagnon'

async function makeVercelAPICall(endpoint, method = 'GET', body = null) {
  try {
    const url = `https://api.vercel.com${endpoint}`
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    console.log(`🔍 API Call: ${method} ${url}`)
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Erreur API Vercel:`, error.message)
    return null
  }
}

async function getProjectInfo() {
  console.log('\n📋 === INFORMATIONS PROJET ===')
  
  const projects = await makeVercelAPICall('/v9/projects')
  if (!projects) return null

  const project = projects.projects.find(p => p.name === PROJECT_NAME)
  if (!project) {
    console.log(`❌ Projet "${PROJECT_NAME}" non trouvé`)
    return null
  }

  console.log(`✅ Projet trouvé: ${project.name}`)
  console.log(`📊 ID: ${project.id}`)
  console.log(`🌐 Framework: ${project.framework}`)
  console.log(`📅 Créé: ${new Date(project.createdAt).toLocaleString()}`)
  console.log(`🔗 Git: ${project.link?.repo || 'Non lié'}`)

  return project
}

async function getDeployments(projectId) {
  console.log('\n🚀 === DÉPLOIEMENTS ===')
  
  const deployments = await makeVercelAPICall(`/v6/deployments?projectId=${projectId}&limit=5`)
  if (!deployments) return []

  deployments.deployments.forEach((deployment, index) => {
    const status = deployment.state
    const statusEmoji = status === 'READY' ? '✅' : status === 'ERROR' ? '❌' : '🔄'
    
    console.log(`\n${statusEmoji} Déploiement ${index + 1}:`)
    console.log(`   URL: ${deployment.url}`)
    console.log(`   État: ${deployment.state}`)
    console.log(`   Branche: ${deployment.meta?.githubCommitRef || 'N/A'}`)
    console.log(`   Commit: ${deployment.meta?.githubCommitSha?.substring(0, 7) || 'N/A'}`)
    console.log(`   Créé: ${new Date(deployment.createdAt).toLocaleString()}`)
    
    if (deployment.aliasAssigned) {
      console.log(`   🌐 Domaine assigné: Oui`)
    }
  })

  return deployments.deployments
}

async function getEnvironmentVariables(projectId) {
  console.log('\n🔐 === VARIABLES D\'ENVIRONNEMENT ===')
  
  const envVars = await makeVercelAPICall(`/v9/projects/${projectId}/env`)
  if (!envVars) return []

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL'
  ]

  console.log('Variables configurées:')
  const configuredVars = envVars.envs.map(env => env.key)
  
  requiredVars.forEach(varName => {
    const isConfigured = configuredVars.includes(varName)
    const emoji = isConfigured ? '✅' : '❌'
    console.log(`   ${emoji} ${varName}: ${isConfigured ? 'Configuré' : 'MANQUANT'}`)
  })

  console.log(`\n📊 Total variables: ${envVars.envs.length}`)
  
  return envVars.envs
}

async function getDomains(projectId) {
  console.log('\n🌐 === DOMAINES ===')
  
  const domains = await makeVercelAPICall(`/v9/projects/${projectId}/domains`)
  if (!domains) return []

  if (domains.domains.length === 0) {
    console.log('❌ Aucun domaine configuré')
    return []
  }

  domains.domains.forEach(domain => {
    const emoji = domain.verified ? '✅' : '⚠️'
    console.log(`${emoji} ${domain.name}`)
    console.log(`   Vérifié: ${domain.verified ? 'Oui' : 'Non'}`)
    console.log(`   Créé: ${new Date(domain.createdAt).toLocaleString()}`)
  })

  return domains.domains
}

async function testHealthEndpoint() {
  console.log('\n🏥 === TEST HEALTH CHECK ===')
  
  try {
    const healthUrl = 'https://jarvis-saas-compagnon.vercel.app/api/health'
    console.log(`🔍 Test: ${healthUrl}`)
    
    const startTime = Date.now()
    const response = await fetch(healthUrl)
    const endTime = Date.now()
    
    const latency = endTime - startTime
    console.log(`⏱️ Latence: ${latency}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const health = await response.json()
      console.log(`✅ Status global: ${health.status}`)
      console.log(`🗄️ Database: ${health.services.database.status} (${health.services.database.latency}ms)`)
      console.log(`🔐 Auth: ${health.services.auth.status}`)
      console.log(`💾 Mémoire: ${health.performance.memory.used}MB / ${health.performance.memory.total}MB`)
    } else {
      console.log(`❌ Erreur health check: ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur test health: ${error.message}`)
  }
}

async function testFromExternalIP() {
  console.log('\n🌍 === TEST ACCÈS EXTERNE ===')
  
  try {
    // Test basique de l'app
    const appUrl = 'https://jarvis-saas-compagnon.vercel.app'
    console.log(`🔍 Test: ${appUrl}`)
    
    const response = await fetch(appUrl)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    // Vérifier les headers de sécurité
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options', 
      'strict-transport-security',
      'content-security-policy'
    ]
    
    console.log('\n🛡️ Headers sécurité:')
    securityHeaders.forEach(header => {
      const value = response.headers.get(header)
      const emoji = value ? '✅' : '❌'
      console.log(`   ${emoji} ${header}: ${value || 'MANQUANT'}`)
    })
    
  } catch (error) {
    console.log(`❌ Erreur test externe: ${error.message}`)
  }
}

async function getLogs(projectId) {
  console.log('\n📝 === LOGS RÉCENTS ===')
  
  try {
    // Note: L'API Vercel pour les logs est plus complexe et nécessite des paramètres spécifiques
    const deployments = await makeVercelAPICall(`/v6/deployments?projectId=${projectId}&limit=1`)
    
    if (deployments && deployments.deployments.length > 0) {
      const latestDeployment = deployments.deployments[0]
      console.log(`📋 Dernier déploiement: ${latestDeployment.url}`)
      console.log(`⏱️ État: ${latestDeployment.state}`)
      
      if (latestDeployment.state === 'ERROR') {
        console.log(`❌ Erreur détectée dans le dernier déploiement`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Impossible de récupérer les logs: ${error.message}`)
  }
}

async function runDiagnostic() {
  console.log('🚀 === DIAGNOSTIC VERCEL AVANCÉ ===')
  console.log(`📅 Exécuté: ${new Date().toLocaleString()}`)
  console.log(`🔑 Token: ${VERCEL_TOKEN.substring(0, 8)}...`)
  
  try {
    const project = await getProjectInfo()
    if (!project) {
      console.log('❌ Impossible de continuer sans informations projet')
      return
    }

    await getDeployments(project.id)
    await getEnvironmentVariables(project.id)
    await getDomains(project.id)
    await getLogs(project.id)
    await testHealthEndpoint()
    await testFromExternalIP()
    
    console.log('\n✅ === DIAGNOSTIC TERMINÉ ===')
    console.log('📊 Consultez les résultats ci-dessus pour identifier les problèmes')
    
  } catch (error) {
    console.error('❌ Erreur durant le diagnostic:', error)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runDiagnostic()
}

module.exports = { runDiagnostic, makeVercelAPICall }
