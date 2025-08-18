const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://vurnokaxnvittopqteno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'
)

async function analyzeDatabase() {
  console.log('🔍 ANALYSE DE LA BASE DE DONNÉES...\n')

  // 1. Tables existantes
  const { data: tables } = await supabase
    .rpc('get_schema_tables')
    .catch(() => null)

  if (!tables) {
    // Fallback: lister via information_schema
    const { data: tablesInfo } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .catch(() => null)
    
    if (tablesInfo) {
      console.log('📋 TABLES EXISTANTES:')
      tablesInfo.forEach(t => console.log(`  - ${t.table_name}`))
    }
  }

  // 2. Structure des tables principales
  const tablesToCheck = ['users', 'gyms', 'gym_members', 'jarvis_conversation_logs', 'franchises']
  
  for (const table of tablesToCheck) {
    console.log(`\n🔍 STRUCTURE DE ${table.toUpperCase()}:`)
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.log(`❌ Table ${table}: ${error.message}`)
    } else if (data) {
      console.log('✅ Colonnes:', Object.keys(data).join(', '))
    }
  }

  // 3. Compter les données
  console.log('\n📊 DONNÉES EXISTANTES:')
  
  for (const table of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`  ${table}: ${count} enregistrements`)
    }
  }

  // 4. Vérifier les utilisateurs
  console.log('\n👥 UTILISATEURS:')
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(5)
  
  if (users) {
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`))
  }

  // 5. Vérifier les gyms
  console.log('\n🏠 GYMS:')
  const { data: gyms } = await supabase
    .from('gyms')
    .select('id, name, manager_id, slug')
    .limit(5)
  
  if (gyms) {
    gyms.forEach(g => console.log(`  - ${g.name} (manager: ${g.manager_id || 'NULL'})`))
  }
}

analyzeDatabase().catch(console.error)
