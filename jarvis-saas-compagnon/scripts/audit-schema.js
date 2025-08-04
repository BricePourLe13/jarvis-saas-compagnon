// 🔍 AUDIT SCHEMA SUPABASE - DIAGNOSTIC MONITORING JARVIS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditSchema() {
  console.log('🔍 === AUDIT SCHEMA MONITORING JARVIS ===\n');

  try {
    // 1. Vérifier existence table
    console.log('📊 1. Vérification existence table openai_realtime_sessions...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_name', 'openai_realtime_sessions');
    
    if (tablesError) {
      console.log('❌ Erreur vérification table:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ Table openai_realtime_sessions INEXISTANTE !');
      console.log('📋 Action requise: Exécuter script de création table');
      return;
    }

    console.log('✅ Table existe:', tables[0]);

    // 2. Lister colonnes actuelles
    console.log('\n📊 2. Audit colonnes actuelles...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'openai_realtime_sessions')
      .order('ordinal_position');

    if (columnsError) {
      console.log('❌ Erreur lecture colonnes:', columnsError.message);
      return;
    }

    console.log('📋 Colonnes actuelles:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Vérifier colonnes critiques manquantes
    const requiredColumns = [
      'input_audio_tokens_cost_usd',
      'output_audio_tokens_cost_usd', 
      'input_text_tokens_cost_usd',
      'output_text_tokens_cost_usd',
      'total_input_audio_tokens',
      'total_output_audio_tokens',
      'session_duration_seconds',
      'total_user_turns',
      'total_ai_turns',
      'total_interruptions'
    ];

    const currentColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(req => !currentColumns.includes(req));

    console.log('\n🚨 3. Colonnes manquantes critiques:');
    if (missingColumns.length === 0) {
      console.log('✅ Toutes les colonnes requises sont présentes !');
    } else {
      missingColumns.forEach(col => {
        console.log(`  ❌ ${col}`);
      });
    }

    // 4. Test insertion simple
    console.log('\n🧪 4. Test insertion session...');
    const testSessionId = `test_${Date.now()}`;
    
    const { data: insertTest, error: insertError } = await supabase
      .from('openai_realtime_sessions')
      .insert({
        session_id: testSessionId,
        session_started_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.log('❌ Erreur test insertion:', insertError.message);
      console.log('🔍 Code erreur:', insertError.code);
      console.log('🔍 Détails:', insertError.details);
    } else {
      console.log('✅ Test insertion réussi');
      
      // Nettoyer test
      await supabase
        .from('openai_realtime_sessions')
        .delete()
        .eq('session_id', testSessionId);
      console.log('🧹 Session test supprimée');
    }

    // 5. Audit RLS
    console.log('\n🔒 5. Audit Row Level Security...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('openai_realtime_sessions')
      .select('id')
      .limit(1);

    if (rlsError) {
      console.log('❌ Erreur RLS:', rlsError.message);
      if (rlsError.code === '42501') {
        console.log('🚨 PROBLÈME RLS: Permissions insuffisantes');
      }
    } else {
      console.log('✅ RLS semble fonctionnel');
    }

  } catch (error) {
    console.log('💥 Erreur globale:', error.message);
  }

  console.log('\n🎯 === FIN AUDIT ===');
}

auditSchema();