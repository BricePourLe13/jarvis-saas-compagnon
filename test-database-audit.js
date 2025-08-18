/**
 * 🔍 TEST AUDIT BASE DE DONNÉES
 */

async function testDatabaseAudit() {
  console.log('🔍 Audit complet de la base de données...\n')
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/audit-database')

    if (response.ok) {
      const result = await response.json()
      const audit = result.audit
      
      console.log('✅ AUDIT TERMINÉ !')
      console.log(`📅 Timestamp: ${audit.timestamp}`)
      
      console.log('\n📊 RÉSUMÉ DES TABLES:')
      Object.entries(audit.tables).forEach(([table, stats]) => {
        console.log(`\n📋 ${table.toUpperCase()}:`)
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`  - ${key}: ${JSON.stringify(value)}`)
        })
      })
      
      if (audit.inconsistencies.length > 0) {
        console.log('\n❌ INCOHÉRENCES DÉTECTÉES:')
        audit.inconsistencies.forEach((inc, i) => {
          console.log(`${i+1}. ${inc.type}: ${inc.description} (${inc.count} éléments)`)
        })
      }
      
      if (audit.recommendations.length > 0) {
        console.log('\n🎯 RECOMMANDATIONS:')
        audit.recommendations.forEach((rec, i) => {
          console.log(`${i+1}. [${rec.priority}] ${rec.issue}`)
          console.log(`   → ${rec.solution}`)
        })
      }
    } else {
      const error = await response.text()
      console.error('❌ Erreur audit:', response.status, error)
    }
  } catch (error) {
    console.error('🚨 Erreur connexion:', error.message)
  }
}

testDatabaseAudit()
