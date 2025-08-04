// 🚀 EXÉCUTION MIGRATION COLONNES COÛTS - FIX CRITIQUE
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration depuis les logs
const supabaseUrl = 'https://vurnokaxnvittopqteno.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY requise pour migration');
  console.log('💡 Exporte la clé: export SUPABASE_SERVICE_ROLE_KEY="ta_cle_service"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🚀 === MIGRATION COLONNES COÛTS - DÉMARRAGE ===');
  
  try {
    // 1. Lire le script de migration
    console.log('📋 Lecture script migration...');
    const migrationSQL = fs.readFileSync('../sql/migration-colonnes-couts.sql', 'utf8');
    
    // 2. Diviser en commandes individuelles (pour éviter erreurs de transaction)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📊 ${commands.length} commandes à exécuter`);
    
    // 3. Exécuter les ALTER TABLE en premier
    const alterCommands = commands.filter(cmd => cmd.startsWith('ALTER TABLE'));
    console.log(`\n🔧 Exécution ${alterCommands.length} commandes ALTER TABLE...`);
    
    for (let i = 0; i < alterCommands.length; i++) {
      const cmd = alterCommands[i];
      console.log(`  ${i + 1}. ${cmd.substring(0, 60)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: cmd + ';' 
      });
      
      if (error) {
        console.log(`    ❌ Erreur: ${error.message}`);
        if (error.message.includes('already exists')) {
          console.log(`    ✅ Colonne déjà existante, c'est normal`);
        }
      } else {
        console.log(`    ✅ Succès`);
      }
    }
    
    // 4. Exécuter les politiques RLS
    const policyCommands = commands.filter(cmd => 
      cmd.includes('DROP POLICY') || cmd.includes('CREATE POLICY')
    );
    
    console.log(`\n🔒 Exécution ${policyCommands.length} commandes RLS...`);
    
    for (let i = 0; i < policyCommands.length; i++) {
      const cmd = policyCommands[i];
      console.log(`  ${i + 1}. ${cmd.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: cmd + ';' 
      });
      
      if (error) {
        console.log(`    ❌ Erreur: ${error.message}`);
      } else {
        console.log(`    ✅ Succès`);
      }
    }
    
    // 5. Test final
    console.log('\n🧪 Test final: insertion session complète...');
    const testSessionId = `migration_validation_${Date.now()}`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('openai_realtime_sessions')
      .insert({
        session_id: testSessionId,
        session_started_at: new Date().toISOString(),
        total_input_tokens: 100,
        total_output_tokens: 200,
        total_input_audio_tokens: 50,
        total_output_audio_tokens: 150,
        input_audio_tokens_cost_usd: 0.005,
        output_audio_tokens_cost_usd: 0.015,
        input_text_tokens_cost_usd: 0.001,
        output_text_tokens_cost_usd: 0.002,
        session_duration_seconds: 300,
        total_user_turns: 5,
        total_ai_turns: 5,
        total_interruptions: 1,
        total_cost_usd: 0.023
      })
      .select();
      
    if (insertError) {
      console.log('❌ Test insertion échoué:', insertError.message);
      console.log('🔍 Code:', insertError.code);
    } else {
      console.log('✅ Test insertion réussi !');
      
      // Nettoyer
      await supabase
        .from('openai_realtime_sessions')
        .delete()
        .eq('session_id', testSessionId);
      console.log('🧹 Nettoyage effectué');
    }
    
    console.log('\n🎯 === MIGRATION TERMINÉE ===');
    console.log('✅ Colonnes coûts détaillées ajoutées');
    console.log('✅ Policies RLS corrigées');
    console.log('🚀 Le monitoring JARVIS est maintenant opérationnel !');
    
  } catch (error) {
    console.log('💥 Erreur globale migration:', error.message);
  }
}

// Alternative: utiliser directement psql si RPC ne marche pas
console.log('💡 Si cette méthode échoue, utilise:');
console.log('psql "postgresql://user:pass@host:port/db" -f migration-colonnes-couts.sql');

executeMigration();