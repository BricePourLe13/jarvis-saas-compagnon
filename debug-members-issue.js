// Debug pourquoi les membres ne s'affichent pas
const url = 'https://vurnokaxnvittopqteno.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

async function debugMembers() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }

  console.log('🔍 DIAGNOSTIC PROBLÈME MEMBRES...\n')

  // 1. Vérifier les gyms et leurs managers
  console.log('🏠 GYMS ET MANAGERS:')
  const gymsResp = await fetch(`${url}/rest/v1/gyms?select=id,name,manager_id,slug&limit=10`, { headers })
  const gyms = await gymsResp.json()
  gyms.forEach(g => {
    console.log(`   - ${g.name} (ID: ${g.id.substring(0,8)}..., manager: ${g.manager_id || 'NULL'})`)
  })

  // 2. Vérifier les membres
  console.log('\n👥 MEMBRES PAR GYM:')
  for (const gym of gyms.slice(0, 3)) {
    const membersResp = await fetch(`${url}/rest/v1/gym_members?select=id,first_name,last_name,badge_id,is_active&gym_id=eq.${gym.id}&limit=5`, { headers })
    const members = await membersResp.json()
    console.log(`   ${gym.name}: ${members.length} membres`)
    members.forEach(m => console.log(`     - ${m.first_name} ${m.last_name} (${m.badge_id}, actif: ${m.is_active})`))
  }

  // 3. Vérifier les utilisateurs avec role manager
  console.log('\n👨‍💼 UTILISATEURS MANAGERS:')
  const managersResp = await fetch(`${url}/rest/v1/users?select=id,email,role&role=eq.manager`, { headers })
  const managers = await managersResp.json()
  console.log(`   Trouvés: ${managers.length} managers`)
  managers.forEach(m => console.log(`     - ${m.email} (ID: ${m.id.substring(0,8)}...)`))

  // 4. Tester la requête de l'API membres
  console.log('\n🔍 TEST REQUÊTE API MEMBRES:')
  
  // Simuler la requête qui échoue
  const testQuery = `
    gym_members?select=id,badge_id,first_name,last_name,email,membership_type,is_active,total_visits,last_visit,engagement_level,jarvis_personalization_score,created_at,gym_id,gyms(id,name,manager_id)
    &is_active=eq.true
    &order=last_visit.desc
    &limit=20
  `.replace(/\s+/g, '')
  
  const testResp = await fetch(`${url}/rest/v1/${testQuery}`, { headers })
  console.log(`   Status: ${testResp.status}`)
  
  if (testResp.ok) {
    const testData = await testResp.json()
    console.log(`   Résultats: ${testData.length} membres trouvés`)
    if (testData[0]) {
      console.log(`   Premier membre: ${testData[0].first_name} ${testData[0].last_name}`)
      console.log(`   Gym associée: ${testData[0].gyms?.name || 'NULL'}`)
    }
  } else {
    const error = await testResp.text()
    console.log(`   Erreur: ${error}`)
  }

  // 5. Vérifier les conversations récentes
  console.log('\n💬 CONVERSATIONS RÉCENTES PAR MEMBRE:')
  const convResp = await fetch(`${url}/rest/v1/jarvis_conversation_logs?select=member_id,session_id,speaker,message_text,timestamp&order=timestamp.desc&limit=10`, { headers })
  if (convResp.ok) {
    const conversations = await convResp.json()
    const memberStats = {}
    conversations.forEach(c => {
      if (!memberStats[c.member_id]) {
        memberStats[c.member_id] = { total: 0, lastConv: c.timestamp }
      }
      memberStats[c.member_id].total++
    })
    
    console.log(`   Conversations récentes: ${conversations.length}`)
    Object.entries(memberStats).forEach(([memberId, stats]) => {
      console.log(`     Membre ${memberId.substring(0,8)}...: ${stats.total} conversations`)
    })
  }
}

debugMembers().catch(console.error)
