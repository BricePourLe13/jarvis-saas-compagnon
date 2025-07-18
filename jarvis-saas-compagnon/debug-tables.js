const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlktijcxafzxctdlncj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybGt0aWpjeGFmenhjdGRsbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTA5NTksImV4cCI6MjA2ODMyNjk1OX0.eDdkCOFdVjqkoap1PUtWpSK4AnqNBvcRi5OHbxOazzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('🔍 Test des tables...');
  
  try {
    // Test si les tables existent
    const { data: franchises, error: franchiseError } = await supabase
      .from('franchises')
      .select('count')
      .limit(1);
      
    if (franchiseError) {
      console.log('❌ Erreur franchises:', franchiseError.message);
    } else {
      console.log('✅ Table franchises existe');
    }
    
    // Test users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (userError) {
      console.log('❌ Erreur users:', userError.message);
    } else {
      console.log('✅ Table users existe');
    }
    
  } catch (err) {
    console.log('💥 Erreur:', err.message);
  }
}

testTables();
