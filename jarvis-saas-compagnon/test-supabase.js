#!/usr/bin/env node

// Test de connexion Supabase après configuration DB
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlktijcxafzxctdlncj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybGt0aWpjeGFmenhjdGRsbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTA5NTksImV4cCI6MjA2ODMyNjk1OX0.eDdkCOFdVjqkoap1PUtWpSK4AnqNBvcRi5OHbxOazzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConfiguration() {
  console.log('🔄 Test de la configuration de la base de données JARVIS...\n');
  
  try {
    // Test 1: Tables créées
    console.log('📋 Vérification des tables...');
    const { data: franchises, error: franchiseError } = await supabase.from('franchises').select('count').limit(1);
    
    if (franchiseError) {
      console.log('❌ Tables non créées:', franchiseError.message);
      console.log('👉 Exécutez d\'abord le script SQL dans Supabase');
      return;
    }
    
    console.log('✅ Tables créées avec succès !');
    
    // Test 2: Données de test
    console.log('\n📊 Vérification des données de test...');
    const { data: testData, error: dataError } = await supabase
      .from('franchises')
      .select('name, owner_email')
      .limit(5);
    
    if (dataError) {
      console.log('❌ Erreur lecture données:', dataError.message);
    } else {
      console.log('✅ Données de test trouvées:');
      testData.forEach(franchise => {
        console.log(`   - ${franchise.name} (${franchise.owner_email})`);
      });
    }
    
    // Test 3: Vérification compte admin
    console.log('\n👨‍💼 Vérification compte admin...');
    const { data: adminFranchise } = await supabase
      .from('franchises')
      .select('name')
      .eq('owner_email', 'brice@jarvis-group.net')
      .single();
    
    if (adminFranchise) {
      console.log(`✅ Compte admin configuré: ${adminFranchise.name}`);
    } else {
      console.log('❌ Compte admin non trouvé');
    }
    
    // Test 4: Vérification salle de démo
    console.log('\n🏋️ Vérification salle de démo...');
    const { data: demoGym } = await supabase
      .from('gyms')
      .select('name, capacity')
      .eq('name', 'JARVIS Demo Gym')
      .single();
    
    if (demoGym) {
      console.log(`✅ Salle de démo trouvée: ${demoGym.name} (${demoGym.capacity} places)`);
    } else {
      console.log('❌ Salle de démo non trouvée');
    }
    
    // Test 5: Données membres
    console.log('\n👥 Vérification membres de test...');
    const { data: members } = await supabase
      .from('members')
      .select('first_name, last_name, status, churn_risk_score')
      .limit(5);
    
    if (members && members.length > 0) {
      console.log('✅ Membres de test trouvés:');
      members.forEach(member => {
        const risk = member.churn_risk_score > 0.5 ? '🚨 RISQUE' : '✅ OK';
        console.log(`   - ${member.first_name} ${member.last_name} (${member.status}) ${risk}`);
      });
    } else {
      console.log('❌ Aucun membre de test trouvé');
    }
    
    console.log('\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS !');
    console.log('\n🚀 Prochaines étapes:');
    console.log('1. npm run dev (ou npx next dev)');
    console.log('2. Ouvrir http://localhost:3000');
    console.log('3. Créer un compte avec: brice@jarvis-group.net');
    console.log('4. Accéder au dashboard et voir vos données de test !');
    
  } catch (err) {
    console.error('❌ Erreur de test:', err.message);
  }
}

testDatabaseConfiguration();
