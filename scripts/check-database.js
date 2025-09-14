/**
 * 🔍 SCRIPT DE VÉRIFICATION BASE DE DONNÉES
 * Vérifie la structure et les données pour le dashboard
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données...\n')

  try {
    // 1. Vérifier les franchises
    const { data: franchises, error: franchisesError } = await supabase
      .from('franchises')
      .select('*')
      .eq('is_active', true)

    if (franchisesError) {
      console.error('❌ Erreur franchises:', franchisesError.message)
    } else {
      console.log(`✅ Franchises: ${franchises.length} trouvées`)
      franchises.forEach(f => console.log(`   - ${f.name} (${f.city})`))
    }

    // 2. Vérifier les gyms
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('*')

    if (gymsError) {
      console.error('❌ Erreur gyms:', gymsError.message)
    } else {
      console.log(`\n✅ Gyms: ${gyms.length} trouvées`)
      gyms.forEach(g => console.log(`   - ${g.name} (${g.city})`))
    }

    // 3. Vérifier les membres
    const { data: members, error: membersError } = await supabase
      .from('gym_members')
      .select('*')
      .eq('is_active', true)

    if (membersError) {
      console.error('❌ Erreur membres:', membersError.message)
    } else {
      console.log(`\n✅ Membres: ${members.length} trouvés`)
      members.slice(0, 5).forEach(m => console.log(`   - ${m.first_name} ${m.last_name} (${m.badge_id})`))
      if (members.length > 5) console.log(`   ... et ${members.length - 5} autres`)
    }

    // 4. Vérifier les sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('openai_realtime_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (sessionsError) {
      console.error('❌ Erreur sessions:', sessionsError.message)
    } else {
      console.log(`\n✅ Sessions: ${sessions.length} récentes trouvées`)
      sessions.forEach(s => console.log(`   - ${s.session_id} (${s.status})`))
    }

    // 5. Vérifier les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)

    if (usersError) {
      console.error('❌ Erreur users:', usersError.message)
    } else {
      console.log(`\n✅ Utilisateurs: ${users.length} trouvés`)
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }

    console.log('\n🎯 Vérification terminée !')

  } catch (error) {
    console.error('💥 Erreur générale:', error.message)
  }
}

checkDatabase()
