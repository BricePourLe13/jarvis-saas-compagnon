#!/usr/bin/env node

/**
 * 🏷️ SCRIPT D'INSERTION MEMBRES DEMO VIA SUPABASE API
 * Insère les membres de test pour les badges RFID du simulateur
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase avec service_role - PRODUCTION
const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

console.log('🚀 [PRODUCTION] Insertion membres demo dans Supabase PRODUCTION')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Données des membres de démo
const demoMembers = [
  {
    id: '3663c1b6-cc68-47e3-8cfe-698422cd9331',
    gym_id: '42f6adf0-f222-4018-bb19-4f60e2a351f4', // gym-yatblc8h
    badge_id: 'BADGE_001',
    first_name: 'Pierre',
    last_name: 'Martin',
    email: 'pierre.martin@email.com',
    phone: '+33 6 12 34 56 78',
    membership_type: 'Premium',
    member_since: '2023-06-15',
    member_preferences: {
      language: 'fr',
      goals: ['Perte de poids', 'Renforcement musculaire'],
      dietary_restrictions: [],
      favorite_activities: ['Cardio', 'Musculation'],
      notification_preferences: {
        email: true,
        sms: true
      }
    },
    total_visits: 156,
    last_visit: '2024-01-20T09:30:00Z',
    is_active: true,
    can_use_jarvis: true,
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2024-01-20T09:30:00Z'
  },
  {
    id: '02cdb76c-a920-4d26-a58b-ffa177fb0093',
    gym_id: '42f6adf0-f222-4018-bb19-4f60e2a351f4',
    badge_id: 'BADGE_002',
    first_name: 'Sophie',
    last_name: 'Dubois',
    email: 'sophie.dubois@email.com',
    phone: '+33 6 98 76 54 32',
    membership_type: 'Standard',
    member_since: '2023-11-02',
    member_preferences: {
      language: 'fr',
      goals: ['Flexibilité', 'Bien-être'],
      dietary_restrictions: [],
      favorite_activities: ['Yoga', 'Pilates'],
      notification_preferences: {
        email: true,
        sms: false
      }
    },
    total_visits: 87,
    last_visit: '2024-01-19T18:45:00Z',
    is_active: true,
    can_use_jarvis: true,
    created_at: '2023-11-02T00:00:00Z',
    updated_at: '2024-01-19T18:45:00Z'
  },
  {
    id: '8b28c7c3-45be-4c2d-baf4-d642ee9d4996',
    gym_id: '42f6adf0-f222-4018-bb19-4f60e2a351f4',
    badge_id: 'BADGE_003',
    first_name: 'Marc',
    last_name: 'Leroy',
    email: 'marc.leroy@email.com',
    phone: '+33 6 55 44 33 22',
    membership_type: 'Elite',
    member_since: '2022-03-20',
    member_preferences: {
      language: 'fr',
      goals: ['Performance', 'Compétition'],
      dietary_restrictions: ['Végétarien'],
      favorite_activities: ['CrossFit', 'Running'],
      notification_preferences: {
        email: true,
        sms: true
      }
    },
    total_visits: 298,
    last_visit: '2024-01-21T07:15:00Z',
    is_active: true,
    can_use_jarvis: true,
    created_at: '2022-03-20T00:00:00Z',
    updated_at: '2024-01-21T07:15:00Z'
  }
]

async function insertDemoMembers() {
  console.log('🏷️ [DEMO MEMBERS] Démarrage insertion...')
  
  try {
    // Vérifier la connexion
    const { data: testData, error: testError } = await supabase
      .from('gym_members')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ [DEMO MEMBERS] Erreur connexion Supabase:', testError)
      return
    }
    
    console.log('✅ [DEMO MEMBERS] Connexion Supabase OK')
    
    // Vérifier quels membres existent déjà
    const { data: existingMembers } = await supabase
      .from('gym_members')
      .select('badge_id')
      .in('badge_id', ['BADGE_001', 'BADGE_002', 'BADGE_003'])
    
    const existingBadges = new Set((existingMembers || []).map(m => m.badge_id))
    console.log('ℹ️ [DEMO MEMBERS] Badges existants:', Array.from(existingBadges))
    
    // Insérer les nouveaux membres
    let insertedCount = 0
    let skippedCount = 0
    
    for (const member of demoMembers) {
      if (existingBadges.has(member.badge_id)) {
        console.log(`ℹ️ [DEMO MEMBERS] ${member.first_name} ${member.last_name} (${member.badge_id}) existe déjà`)
        skippedCount++
        continue
      }
      
      const { error: insertError } = await supabase
        .from('gym_members')
        .insert([member])
      
      if (insertError) {
        console.error(`❌ [DEMO MEMBERS] Erreur insertion ${member.first_name}:`, insertError)
      } else {
        console.log(`✅ [DEMO MEMBERS] ${member.first_name} ${member.last_name} (${member.badge_id}) ajouté avec succès`)
        insertedCount++
      }
    }
    
    // Vérification finale
    const { data: finalMembers, error: finalError } = await supabase
      .from('gym_members')
      .select('badge_id, first_name, last_name, membership_type, total_visits, is_active')
      .in('badge_id', ['BADGE_001', 'BADGE_002', 'BADGE_003'])
      .order('badge_id')
    
    if (finalError) {
      console.error('❌ [DEMO MEMBERS] Erreur vérification finale:', finalError)
    } else {
      console.log('\n🎯 [DEMO MEMBERS] RÉSULTAT FINAL:')
      console.table(finalMembers)
      console.log(`\n📊 [DEMO MEMBERS] Résumé: ${insertedCount} ajoutés, ${skippedCount} existants`)
      
      if (insertedCount > 0) {
        console.log('\n🚀 [DEMO MEMBERS] ✅ SUCCESS ! Tu peux maintenant tester avec les vrais badges !')
        console.log('🎯 [DEMO MEMBERS] Plus de "404 Not Found" - Mode Production activé !')
      }
    }
    
  } catch (error) {
    console.error('❌ [DEMO MEMBERS] Erreur générale:', error)
  }
}

// Exécuter le script
insertDemoMembers()
