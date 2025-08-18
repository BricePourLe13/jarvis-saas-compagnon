// Quick database check using fetch
const url = 'https://vurnokaxnvittopqteno.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

async function checkTables() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }

  // Check each table
  const tables = ['users', 'gyms', 'gym_members', 'jarvis_conversation_logs', 'franchises']
  
  console.log('🔍 VÉRIFICATION DES TABLES...\n')
  
  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${table}: existe (${data.length > 0 ? 'avec données' : 'vide'})`)
        if (data[0]) {
          console.log(`   Colonnes: ${Object.keys(data[0]).join(', ')}`)
        }
      } else {
        console.log(`❌ ${table}: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${table}: erreur - ${error.message}`)
    }
  }

  // Check specific data
  console.log('\n📊 DONNÉES SPÉCIFIQUES...\n')
  
  try {
    // Users count and roles
    const usersResp = await fetch(`${url}/rest/v1/users?select=id,email,role`, { headers })
    if (usersResp.ok) {
      const users = await usersResp.json()
      console.log(`👥 UTILISATEURS (${users.length}):`)
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }
  } catch (e) {
    console.log('❌ Erreur utilisateurs:', e.message)
  }

  try {
    // Gyms with manager info
    const gymsResp = await fetch(`${url}/rest/v1/gyms?select=id,name,manager_id,slug`, { headers })
    if (gymsResp.ok) {
      const gyms = await gymsResp.json()
      console.log(`\n🏠 GYMS (${gyms.length}):`)
      gyms.forEach(g => console.log(`   - ${g.name} (manager: ${g.manager_id || 'NULL'}, slug: ${g.slug})`))
    }
  } catch (e) {
    console.log('❌ Erreur gyms:', e.message)
  }

  // Check conversations if table exists
  try {
    const convResp = await fetch(`${url}/rest/v1/jarvis_conversation_logs?select=session_id,member_id,speaker&limit=5`, { headers })
    if (convResp.ok) {
      const convs = await convResp.json()
      console.log(`\n💬 CONVERSATIONS (${convs.length} récentes):`)
      convs.forEach(c => console.log(`   - Session: ${c.session_id}, Member: ${c.member_id}, Speaker: ${c.speaker}`))
    }
  } catch (e) {
    console.log('\n❌ Table jarvis_conversation_logs introuvable')
  }
}

checkTables().catch(console.error)
