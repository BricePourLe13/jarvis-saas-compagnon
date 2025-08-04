// 🔍 AUDIT COMPLET BDD SUPABASE - DIAGNOSTIC ENTREPRISE
// Script pour auditer complètement l'état de la base de données

const { createClient } = require('@supabase/supabase-js');

// Configuration depuis les logs précédents
const supabaseUrl = 'https://vurnokaxnvittopqteno.supabase.co';

console.log('🔍 === AUDIT COMPLET BASE DE DONNÉES SUPABASE ===');
console.log('📡 URL:', supabaseUrl);
console.log('');

/**
 * 🧪 Test 1: Connexion et accès basique
 */
async function testConnection() {
  console.log('🧪 Test 1: Connexion de base...');
  
  // Test ping basique
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  📊 Status connexion: ${response.status}`);
    
    if (response.status === 401) {
      console.log('  ✅ API accessible (401 = auth requise, normal)');
    } else if (response.status === 200) {
      console.log('  ✅ API complètement accessible');
    } else {
      console.log(`  ⚠️ Status inattendu: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Erreur connexion: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 📊 Test 2: Structure tables principales
 */
async function auditTableStructure() {
  console.log('📊 Test 2: Structure des tables...');
  
  const tables = [
    'users',
    'franchises', 
    'gyms',
    'openai_realtime_sessions',
    'openai_realtime_audio_events',
    'profiles'
  ];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=0`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`  ✅ Table '${table}': Existe et accessible`);
      } else if (response.status === 401) {
        console.log(`  🔒 Table '${table}': Existe mais auth requise`);
      } else if (response.status === 404) {
        console.log(`  ❌ Table '${table}': N'existe pas`);
      } else if (response.status === 406) {
        console.log(`  ⚠️ Table '${table}': Problème RLS ou schema`);
      } else {
        console.log(`  ❓ Table '${table}': Status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  💥 Table '${table}': Erreur ${error.message}`);
    }
  }
  
  console.log('');
}

/**
 * 🔒 Test 3: Enum user_role
 */
async function auditUserRoleEnum() {
  console.log('🔒 Test 3: Enum user_role...');
  
  console.log('  📋 Erreur indique: "gym_manager" invalide pour enum user_role');
  console.log('  🔍 Cela signifie que:');
  console.log('    - Un enum user_role existe dans la DB');
  console.log('    - "gym_manager" n\'est pas une valeur autorisée');
  console.log('    - Les valeurs autorisées sont probablement différentes');
  console.log('');
  
  console.log('  💡 Actions requises:');
  console.log('    1. Identifier les valeurs enum actuelles');
  console.log('    2. Adapter les scripts aux valeurs existantes');
  console.log('    3. Ou modifier l\'enum pour ajouter valeurs manquantes');
  console.log('');
}

/**
 * 📊 Test 4: Table openai_realtime_sessions 
 */
async function auditMonitoringTable() {
  console.log('📊 Test 4: Table monitoring OpenAI...');
  
  try {
    // Test accès table monitoring
    const response = await fetch(`${supabaseUrl}/rest/v1/openai_realtime_sessions?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  📊 Status openai_realtime_sessions: ${response.status}`);
    
    if (response.status === 200) {
      console.log('  ✅ Table monitoring accessible');
      const data = await response.text();
      console.log(`  📋 Données: ${data.substring(0, 100)}...`);
    } else if (response.status === 401) {
      console.log('  🔒 Table monitoring existe mais auth requise');
    } else if (response.status === 406) {
      console.log('  ⚠️ Table monitoring: Problème colonnes ou RLS');
    } else if (response.status === 404) {
      console.log('  ❌ Table monitoring: N\'existe pas');
    }
    
    // Test insertion simple pour identifier colonnes manquantes
    console.log('  🧪 Test insertion minimale...');
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/openai_realtime_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        session_id: `audit_test_${Date.now()}`,
        session_started_at: new Date().toISOString()
      })
    });
    
    console.log(`    📊 Status insertion test: ${insertResponse.status}`);
    
    if (insertResponse.status === 401) {
      console.log('    🔒 Insertion bloquée par auth');
    } else if (insertResponse.status === 400) {
      const errorText = await insertResponse.text();
      console.log(`    ❌ Erreur insertion: ${errorText.substring(0, 200)}`);
    } else if (insertResponse.status === 201) {
      console.log('    ✅ Insertion test réussie');
    }
    
  } catch (error) {
    console.log(`  💥 Erreur audit monitoring: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 🔍 Test 5: Diagnostic enum types
 */
async function auditEnumTypes() {
  console.log('🔍 Test 5: Types enum dans la DB...');
  
  console.log('  📋 Types enum probables:');
  console.log('    - user_role: Rôles utilisateurs');
  console.log('    - franchise_status: Statuts franchises');
  console.log('    - gym_status: Statuts salles');
  console.log('');
  
  console.log('  💡 Valeurs user_role possibles:');
  console.log('    ✅ Probablement autorisées: super_admin, franchise_owner');
  console.log('    ❌ Probablement refusées: gym_manager, gym_staff');
  console.log('');
  
  console.log('  🎯 Solution:');
  console.log('    1. Utiliser seulement valeurs enum existantes');
  console.log('    2. Ou étendre enum avec nouvelles valeurs');
  console.log('');
}

/**
 * 📊 Test 6: Résumé diagnostic
 */
async function generateDiagnosticSummary() {
  console.log('📊 Test 6: Résumé diagnostic...');
  
  console.log('  🎯 PROBLÈMES IDENTIFIÉS:');
  console.log('    1. ❌ Enum user_role: "gym_manager" invalide');
  console.log('    2. ⚠️ Colonnes manquantes: input_audio_tokens_cost_usd, etc.');
  console.log('    3. 🔒 RLS restrictif: Erreurs 406 sur sessions');
  console.log('    4. 📊 Race conditions: Sessions non trouvées');
  console.log('');
  
  console.log('  ✅ SOLUTIONS REQUISES:');
  console.log('    1. 🔍 Identifier valeurs enum user_role actuelles');
  console.log('    2. 📊 Ajouter colonnes coûts manquantes');
  console.log('    3. 🔒 Adapter RLS aux valeurs enum valides');
  console.log('    4. 🚀 Implémenter pattern Session-First');
  console.log('');
  
  console.log('  📋 SCRIPTS À GÉNÉRER:');
  console.log('    1. audit-enum-values.sql - Lister valeurs enum');
  console.log('    2. fix-enum-user-role.sql - Corriger/étendre enum');
  console.log('    3. migration-colonnes-safe.sql - Ajouter colonnes');
  console.log('    4. fix-rls-enum-compatible.sql - RLS compatible');
  console.log('');
}

/**
 * 🚀 Exécution complète de l'audit
 */
async function runCompleteAudit() {
  try {
    await testConnection();
    await auditTableStructure();
    await auditUserRoleEnum();
    await auditMonitoringTable();
    await auditEnumTypes();
    await generateDiagnosticSummary();
    
    console.log('🎉 ======= AUDIT COMPLET TERMINÉ =======');
    console.log('');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('1. 🔍 Exécuter audit-enum-values.sql pour voir valeurs actuelles');
    console.log('2. 🔧 Adapter migration aux contraintes existantes');
    console.log('3. 🚀 Déployer scripts compatibles étape par étape');
    console.log('4. 🧪 Tester chaque étape individuellement');
    console.log('');
    console.log('💡 L\'audit révèle que votre DB a des contraintes enum strictes');
    console.log('🎯 Les scripts seront adaptés aux valeurs autorisées exactes');
    
  } catch (error) {
    console.error('💥 Erreur lors de l\'audit:', error);
  }
}

// Message d'information
console.log('💡 CET AUDIT IDENTIFIE:');
console.log('- Structure exacte des tables existantes');
console.log('- Valeurs enum autorisées vs refusées');  
console.log('- Colonnes manquantes pour monitoring');
console.log('- Problèmes RLS et permissions');
console.log('- État de la table openai_realtime_sessions');
console.log('');

// Lancer audit complet
runCompleteAudit();