#!/usr/bin/env node

/**
 * 🚀 APPLIQUER LES RPCs MANQUANTES
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function applyMissingRPCs() {
  console.log('🚀 [APPLY RPCs] Application des fonctions manquantes...\n')
  
  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('sql/missing-rpcs.sql', 'utf8')
    
    // Diviser par fonctions (basique)
    const functions = sqlContent.split('CREATE OR REPLACE FUNCTION').filter(f => f.trim())
    
    console.log(`📝 Trouvé ${functions.length} fonctions à créer\n`)
    
    for (let i = 0; i < functions.length; i++) {
      const func = 'CREATE OR REPLACE FUNCTION' + functions[i]
      const funcName = func.match(/FUNCTION\s+([^(]+)/)?.[1]?.trim() || `function_${i+1}`
      
      try {
        console.log(`🔧 Création ${funcName}...`)
        
        // Utiliser la REST API pour exécuter le SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: func })
        })
        
        if (response.ok) {
          console.log(`✅ ${funcName} créée avec succès`)
        } else {
          const errorText = await response.text()
          console.log(`❌ ${funcName}: ${response.status} - ${errorText.substring(0, 200)}`)
        }
      } catch (err) {
        console.log(`❌ ${funcName}: Exception - ${err.message}`)
      }
      console.log('')
    }
    
    // Test des nouvelles fonctions
    console.log('🧪 [TEST] Vérification des nouvelles fonctions...\n')
    
    const testRPCs = [
      { name: 'get_kiosk_realtime_metrics', params: {} },
      { name: 'cleanup_inactive_realtime_sessions', params: {} }
    ]
    
    for (const rpc of testRPCs) {
      try {
        console.log(`🧪 Test ${rpc.name}...`)
        const { data, error } = await supabase.rpc(rpc.name, rpc.params)
        
        if (error) {
          console.log(`❌ ${rpc.name}: ${error.message}`)
        } else {
          console.log(`✅ ${rpc.name}: Fonctionne !`)
          console.log(`   📊 Résultat: ${JSON.stringify(data).substring(0, 200)}...`)
        }
      } catch (err) {
        console.log(`❌ ${rpc.name}: Exception - ${err.message}`)
      }
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ [APPLY RPCs] Erreur:', error)
  }
}

applyMissingRPCs()
