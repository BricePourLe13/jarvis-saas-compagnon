#!/usr/bin/env node

/**
 * 🔍 AUDIT COMPLET SUPABASE
 * Analyse exhaustive de la base de données vs utilisation app
 */

const https = require('https')

console.log('🔍 [AUDIT SUPABASE] Démarrage audit complet...\n')

// Fonction pour faire des requêtes HTTP
function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data })
        }
      })
    }).on('error', reject)
  })
}

async function runCompleteAudit() {
  try {
    console.log('📊 [1/3] Audit schéma et données Supabase...')
    const dbAudit = await fetchAPI('https://www.jarvis-group.net/api/debug/audit-complete-db')
    
    console.log('🔍 [2/3] Audit requêtes et usage app...')
    const appAudit = await fetchAPI('https://www.jarvis-group.net/api/debug/audit-app-queries')
    
    console.log('⚖️ [3/3] Comparaison et analyse...\n')
    
    // === ANALYSE DU SCHÉMA DB ===
    console.log('🗄️ SCHÉMA SUPABASE:')
    console.log('═══════════════════')
    
    if (dbAudit.success) {
      const { schema, data, summary } = dbAudit.audit
      
      console.log(`📋 Tables trouvées: ${schema.totalTables}`)
      console.log(`📊 Tables avec données: ${summary.tablesWithData}`)
      console.log(`📈 Total enregistrements: ${summary.totalRecords}`)
      console.log(`🗳️ Tables vides: ${summary.emptyTables.join(', ') || 'Aucune'}\n`)
      
      // Détail par table
      console.log('📋 DÉTAIL DES TABLES:')
      console.log('─────────────────────')
      Object.entries(data).forEach(([tableName, info]) => {
        const status = info.hasData ? '✅' : '⚠️'
        const count = info.count || 0
        console.log(`${status} ${tableName.padEnd(25)} | ${count.toString().padStart(5)} rows`)
      })
      console.log('')
      
      // Colonnes importantes
      console.log('🔧 COLONNES PAR TABLE:')
      console.log('─────────────────────')
      Object.entries(schema.columns).forEach(([tableName, columns]) => {
        console.log(`\n📋 ${tableName}:`)
        columns.slice(0, 8).forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '?' : '!'
          console.log(`  - ${col.column_name}${nullable} (${col.data_type})`)
        })
        if (columns.length > 8) {
          console.log(`  ... et ${columns.length - 8} autres colonnes`)
        }
      })
    } else {
      console.log('❌ Erreur audit DB:', dbAudit.error)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // === ANALYSE DE L'APP ===
    console.log('🔍 USAGE APPLICATION:')
    console.log('═══════════════════')
    
    if (appAudit.success) {
      const { expectedTables, expectedRPCs, queryPatterns, potentialIssues } = appAudit.analysis
      
      console.log('📊 TABLES UTILISÉES PAR CONTEXTE:')
      console.log('─────────────────────────────────')
      Object.entries(queryPatterns).forEach(([context, info]) => {
        console.log(`\n🎯 ${context}:`)
        console.log(`  Tables: ${info.tables.join(', ')}`)
        console.log(`  Operations: ${info.operations.join(', ')}`)
      })
      
      console.log('\n🔧 FONCTIONS RPC ATTENDUES:')
      console.log('──────────────────────────')
      Object.entries(expectedRPCs).forEach(([name, info]) => {
        console.log(`📝 ${name}`)
        console.log(`   Purpose: ${info.purpose}`)
        console.log(`   Params: ${info.params.join(', ')}`)
      })
    } else {
      console.log('❌ Erreur audit app:', appAudit.error)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // === COMPARAISON ET PROBLÈMES ===
    console.log('🚨 PROBLÈMES IDENTIFIÉS:')
    console.log('═══════════════════════')
    
    if (appAudit.success && appAudit.analysis.potentialIssues) {
      const issues = appAudit.analysis.potentialIssues
      
      console.log('❌ COLONNES MANQUANTES:')
      Object.entries(issues.missingColumns).forEach(([table, cols]) => {
        console.log(`  ${table}: ${cols.join(', ')}`)
      })
      
      console.log('\n❌ TABLES MANQUANTES:')
      issues.missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })
      
      console.log('\n⚡ INDEX MANQUANTS:')
      issues.missingIndexes.forEach(index => {
        console.log(`  - ${index}`)
      })
    }
    
    // === RECOMMANDATIONS ===
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('═════════════════')
    
    if (appAudit.success && appAudit.analysis.recommendations) {
      const recs = appAudit.analysis.recommendations
      
      console.log('🚨 IMMÉDIAT:')
      recs.immediate.forEach(rec => console.log(`  - ${rec}`))
      
      console.log('\n⚡ OPTIMISATION:')
      recs.optimization.forEach(rec => console.log(`  - ${rec}`))
      
      console.log('\n🔮 FUTUR:')
      recs.future.forEach(rec => console.log(`  - ${rec}`))
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ AUDIT TERMINÉ AVEC SUCCÈS!')
    console.log('📊 Voir détails dans les APIs /api/debug/audit-*')
    
  } catch (error) {
    console.error('❌ Erreur audit:', error.message)
  }
}

// Exécuter l'audit
runCompleteAudit()
