// 🔍 DIAGNOSTIC DIRECT - Via l'API REST Supabase
const https = require('https');

// D'après les logs: vurnokaxnvittopqteno.supabase.co
const supabaseUrl = 'https://vurnokaxnvittopqteno.supabase.co';

console.log('🔍 === DIAGNOSTIC DIRECT SUPABASE ===');
console.log('📡 URL:', supabaseUrl);

// Test 1: Vérification de base de l'API
function testSupabaseAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'vurnokaxnvittopqteno.supabase.co',
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': 'public_key_placeholder', // Sera remplacé par une vraie clé
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('📊 Headers:', res.headers);
        
        if (res.statusCode === 401) {
          console.log('✅ API accessible (401 = clé invalide, c\'est normal)');
        } else if (res.statusCode === 200) {
          console.log('✅ API complètement accessible');
        }
        
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erreur connexion:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test 2: Requête sur openai_realtime_sessions
function testTableAccess() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'vurnokaxnvittopqteno.supabase.co',
      port: 443,
      path: '/rest/v1/openai_realtime_sessions?select=*&limit=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📊 Test table openai_realtime_sessions:');
        console.log('Status:', res.statusCode);
        
        if (res.statusCode === 406) {
          console.log('🚨 TROUVÉ ! Erreur 406 - Problème RLS ou colonne');
          console.log('Réponse:', data);
        } else if (res.statusCode === 401) {
          console.log('🔒 Authentification requise');
        } else if (res.statusCode === 404) {
          console.log('❌ Table inexistante');
        } else {
          console.log('📋 Réponse:', data);
        }
        
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erreur:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function runDiagnostic() {
  try {
    console.log('🧪 Test 1: Connexion API de base...');
    await testSupabaseAPI();
    
    console.log('\n🧪 Test 2: Accès table openai_realtime_sessions...');
    await testTableAccess();
    
    console.log('\n🎯 === DIAGNOSTIC TERMINÉ ===');
    console.log('📋 Prochaines étapes:');
    console.log('1. Vérifier que la table openai_realtime_sessions existe');
    console.log('2. Corriger les policies RLS');
    console.log('3. Ajouter les colonnes manquantes');
    
  } catch (error) {
    console.log('💥 Erreur globale:', error.message);
  }
}

runDiagnostic();