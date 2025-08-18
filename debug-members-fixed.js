// Debug pourquoi les membres ne s'affichent pas - Version corrigée
const url = 'https://vurnokaxnvittopqteno.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

async function debugMembers() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }

  console.log('🔍 DIAGNOSTIC PROBLÈME MEMBRES...\n')

  try {
    // 1. Vérifier les gyms et leurs managers
    console.log('🏠 GYMS ET MANAGERS:')
    const gymsResp = await fetch(`${url}/rest/v1/gyms?select=id,name,manager_id,slug&limit=10`, { headers })
    const gymsText = await gymsResp.text()
    console.log('Response gyms:', gymsText.substring(0, 200))
    
    const gyms = JSON.parse(gymsText)
    if (Array.isArray(gyms)) {
      gyms.forEach(g => {
        console.log(`   - ${g.name} (ID: ${g.id.substring(0,8)}..., manager: ${g.manager_id || 'NULL'})`)
      })
    } else {
      console.log('❌ Gyms response is not an array:', typeof gyms)
      return
    }

    // 2. Vérifier les membres totaux
    console.log('\n👥 MEMBRES TOTAUX:')
    const membersResp = await fetch(`${url}/rest/v1/gym_members?select=id,first_name,last_name,badge_id,is_active,gym_id&is_active=eq.true&limit=10`, { headers })
    const members = await membersResp.json()
    console.log(`   Total membres actifs: ${members.length}`)
    members.forEach(m => {
      console.log(`     - ${m.first_name} ${m.last_name} (${m.badge_id}, gym: ${m.gym_id.substring(0,8)}...)`)
    })

    // 3. Vérifier les utilisateurs avec role manager
    console.log('\n👨‍💼 UTILISATEURS AVEC DIFFÉRENTS RÔLES:')
    const allUsersResp = await fetch(`${url}/rest/v1/users?select=id,email,role&limit=10`, { headers })
    const allUsers = await allUsersResp.json()
    const roleCount = {}
    allUsers.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1
      console.log(`     - ${u.email} (${u.role})`)
    })
    console.log('\n   Répartition par rôle:')
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`     ${role}: ${count} utilisateurs`)
    })

    // 4. Tester la requête exacte de l'API
    console.log('\n🔍 TEST REQUÊTE API MEMBRES (celle qui échoue):')
    
    // Query avec join comme dans l'API
    const apiQuery = `gym_members?select=id,badge_id,first_name,last_name,email,membership_type,is_active,total_visits,last_visit,engagement_level,jarvis_personalization_score,created_at,gym_id,gyms(id,name,manager_id)&is_active=eq.true&order=last_visit.desc.nullslast&limit=20`
    
    console.log('   Query URL:', apiQuery)
    const testResp = await fetch(`${url}/rest/v1/${apiQuery}`, { headers })
    console.log(`   Status: ${testResp.status}`)
    
    if (testResp.ok) {
      const testData = await testResp.json()
      console.log(`   ✅ Résultats: ${testData.length} membres trouvés`)
      if (testData[0]) {
        console.log(`   Premier membre: ${testData[0].first_name} ${testData[0].last_name}`)
        console.log(`   Gym associée:`, testData[0].gyms)
      }
    } else {
      const error = await testResp.text()
      console.log(`   ❌ Erreur: ${error}`)
    }

    // 5. Vérifier les conversations
    console.log('\n💬 CONVERSATIONS RÉCENTES:')
    const convResp = await fetch(`${url}/rest/v1/jarvis_conversation_logs?select=member_id,session_id,speaker,timestamp&order=timestamp.desc&limit=5`, { headers })
    if (convResp.ok) {
      const conversations = await convResp.json()
      console.log(`   Conversations récentes: ${conversations.length}`)
      conversations.forEach(c => {
        console.log(`     - ${c.speaker}: Membre ${c.member_id.substring(0,8)}... (${c.timestamp})`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

debugMembers().catch(console.error)
