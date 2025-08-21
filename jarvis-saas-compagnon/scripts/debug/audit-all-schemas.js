#!/usr/bin/env node

/**
 * 🔍 AUDIT TOUS LES SCHÉMAS SUPABASE
 * Trouve où sont vraiment tes tables !
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function auditAllSchemas() {
  console.log('🔍 [AUDIT GLOBAL] Recherche de TOUS les schémas...\n')
  
  try {
    // 1. LISTER TOUS LES SCHÉMAS
    console.log('📂 [1/4] TOUS LES SCHÉMAS DISPONIBLES')
    console.log('════════════════════════════════════')
    
    const { data: schemas, error: schemasError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .order('schema_name')
    
    if (schemasError) {
      console.error('❌ Erreur schémas:', schemasError)
    } else {
      schemas.forEach(schema => {
        console.log(`📂 ${schema.schema_name}`)
      })
    }
    
    // 2. TABLES PAR SCHÉMA
    console.log('\n📋 [2/4] TABLES PAR SCHÉMA')
    console.log('═══════════════════════════')
    
    const schemaNames = ['public', 'auth', 'storage', 'realtime', 'supabase_migrations']
    
    for (const schemaName of schemaNames) {
      console.log(`\n📂 SCHÉMA: ${schemaName.toUpperCase()}`)
      console.log('─'.repeat(40))
      
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', schemaName)
        .order('table_name')
      
      if (tablesError) {
        console.log(`❌ Erreur accès ${schemaName}: ${tablesError.message}`)
      } else if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  📋 ${table.table_name} (${table.table_type})`)
        })
      } else {
        console.log(`  ℹ️ Aucune table dans ${schemaName}`)
      }
    }
    
    // 3. TEST DIRECT DES TABLES CONNUES
    console.log('\n🎯 [3/4] TEST DIRECT TABLES CONNUES')
    console.log('═══════════════════════════════════')
    
    const knownTables = ['franchises', 'gyms', 'gym_members', 'profiles']
    
    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${count} rows`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }
    
    // 4. TEST VIA REST API DIRECTE
    console.log('\n🌐 [4/4] TEST VIA REST API SUPABASE')
    console.log('════════════════════════════════════')
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/gyms?select=id,name&limit=3`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ REST API gyms: ${JSON.stringify(data).substring(0, 200)}...`)
      } else {
        console.log(`❌ REST API gyms: ${response.status} - ${response.statusText}`)
        const errorText = await response.text()
        console.log(`   Erreur: ${errorText.substring(0, 200)}`)
      }
    } catch (err) {
      console.log(`❌ REST API: ${err.message}`)
    }
    
    // 5. TEST PERMISSIONS ACTUELLES
    console.log('\n🔑 [BONUS] TEST PERMISSIONS SERVICE ROLE')
    console.log('═══════════════════════════════════════')
    
    try {
      // Test simple query pour voir ce qu'on peut lire
      const { data: testQuery, error: testError } = await supabase
        .rpc('current_user')
      
      if (testError) {
        console.log('❌ Current user:', testError.message)
      } else {
        console.log('✅ Current user:', testQuery)
      }
    } catch (err) {
      console.log('❌ Test permissions:', err.message)
    }
    
    console.log('\n🎯 DIAGNOSTIC:')
    console.log('Si toutes les tables sont vides/inexistantes, soit:')
    console.log('1. Les données sont dans un autre projet Supabase')
    console.log('2. Les tables sont dans un schéma non-public')
    console.log('3. Il y a un problème de permissions RLS')
    console.log('4. Tu utilises une autre base de données')
    
  } catch (error) {
    console.error('❌ [AUDIT GLOBAL] Erreur:', error)
  }
}

auditAllSchemas()
