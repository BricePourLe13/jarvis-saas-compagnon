// 🔍 AUDIT SCHEMA SIMPLE - DIAGNOSTIC DIRECT
const { createClient } = require('@supabase/supabase-js');

// Utilisation directe de l'URL visible dans les logs
const supabaseUrl = 'https://vurnokaxnvittopqteno.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

console.log('🔍 === AUDIT SCHEMA MONITORING JARVIS ===');
console.log('📡 Supabase URL:', supabaseUrl);

if (supabaseKey === 'your_service_role_key_here') {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY non définie');
  console.log('💡 Utilisation clé anon pour test de base...');
}

// Utilisons la clé publique pour un test de base
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5MTA5MTYsImV4cCI6MjAzNzQ4NjkxNn0.VKCumzlrJjJ0D3sFCJKa9KlU8fmkJdNwEKFpTEU0zY8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditSimple() {
  try {
    console.log('\n📊 Test connexion Supabase...');
    
    // Test très simple : essayer de lire la table
    const { data, error } = await supabase
      .from('openai_realtime_sessions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erreur lecture table:', error.message);
      console.log('🔍 Code:', error.code);
      console.log('🔍 Détails:', error.details);
      
      if (error.code === '42P01') {
        console.log('🚨 DIAGNOSTIC: Table openai_realtime_sessions INEXISTANTE');
      } else if (error.code === '42501') {
        console.log('🚨 DIAGNOSTIC: Problème RLS - Permissions insuffisantes');
      } else if (error.code === 'PGRST204') {
        console.log('🚨 DIAGNOSTIC: Colonnes demandées inexistantes');
      }
      
      return;
    }

    console.log('✅ Table accessible');
    console.log('📊 Premier enregistrement:', data?.[0] || 'Aucun');

    // Test insertion minimale
    console.log('\n🧪 Test insertion minimale...');
    const testId = `audit_${Date.now()}`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('openai_realtime_sessions')
      .insert({
        session_id: testId,
        session_started_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
      console.log('🔍 Code:', insertError.code);
      
      if (insertError.code === '23502') {
        console.log('🚨 DIAGNOSTIC: Colonnes NOT NULL manquantes');
      } else if (insertError.code === '42703') {
        console.log('🚨 DIAGNOSTIC: Colonne inexistante dans table');
      }
    } else {
      console.log('✅ Insertion test réussie');
      
      // Nettoyer
      await supabase
        .from('openai_realtime_sessions')
        .delete()
        .eq('session_id', testId);
      console.log('🧹 Nettoyage effectué');
    }

  } catch (error) {
    console.log('💥 Erreur globale:', error.message);
  }

  console.log('\n🎯 === FIN AUDIT SIMPLE ===');
}

auditSimple();