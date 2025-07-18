const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlktijcxafzxctdlncj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybGt0aWpjeGFmenhjdGRsbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTA5NTksImV4cCI6MjA2ODMyNjk1OX0.eDdkCOFdVjqkoap1PUtWpSK4AnqNBvcRi5OHbxOazzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test 1: Vérifier l'accès aux tables
    console.log('📊 Test d\'accès aux tables...');
    const { data: franchises, error: tableError } = await supabase
      .from('franchises')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Erreur accès tables:', tableError.message);
    } else {
      console.log('✅ Accès aux tables OK');
    }

    // Test 2: Créer un utilisateur admin
    console.log('👤 Tentative de création d\'utilisateur admin...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'brice@jarvis-group.net',
      password: 'jarvis123!'
    });
    
    if (signUpError) {
      console.log('❌ Erreur signup:', signUpError.message);
    } else {
      console.log('✅ Utilisateur créé ou existe déjà');
    }

    // Test 3: Tentative de connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'brice@jarvis-group.net',
      password: 'jarvis123!'
    });
    
    if (error) {
      console.log('❌ Erreur auth:', error.message);
      return;
    }
    
    console.log('✅ Authentification réussie!');
    console.log('👤 User:', data.user?.email);
    console.log('🔑 Session:', !!data.session);
    
  } catch (err) {
    console.log('💥 Erreur:', err.message);
  }
}

testAuth();
