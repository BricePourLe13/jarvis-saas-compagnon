// Diagnostic final - sans colonnes problématiques
const url = 'https://vurnokaxnvittopqteno.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

async function finalDiagnosis() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }

  console.log('🎯 DIAGNOSTIC FINAL PROBLÈME MEMBRES...\n')

  try {
    // 1. Gyms sans slug
    console.log('🏠 GYMS EXISTANTES:')
    const gymsResp = await fetch(`${url}/rest/v1/gyms?select=id,name,manager_id&limit=10`, { headers })
    const gyms = await gymsResp.json()
    
    gyms.forEach(g => {
      console.log(`   - ${g.name} (manager_id: ${g.manager_id || 'NULL'})`)
    })

    // 2. Membres actifs
    console.log('\n👥 MEMBRES ACTIFS:')
    const membersResp = await fetch(`${url}/rest/v1/gym_members?select=id,first_name,last_name,badge_id,is_active&is_active=eq.true&limit=10`, { headers })
    const members = await membersResp.json()
    
    console.log(`   Total: ${members.length} membres actifs`)
    members.forEach(m => {
      console.log(`     - ${m.first_name} ${m.last_name} (${m.badge_id})`)
    })

    // 3. Utilisateurs et leurs rôles
    console.log('\n👨‍💼 UTILISATEURS:')
    const usersResp = await fetch(`${url}/rest/v1/users?select=id,email,role`, { headers })
    const users = await usersResp.json()
    
    users.forEach(u => {
      console.log(`     - ${u.email} (${u.role})`)
    })

    // 4. TEST de la requête qui pose problème dans l'API
    console.log('\n🔍 TEST REQUÊTE API MANAGER/MEMBERS:')
    
    // Requête simplifiée d'abord
    const simpleQuery = `gym_members?select=id,first_name,last_name,badge_id&is_active=eq.true&limit=5`
    const simpleResp = await fetch(`${url}/rest/v1/${simpleQuery}`, { headers })
    
    if (simpleResp.ok) {
      const simpleData = await simpleResp.json()
      console.log(`   ✅ Requête simple: ${simpleData.length} membres`)
    } else {
      console.log(`   ❌ Erreur requête simple: ${simpleResp.status}`)
    }

    // Requête avec join
    const joinQuery = `gym_members?select=id,first_name,last_name,gyms(id,name,manager_id)&is_active=eq.true&limit=5`
    const joinResp = await fetch(`${url}/rest/v1/${joinQuery}`, { headers })
    
    if (joinResp.ok) {
      const joinData = await joinResp.json()
      console.log(`   ✅ Requête avec join: ${joinData.length} membres`)
      if (joinData[0]) {
        console.log(`   Premier membre: ${joinData[0].first_name}`)
        console.log(`   Gym info:`, joinData[0].gyms)
      }
    } else {
      const error = await joinResp.text()
      console.log(`   ❌ Erreur join: ${error}`)
    }

    // 5. Vérifier qui a manager_id assigné
    console.log('\n🔍 MANAGERS ASSIGNÉS:')
    const gymsWithManagerResp = await fetch(`${url}/rest/v1/gyms?select=id,name,manager_id&manager_id=not.is.null`, { headers })
    const gymsWithManager = await gymsWithManagerResp.json()
    
    console.log(`   Gyms avec manager: ${gymsWithManager.length}`)
    gymsWithManager.forEach(g => {
      console.log(`     - ${g.name}: manager ${g.manager_id.substring(0,8)}...`)
    })

    // 6. Conversations par membre
    console.log('\n💬 CONVERSATIONS PAR MEMBRE:')
    const convQuery = `jarvis_conversation_logs?select=member_id&order=timestamp.desc&limit=20`
    const convResp = await fetch(`${url}/rest/v1/${convQuery}`, { headers })
    const conversations = await convResp.json()
    
    const memberConvCount = {}
    conversations.forEach(c => {
      memberConvCount[c.member_id] = (memberConvCount[c.member_id] || 0) + 1
    })
    
    Object.entries(memberConvCount).forEach(([memberId, count]) => {
      console.log(`     - Membre ${memberId.substring(0,8)}...: ${count} conversations`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

finalDiagnosis().catch(console.error)
