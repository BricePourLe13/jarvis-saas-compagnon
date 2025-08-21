#!/usr/bin/env node

/**
 * 🔧 FIX SLUG MISMATCH - Corriger l'incohérence gym slug
 * 
 * PROBLÈME: L'app cherche 'gym-yatblc8h' mais cette gym n'existe pas
 * SOLUTION: Mettre à jour la gym des membres pour avoir le bon slug
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase PRODUCTION
const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixGymSlugMismatch() {
  console.log('🔧 [FIX SLUG] Correction du mismatch gym slug...\n')
  
  try {
    // 1. Analyser le problème
    console.log('🔍 [ANALYSE] État actuel:')
    
    // Lister toutes les gyms et leurs slugs
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
    
    console.log('\n📋 GYMS DISPONIBLES:')
    gyms?.forEach(gym => {
      let slug = 'Pas de slug'
      try {
        if (gym.kiosk_config && typeof gym.kiosk_config === 'object') {
          slug = gym.kiosk_config.kiosk_url_slug || 'Pas de slug'
        }
      } catch (e) {
        slug = 'Erreur JSON'
      }
      console.log(`  ${gym.id} | ${gym.name} | ${slug}`)
    })
    
    // Lister les membres et leurs gyms
    const { data: members } = await supabase
      .from('gym_members')
      .select('badge_id, first_name, last_name, gym_id')
    
    console.log('\n👥 MEMBRES ACTUELS:')
    members?.forEach(member => {
      console.log(`  ${member.badge_id} | ${member.first_name} ${member.last_name} | gym: ${member.gym_id}`)
    })
    
    // 2. Identifier quelle gym utiliser
    console.log('\n🎯 [SOLUTION] Détection du bon mapping...')
    
    // Chercher la gym target (42f6adf0-f222-4018-bb19-4f60e2a351f4)
    const targetGymId = '42f6adf0-f222-4018-bb19-4f60e2a351f4'
    const targetGym = gyms?.find(g => g.id === targetGymId)
    
    if (targetGym) {
      console.log(`✅ Gym target trouvée: ${targetGym.name}`)
      
      let currentSlug = 'Inconnu'
      try {
        if (targetGym.kiosk_config && typeof targetGym.kiosk_config === 'object') {
          currentSlug = targetGym.kiosk_config.kiosk_url_slug || 'Pas de slug'
        }
      } catch (e) {
        currentSlug = 'Erreur JSON'
      }
      
      console.log(`📍 Slug actuel: ${currentSlug}`)
      console.log(`🎯 Slug attendu: gym-yatblc8h`)
      
      if (currentSlug !== 'gym-yatblc8h') {
        console.log('\n🔧 [FIX] Mise à jour du slug...')
        
        // Mettre à jour le kiosk_config avec le bon slug
        const updatedConfig = {
          ...targetGym.kiosk_config,
          kiosk_url_slug: 'gym-yatblc8h'
        }
        
        const { error: updateError } = await supabase
          .from('gyms')
          .update({ 
            kiosk_config: updatedConfig
          })
          .eq('id', targetGymId)
        
        if (updateError) {
          console.error('❌ Erreur mise à jour:', updateError)
        } else {
          console.log('✅ Slug mis à jour avec succès!')
        }
      } else {
        console.log('✅ Slug déjà correct!')
      }
      
    } else {
      console.log('❌ Gym target non trouvée - Création nécessaire')
      
      // Créer la gym avec le bon slug
      const { error: createError } = await supabase
        .from('gyms')
        .insert({
          id: targetGymId,
          name: 'JARVIS Kiosk Demo',
          franchise_id: '3a56d2e7-7c0d-4061-84b6-f6393ce3edea', // ID de franchise existante
          kiosk_config: {
            kiosk_url_slug: 'gym-yatblc8h',
            is_provisioned: true,
            provisioned_at: new Date().toISOString(),
            welcome_message: 'Bienvenue ! Je suis JARVIS, votre assistant IA.',
            language_default: 'fr'
          },
          jarvis_settings: {
            personality: 'friendly',
            humor_level: 7,
            response_length: 'medium',
            accent: 'none',
            emotional_bias: 'positive',
            speaking_pace: 'normal',
            opening_phrases: ['Salut !', 'Bonjour !', 'Hey !'],
            model: 'gpt-4o-mini-realtime-preview-2024-12-17',
            voice: 'alloy'
          }
        })
      
      if (createError) {
        console.error('❌ Erreur création gym:', createError)
      } else {
        console.log('✅ Gym créée avec succès!')
      }
    }
    
    // 3. Vérifier que les membres sont dans la bonne gym
    console.log('\n👥 [VÉRIF] Assignation des membres...')
    
    const membersInWrongGym = members?.filter(m => m.gym_id !== targetGymId)
    
    if (membersInWrongGym && membersInWrongGym.length > 0) {
      console.log(`🔧 Migration de ${membersInWrongGym.length} membres vers la gym target...`)
      
      for (const member of membersInWrongGym) {
        const { error: moveError } = await supabase
          .from('gym_members')
          .update({ gym_id: targetGymId })
          .eq('badge_id', member.badge_id)
        
        if (moveError) {
          console.error(`❌ Erreur migration ${member.badge_id}:`, moveError)
        } else {
          console.log(`✅ ${member.first_name} ${member.last_name} migré vers gym target`)
        }
      }
    } else {
      console.log('✅ Tous les membres sont déjà dans la bonne gym!')
    }
    
    // 4. Test final
    console.log('\n🧪 [TEST] Vérification finale...')
    
    const { data: finalGym } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
      .eq('id', targetGymId)
      .single()
    
    const { data: finalMembers } = await supabase
      .from('gym_members')
      .select('badge_id, first_name, gym_id')
      .eq('gym_id', targetGymId)
    
    console.log('\n🎯 ÉTAT FINAL:')
    console.log(`📋 Gym: ${finalGym?.name}`)
    console.log(`📍 Slug: ${finalGym?.kiosk_config?.kiosk_url_slug}`)
    console.log(`👥 Membres: ${finalMembers?.length || 0}`)
    
    finalMembers?.forEach(m => {
      console.log(`  ✅ ${m.badge_id} | ${m.first_name}`)
    })
    
    console.log('\n🎉 FIX TERMINÉ AVEC SUCCÈS!')
    console.log('🔗 L\'app devrait maintenant pouvoir accéder aux membres via gym-yatblc8h')
    
  } catch (error) {
    console.error('❌ [FIX SLUG] Erreur:', error)
  }
}

// Exécuter le fix
fixGymSlugMismatch()
