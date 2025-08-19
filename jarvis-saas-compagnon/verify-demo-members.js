#!/usr/bin/env node

/**
 * 🔍 VERIFIER MEMBRES DEMO  
 * S'assurer que BADGE_002 est bien en base
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function verifyDemoMembers() {
  console.log('🔍 [VERIFY] Vérification des membres demo...\n')
  
  try {
    // 1. Lister tous les membres
    const { data: allMembers, error: membersError } = await supabase
      .from('gym_members')
      .select('badge_id, first_name, last_name, gym_id')
      .order('badge_id')
    
    if (membersError) {
      console.error('❌ Erreur récupération membres:', membersError)
      return
    }
    
    console.log('👥 TOUS LES MEMBRES:')
    allMembers?.forEach(member => {
      console.log(`   ${member.badge_id} -> ${member.first_name} ${member.last_name} (gym: ${member.gym_id.slice(-6)})`)
    })
    
    // 2. Vérifier gym avec slug gym-yatblc8h
    console.log('\n🏢 VERIFICATION GYMS:')
    
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
      .order('name')
    
    if (gymsError) {
      console.error('❌ Erreur récupération gyms:', gymsError)
      return
    }
    
    gyms?.forEach(gym => {
      const kioskSlug = gym.kiosk_config?.kiosk_url_slug || 'N/A'
      console.log(`   ${gym.name} -> ${kioskSlug} (id: ${gym.id.slice(-6)})`)
    })
    
    // 3. Test spécifique BADGE_002 + gym-yatblc8h
    console.log('\n🎯 TEST SPÉCIFIQUE: BADGE_002 + gym-yatblc8h')
    
    const targetGymSlug = 'gym-yatblc8h'
    const targetBadge = 'BADGE_002'
    
    // Trouver la gym
    const { data: targetGym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
      .eq('kiosk_config->>kiosk_url_slug', targetGymSlug)
      .single()
    
    if (gymError || !targetGym) {
      console.log(`❌ Gym avec slug ${targetGymSlug} non trouvée:`, gymError?.message)
      
      // Créer la gym manquante si nécessaire
      console.log('🔧 Tentative création gym manquante...')
      const { data: newGym, error: createError } = await supabase
        .from('gyms')
        .insert({
          franchise_id: '3a56d2e7-7c0d-4061-84b6-f6393ce3edea', // Franchise Orange Bleue existante
          name: 'AREA Kiosk Test',
          address: '123 Rue Test',
          city: 'Test City', 
          postal_code: '12345',
          kiosk_config: {
            kiosk_url_slug: targetGymSlug,
            provisioning_code: 'TEST-2025',
            hardware_version: '1.0',
            last_sync: null
          }
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Erreur création gym:', createError.message)
        return
      } else {
        console.log('✅ Gym créée:', newGym.name, newGym.id.slice(-6))
        targetGym.id = newGym.id
        targetGym.name = newGym.name
      }
    } else {
      console.log(`✅ Gym trouvée: ${targetGym.name} (${targetGym.id.slice(-6)})`)
    }
    
    // Chercher le membre dans cette gym
    const { data: targetMember, error: memberError } = await supabase
      .from('gym_members')
      .select('*')
      .eq('badge_id', targetBadge)
      .eq('gym_id', targetGym.id)
      .single()
    
    if (memberError || !targetMember) {
      console.log(`❌ Membre ${targetBadge} non trouvé dans gym ${targetGym.name}:`, memberError?.message)
      
      // Créer le membre
      console.log('🔧 Création membre BADGE_002...')
      const { data: newMember, error: createMemberError } = await supabase
        .from('gym_members')
        .insert({
          gym_id: targetGym.id,
          badge_id: targetBadge,
          first_name: 'Sophie',
          last_name: 'Dubois',
          email: 'sophie@example.com',
          membership_type: 'premium',
          member_preferences: {
            language: 'fr',
            goals: ['perte_poids', 'tonification'],
            favorite_activities: ['cardio', 'yoga'],
            dietary_restrictions: [],
            notification_preferences: {
              email: true,
              sms: false
            }
          },
          fitness_level: 'intermediate',
          fitness_goals: ['Perdre 5kg', 'Améliorer endurance'],
          workout_frequency_per_week: 3,
          preferred_workout_duration: 60
        })
        .select()
        .single()
      
      if (createMemberError) {
        console.log('❌ Erreur création membre:', createMemberError.message)
      } else {
        console.log('✅ Membre créé:', newMember.first_name, newMember.last_name, newMember.badge_id)
      }
    } else {
      console.log(`✅ Membre trouvé: ${targetMember.first_name} ${targetMember.last_name}`)
    }
    
    // 4. Test final de l'API
    console.log('\n🧪 TEST API FINALE:')
    console.log(`GET /api/kiosk/${targetGymSlug}/members/${targetBadge}`)
    
    try {
      const response = await fetch(`${SUPABASE_URL.replace('supabase.co', 'jarvis-group.net')}/api/kiosk/${targetGymSlug}/members/${targetBadge}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API répond OK:', data.found ? 'Membre trouvé' : 'Membre non trouvé')
      } else {
        console.log('❌ API status:', response.status)
      }
    } catch (err) {
      console.log('⚠️ Test API ignoré (local):', err.message.substring(0, 50))
    }
    
  } catch (error) {
    console.error('❌ [VERIFY] Erreur:', error)
  }
}

verifyDemoMembers()
