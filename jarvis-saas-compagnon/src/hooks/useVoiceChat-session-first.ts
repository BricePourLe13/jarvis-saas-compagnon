/**
 * 🚀 useVoiceChat avec Pattern SESSION-FIRST
 * 
 * Version améliorée qui élimine les race conditions en créant
 * le record DB AVANT la session OpenAI
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { sessionFirstService, type SessionFirstData } from '@/lib/session-first-service'
import { openaiRealtimeInstrumentation } from '@/lib/openai-realtime-instrumentation'
import { trackSessionCost } from '@/lib/openai-cost-tracker'

// ... (garder tous les types et interfaces existants)

export function useVoiceChatSessionFirst(config: VoiceChatConfig) {
  // ... (garder tous les states et refs existants)
  
  // 🆕 Nouveau ref pour tracking session-first
  const preCreatedSessionRef = useRef<{ dbSessionId: string; openaiSessionId?: string } | null>(null)

  /**
   * 🚀 NOUVEAU: Créer session DB d'abord, puis OpenAI
   */
  const createSessionFirst = useCallback(async () => {
    try {
      console.log('🚀 [SESSION-FIRST] Démarrage création session...')
      
      // 1. Récupérer données membre et gym
      const memberData = await getMemberData()
      
      // 2. Récupérer infos gym (code existant)
      let gymData = null
      try {
        console.log('📊 [TRACKING] Récupération infos gym pour:', config.gymSlug)
        const gymResponse = await fetch(`/api/kiosk/${config.gymSlug}`)
        
        if (gymResponse.ok) {
          const gymInfo = await gymResponse.json()
          const extractedGymId = gymInfo.data?.id || gymInfo.gym?.id || gymInfo.kiosk?.id
          const extractedFranchiseId = gymInfo.data?.franchise_id || gymInfo.gym?.franchise_id
          
          gymData = {
            gymId: extractedGymId,
            franchiseId: extractedFranchiseId
          }
          console.log('📊 [SESSION-FIRST] Infos gym extraites:', gymData)
        }
      } catch (error) {
        console.error('📊 [SESSION-FIRST] Erreur récupération gym:', error)
      }

      if (!gymData?.gymId) {
        throw new Error('GymId requis pour créer session')
      }

      // 3. 🎯 CRÉER RECORD DB EN PREMIER
      const sessionFirstData: SessionFirstData = {
        sessionId: `jarvis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        gymId: gymData.gymId,
        gymSlug: config.gymSlug,
        franchiseId: gymData.franchiseId,
        memberData: memberData ? {
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          badge_id: config.memberId
        } : undefined
      }

      const preSession = await sessionFirstService.createSessionRecord(sessionFirstData)
      preCreatedSessionRef.current = { dbSessionId: preSession.dbSessionId }
      
      console.log('✅ [SESSION-FIRST] Session DB créée:', preSession.dbSessionId)

      // 4. PUIS créer session OpenAI
      console.log('🔗 [SESSION-FIRST] Création session OpenAI...')
      
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymSlug: config.gymSlug,
          memberId: config.memberId,
          memberData,
          optimizations: {
            prompt_engineering: 'advanced_length_control_via_instructions',
            response_length: 'system_instructions_based',
            temperature: 0.8,
            semantic_vad: 'low_eagerness_no_interrupts',
            conversation_memory: true,
            performance_mode: 'enabled',
            response_style: 'short_conversational_natural',
            sound_notifications: 'disabled',
            response_completion: 'full_sentences'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Session API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 [SESSION-FIRST] Réponse OpenAI session:', data)

      if (!data.success || !data.session) {
        throw new Error('Session creation failed')
      }

      const openaiSession = data.session
      const openaiSessionId = openaiSession.session_id || openaiSession.id

      // 5. 🔗 LIER OpenAI session au record DB
      await sessionFirstService.linkOpenAISession(preSession.dbSessionId, openaiSessionId)
      
      if (preCreatedSessionRef.current) {
        preCreatedSessionRef.current.openaiSessionId = openaiSessionId
      }

      console.log('✅ [SESSION-FIRST] Session complète créée:', {
        db: preSession.dbSessionId,
        openai: openaiSessionId
      })

      // 6. Notifier instrumentation avec session DB
      await openaiRealtimeInstrumentation.startSession(
        preSession.dbSessionId, // Utiliser notre ID DB
        gymData.gymId,
        {
          openai_session_id: openaiSessionId,
          member_context: data.member_context,
          gym_slug: config.gymSlug
        }
      )

      return openaiSession

    } catch (error) {
      console.error('💥 [SESSION-FIRST] Erreur création session:', error)
      
      // Nettoyer en cas d'erreur
      if (preCreatedSessionRef.current) {
        sessionFirstService.cleanup(preCreatedSessionRef.current.dbSessionId)
        preCreatedSessionRef.current = null
      }
      
      throw error
    }
  }, [config.gymSlug, config.memberId, getMemberData])

  /**
   * 🔧 ADAPTÉ: Handler événements audio avec session DB
   */
  const handleServerEventSessionFirst = useCallback(async (event: any) => {
    // Récupérer l'ID de session DB
    const dbSessionId = preCreatedSessionRef.current?.dbSessionId
    
    if (!dbSessionId) {
      console.warn('⚠️ [SESSION-FIRST] Aucune session DB pour événement:', event.type)
      return
    }

    // Enregistrer événement avec session DB (plus de 406 error !)
    try {
      await openaiRealtimeInstrumentation.recordAudioEvent(
        dbSessionId, // Utiliser session DB, pas OpenAI ID
        {
          event_type: event.type,
          event_timestamp: new Date().toISOString(),
          user_transcript: event.transcript,
          ai_transcript_final: event.response?.content,
          event_metadata: {
            openai_session_id: preCreatedSessionRef.current?.openaiSessionId,
            raw_event: event
          }
        }
      )
    } catch (error) {
      console.error('❌ [SESSION-FIRST] Erreur enregistrement événement:', error)
    }

    // ... (reste du code de gestion événements)
  }, [])

  /**
   * 🔧 ADAPTÉ: Finalisation avec session DB
   */
  const finalizeSessionTrackingFirst = useCallback(async () => {
    if (!preCreatedSessionRef.current) {
      console.log('📊 [SESSION-FIRST] Aucune session à finaliser')
      return
    }

    const { dbSessionId, openaiSessionId } = preCreatedSessionRef.current
    console.log('📊 [SESSION-FIRST] Finalisation session:', { dbSessionId, openaiSessionId })

    try {
      // Calculer coûts et durée
      const tracking = sessionTrackingRef.current
      const durationSeconds = Math.round((Date.now() - tracking.startTime.getTime()) / 1000)
      
      const costBreakdown = trackSessionCost({
        textInputTokens: tracking.textInputTokens,
        textOutputTokens: tracking.textOutputTokens,
        audioInputSeconds: tracking.audioInputSeconds,
        audioOutputSeconds: tracking.audioOutputSeconds
      })

      // Finaliser avec session DB
      await openaiRealtimeInstrumentation.endSession(dbSessionId, {
        session_duration_seconds: durationSeconds,
        total_user_turns: Math.max(1, Math.floor(tracking.transcriptHistory.length / 2)),
        total_ai_turns: Math.max(1, Math.ceil(tracking.transcriptHistory.length / 2)),
        total_interruptions: 0,
        total_input_tokens: tracking.textInputTokens,
        total_output_tokens: tracking.textOutputTokens,
        total_input_audio_tokens: Math.round(tracking.audioInputSeconds * 25), // Estimation
        total_output_audio_tokens: Math.round(tracking.audioOutputSeconds * 25),
        input_audio_tokens_cost_usd: costBreakdown.audioInputCost,
        output_audio_tokens_cost_usd: costBreakdown.audioOutputCost,
        input_text_tokens_cost_usd: costBreakdown.textInputCost,
        output_text_tokens_cost_usd: costBreakdown.textOutputCost,
        end_reason: tracking.errorOccurred ? 'error' : 'user_goodbye'
      })

      console.log('✅ [SESSION-FIRST] Session finalisée avec succès')

    } catch (error) {
      console.error('❌ [SESSION-FIRST] Erreur finalisation:', error)
    } finally {
      // Nettoyer
      sessionFirstService.cleanup(dbSessionId)
      preCreatedSessionRef.current = null
    }
  }, [])

  // Remplacer createSession par createSessionFirst
  const createSession = createSessionFirst
  const handleServerEvent = handleServerEventSessionFirst
  const finalizeSessionTracking = finalizeSessionTrackingFirst

  // ... (retourner interface identique à useVoiceChat original)
  
  return {
    // ... tous les returns existants
    createSession,
    finalizeSessionTracking,
    // 🆕 Nouveaux exports pour debug
    sessionFirstStats: () => sessionFirstService.getStats(),
    currentDbSession: () => preCreatedSessionRef.current
  }
}

// Export pour migration progressive
export { useVoiceChatSessionFirst as useVoiceChat }