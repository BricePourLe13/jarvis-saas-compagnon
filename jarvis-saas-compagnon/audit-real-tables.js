#!/usr/bin/env node

/**
 * 🔍 AUDIT DÉTAILLÉ DES TABLES RÉELLES
 * Maintenant qu'on sait qu'elles existent !
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vurnokaxnvittopqteno.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk0NiwiZXhwIjoyMDY4NDEyOTQ2fQ.08kr8hBR8-zuammA549N2IdYcZ0mDaVu_4e5_iy6hR8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function auditRealTables() {
  console.log('🔍 [AUDIT RÉEL] Analyse détaillée des tables existantes...\n')
  
  try {
    // Liste des tables à auditer
    const tablesToAudit = [
      'franchises',
      'gyms', 
      'gym_members',
      'profiles',
      'jarvis_conversation_logs',
      'openai_realtime_sessions',
      'openai_realtime_audio_events',
      'jarvis_session_costs',
      'onboarding_progress',
      'manager_actions',
      'manager_notifications',
      'member_knowledge_base',
      'member_session_analytics'
    ]
    
    const auditResults = {}
    
    console.log('📊 AUDIT COMPLET DES TABLES')
    console.log('═══════════════════════════')
    
    for (const tableName of tablesToAudit) {
      try {
        // 1. Compter les rows
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.log(`❌ ${tableName.padEnd(25)} | ERREUR: ${countError.message}`)
          auditResults[tableName] = { exists: false, error: countError.message }
          continue
        }
        
        // 2. Échantillon de données
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(2)
        
        const status = count > 0 ? '✅' : '⚠️'
        console.log(`${status} ${tableName.padEnd(25)} | ${count.toString().padStart(4)} rows`)
        
        auditResults[tableName] = {
          exists: true,
          count: count || 0,
          sample: sample || [],
          hasData: count > 0
        }
        
        // 3. Afficher structure pour tables importantes
        if (['franchises', 'gyms', 'gym_members'].includes(tableName) && count > 0) {
          console.log(`   📋 Colonnes détectées: ${Object.keys(sample[0] || {}).join(', ')}`)
          if (sample[0]) {
            const preview = JSON.stringify(sample[0], null, 2).replace(/\n/g, ' ').substring(0, 150)
            console.log(`   💾 Exemple: ${preview}...`)
          }
        }
        
      } catch (err) {
        console.log(`❌ ${tableName.padEnd(25)} | EXCEPTION: ${err.message}`)
        auditResults[tableName] = { exists: false, error: err.message }
      }
    }
    
    // 4. ANALYSE DES RELATIONS
    console.log('\n🔗 ANALYSE DES RELATIONS')
    console.log('═══════════════════════')
    
    if (auditResults.franchises?.hasData && auditResults.gyms?.hasData) {
      const { data: gymsWithFranchise } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')
        .limit(3)
      
      console.log('🏢 Relations franchise → gyms:')
      gymsWithFranchise?.forEach(gym => {
        console.log(`   ${gym.name} → franchise: ${gym.franchise_id}`)
      })
    }
    
    if (auditResults.gym_members?.hasData && auditResults.gyms?.hasData) {
      const { data: membersWithGym } = await supabase
        .from('gym_members')
        .select('badge_id, first_name, last_name, gym_id')
        .limit(3)
      
      console.log('\n👥 Relations gym → members:')
      membersWithGym?.forEach(member => {
        console.log(`   ${member.badge_id} (${member.first_name}) → gym: ${member.gym_id}`)
      })
    }
    
    // 5. VÉRIFICATION CONVERSATIONS
    console.log('\n💬 VÉRIFICATION CONVERSATIONS & SESSIONS')
    console.log('═══════════════════════════════════════')
    
    if (auditResults.jarvis_conversation_logs?.hasData) {
      const { data: recentConversations } = await supabase
        .from('jarvis_conversation_logs')
        .select('session_id, speaker, message_text, timestamp')
        .order('timestamp', { ascending: false })
        .limit(3)
      
      console.log('💬 Conversations récentes:')
      recentConversations?.forEach(conv => {
        const preview = conv.message_text.substring(0, 50)
        console.log(`   ${conv.speaker}: "${preview}..." (${conv.session_id.slice(-6)})`)
      })
    }
    
    if (auditResults.openai_realtime_sessions?.hasData) {
      const { data: recentSessions } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id, gym_id, member_id, session_started_at, session_ended_at')
        .order('session_started_at', { ascending: false })
        .limit(3)
      
      console.log('\n🎙️ Sessions OpenAI récentes:')
      recentSessions?.forEach(session => {
        const duration = session.session_ended_at ? 
          Math.round((new Date(session.session_ended_at) - new Date(session.session_started_at)) / 1000) : 
          'En cours'
        console.log(`   ${session.session_id.slice(-6)} → ${duration}s (gym: ${session.gym_id?.slice(-6)})`)
      })
    }
    
    // 6. RECOMMANDATIONS FINALES
    console.log('\n💡 RECOMMANDATIONS BASÉES SUR L\'AUDIT')
    console.log('════════════════════════════════════')
    
    const existingTables = Object.entries(auditResults).filter(([_, data]) => data.exists).map(([name]) => name)
    const tablesWithData = Object.entries(auditResults).filter(([_, data]) => data.hasData).map(([name]) => name)
    const emptyTables = Object.entries(auditResults).filter(([_, data]) => data.exists && !data.hasData).map(([name]) => name)
    
    console.log(`✅ Tables existantes: ${existingTables.length}`)
    console.log(`📊 Tables avec données: ${tablesWithData.length}`)
    console.log(`⚠️ Tables vides: ${emptyTables.length}`)
    
    if (tablesWithData.includes('franchises') && tablesWithData.includes('gyms') && tablesWithData.includes('gym_members')) {
      console.log('\n🎯 VERDICT: SCHEMA RÉCUPÉRABLE !')
      console.log('✅ Core business tables OK')
      console.log('✅ Relations de base présentes')
      console.log('✅ Données test disponibles')
      console.log('\n🔧 ACTIONS RECOMMANDÉES:')
      console.log('1. Nettoyer tables vides inutiles')
      console.log('2. Optimiser queries existantes')
      console.log('3. Ajouter colonnes manquantes si besoin')
      console.log('4. Tester flows end-to-end')
    } else {
      console.log('\n🚨 VERDICT: REFONTE NÉCESSAIRE')
      console.log('❌ Tables core business manquantes ou vides')
    }
    
    if (emptyTables.length > 0) {
      console.log(`\n🗑️ Tables vides à considérer pour suppression: ${emptyTables.join(', ')}`)
    }
    
  } catch (error) {
    console.error('❌ [AUDIT RÉEL] Erreur:', error)
  }
}

auditRealTables()
