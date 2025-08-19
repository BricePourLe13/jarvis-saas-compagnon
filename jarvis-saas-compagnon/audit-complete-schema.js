#!/usr/bin/env node

/**
 * 🔍 AUDIT COMPLET SCHÉMA SUPABASE
 * Analyse exhaustive de TOUT le schéma existant
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function auditCompleteSchema() {
  console.log('🔍 [AUDIT SCHEMA] Analyse exhaustive Supabase...\n')
  
  try {
    // 1. AUDIT TOUTES LES TABLES
    console.log('📋 [1/5] TABLES PUBLIQUES')
    console.log('════════════════════════')
    
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')
    
    const tableData = {}
    
    for (const table of tables || []) {
      try {
        // Compter les rows
        const { count } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true })
        
        // Obtenir structure
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position')
        
        tableData[table.table_name] = {
          type: table.table_type,
          rowCount: count || 0,
          columns: columns || []
        }
        
        const status = count > 0 ? '✅' : '⚠️'
        console.log(`${status} ${table.table_name.padEnd(30)} | ${count.toString().padStart(5)} rows | ${columns?.length || 0} cols`)
      } catch (err) {
        console.log(`❌ ${table.table_name.padEnd(30)} | ERROR: ${err.message}`)
      }
    }
    
    // 2. AUDIT FONCTIONS RPC
    console.log('\n⚙️ [2/5] FONCTIONS RPC')
    console.log('═══════════════════════')
    
    const { data: functions } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION')
      .order('routine_name')
    
    if (functions && functions.length > 0) {
      functions.forEach(func => {
        console.log(`🔧 ${func.routine_name.padEnd(35)} | Returns: ${func.data_type}`)
      })
    } else {
      console.log('ℹ️ Aucune fonction RPC trouvée')
    }
    
    // 3. AUDIT TRIGGERS
    console.log('\n🔄 [3/5] TRIGGERS')
    console.log('═══════════════════')
    
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table')
      .eq('trigger_schema', 'public')
      .order('event_object_table', 'trigger_name')
    
    if (triggers && triggers.length > 0) {
      triggers.forEach(trigger => {
        console.log(`🎯 ${trigger.trigger_name.padEnd(25)} | ${trigger.event_manipulation.padEnd(8)} | ${trigger.event_object_table}`)
      })
    } else {
      console.log('ℹ️ Aucun trigger trouvé')
    }
    
    // 4. AUDIT CONTRAINTES & RELATIONS
    console.log('\n🔗 [4/5] CONTRAINTES FOREIGN KEY')
    console.log('══════════════════════════════')
    
    const { data: constraints } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .in('constraint_type', ['FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE'])
      .order('table_name', 'constraint_type')
    
    if (constraints && constraints.length > 0) {
      constraints.forEach(constraint => {
        const icon = constraint.constraint_type === 'FOREIGN KEY' ? '🔗' : 
                    constraint.constraint_type === 'PRIMARY KEY' ? '🔑' : '🦄'
        console.log(`${icon} ${constraint.table_name.padEnd(25)} | ${constraint.constraint_type.padEnd(12)} | ${constraint.constraint_name}`)
      })
    } else {
      console.log('ℹ️ Aucune contrainte trouvée')
    }
    
    // 5. AUDIT EXTENSIONS
    console.log('\n🧩 [5/5] EXTENSIONS POSTGRES')
    console.log('═══════════════════════════')
    
    try {
      const { data: extensions } = await supabase
        .from('pg_extension')
        .select('extname, extversion')
        .order('extname')
      
      if (extensions && extensions.length > 0) {
        extensions.forEach(ext => {
          console.log(`🧩 ${ext.extname.padEnd(20)} | Version: ${ext.extversion}`)
        })
      }
    } catch (err) {
      console.log('ℹ️ Extensions non accessibles avec permissions actuelles')
    }
    
    // 6. ANALYSE DES DONNÉES CRITIQUES
    console.log('\n📊 [ANALYSE] DONNÉES CRITIQUES')
    console.log('═════════════════════════════')
    
    const criticalTables = ['franchises', 'gyms', 'gym_members', 'jarvis_conversation_logs', 'openai_realtime_sessions']
    
    for (const tableName of criticalTables) {
      if (tableData[tableName]) {
        const table = tableData[tableName]
        console.log(`\n📋 ${tableName.toUpperCase()}:`)
        console.log(`   Rows: ${table.rowCount}`)
        console.log(`   Colonnes: ${table.columns.map(c => c.column_name).join(', ')}`)
        
        if (table.rowCount > 0) {
          try {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            
            if (sample && sample[0]) {
              console.log(`   Exemple: ${JSON.stringify(sample[0], null, 2).substring(0, 200)}...`)
            }
          } catch (err) {
            console.log(`   Sample: Erreur accès données`)
          }
        }
      } else {
        console.log(`\n❌ ${tableName.toUpperCase()}: N'EXISTE PAS`)
      }
    }
    
    // 7. RECOMMANDATIONS
    console.log('\n💡 [RECOMMANDATIONS] OPTIMISATION')
    console.log('═══════════════════════════════')
    
    const totalTables = Object.keys(tableData).length
    const tablesWithData = Object.values(tableData).filter(t => t.rowCount > 0).length
    const emptyTables = Object.entries(tableData).filter(([_, t]) => t.rowCount === 0).map(([name]) => name)
    
    console.log(`📊 Total tables: ${totalTables}`)
    console.log(`✅ Tables avec données: ${tablesWithData}`)
    console.log(`⚠️ Tables vides: ${emptyTables.length}`)
    
    if (emptyTables.length > 0) {
      console.log(`   Tables vides: ${emptyTables.join(', ')}`)
    }
    
    // Tables critiques manquantes ou problématiques
    const missingCritical = criticalTables.filter(t => !tableData[t])
    if (missingCritical.length > 0) {
      console.log(`❌ Tables critiques manquantes: ${missingCritical.join(', ')}`)
    }
    
    console.log('\n🎯 CONCLUSION:')
    if (emptyTables.length > 3) {
      console.log('❌ SCHEMA BORDÉLIQUE - Refonte recommandée')
    } else if (tablesWithData >= 4) {
      console.log('✅ SCHEMA RÉCUPÉRABLE - Optimisation suffisante')
    } else {
      console.log('⚠️ SCHEMA MINIMAL - Besoin de développement')
    }
    
  } catch (error) {
    console.error('❌ [AUDIT SCHEMA] Erreur:', error)
  }
}

auditCompleteSchema()
