import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    console.log('🔍 [APP AUDIT] Analyse des requêtes Supabase dans l\'app...')
    
    // Tables théoriquement utilisées basées sur l'analyse du code
    const expectedTables = {
      // Core tables
      'franchises': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['admin dashboard', 'manager auth'],
        columns: ['id', 'name', 'city', 'owner_id', 'created_at']
      },
      'gyms': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['admin dashboard', 'kiosk provisioning', 'manager dashboard'],
        columns: ['id', 'name', 'franchise_id', 'kiosk_config', 'jarvis_settings']
      },
      'gym_members': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['member lookup', 'kiosk badge scan', 'manager dashboard'],
        columns: ['id', 'gym_id', 'badge_id', 'first_name', 'last_name', 'member_preferences', 'total_visits']
      },
      
      // Realtime & Sessions
      'openai_realtime_sessions': {
        operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
        contexts: ['voice chat', 'monitoring', 'cost tracking'],
        columns: ['session_id', 'gym_id', 'member_id', 'ai_model', 'voice_model', 'session_started_at', 'session_ended_at']
      },
      'openai_realtime_audio_events': {
        operations: ['SELECT', 'INSERT'],
        contexts: ['voice chat events', 'monitoring'],
        columns: ['session_id', 'gym_id', 'event_type', 'user_transcript', 'ai_transcript_final']
      },
      'jarvis_session_costs': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['cost tracking', 'admin monitoring'],
        columns: ['session_id', 'gym_id', 'total_cost', 'input_tokens', 'output_tokens']
      },
      
      // Logging & Analytics
      'jarvis_conversation_logs': {
        operations: ['SELECT', 'INSERT'],
        contexts: ['conversation logging', 'manager dashboard'],
        columns: ['session_id', 'gym_id', 'member_id', 'speaker', 'message_text', 'conversation_turn_number']
      },
      'member_session_analytics': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['member analytics', 'manager dashboard'],
        columns: ['member_id', 'gym_id', 'session_count', 'total_duration', 'avg_satisfaction']
      },
      'member_knowledge_base': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['member context', 'personalization'],
        columns: ['member_id', 'gym_id', 'preferences', 'goals', 'conversation_history']
      },
      
      // Manager Dashboard
      'onboarding_progress': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['manager onboarding'],
        columns: ['gym_id', 'user_id', 'step', 'completed', 'completed_at']
      },
      'manager_actions': {
        operations: ['SELECT', 'INSERT'],
        contexts: ['manager action tracking'],
        columns: ['gym_id', 'user_id', 'action_type', 'details', 'timestamp']
      },
      'manager_notifications': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['manager notifications'],
        columns: ['gym_id', 'user_id', 'type', 'title', 'message', 'is_read']
      },
      
      // Auth & Users
      'profiles': {
        operations: ['SELECT', 'INSERT', 'UPDATE'],
        contexts: ['user authentication', 'profile management'],
        columns: ['id', 'email', 'first_name', 'last_name', 'role']
      },
      'user_roles': {
        operations: ['SELECT'],
        contexts: ['role-based access'],
        columns: ['user_id', 'role', 'franchise_id', 'gym_id']
      },
      'team_members': {
        operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
        contexts: ['team management'],
        columns: ['user_id', 'franchise_id', 'gym_id', 'role', 'permissions']
      }
    }

    // RPC Functions utilisées
    const expectedRPCs = {
      'get_kiosk_realtime_metrics': {
        purpose: 'Métriques temps réel kiosk',
        params: ['kiosk_id'],
        returns: 'metrics object'
      },
      'get_gym_active_sessions': {
        purpose: 'Sessions actives par gym',
        params: ['gym_id'],
        returns: 'sessions array'
      },
      'cleanup_inactive_realtime_sessions': {
        purpose: 'Nettoyage sessions inactives',
        params: ['timeout_minutes'],
        returns: 'cleanup count'
      },
      'close_realtime_session': {
        purpose: 'Fermeture session explicite',
        params: ['session_id', 'reason'],
        returns: 'boolean'
      },
      'log_member_visit': {
        purpose: 'Enregistrer visite membre',
        params: ['p_badge_id', 'p_gym_slug'],
        returns: 'visit record'
      },
      'calculate_personalization_score': {
        purpose: 'Score personnalisation membre',
        params: ['member_id'],
        returns: 'score number'
      }
    }

    // Analyse des patterns de requêtes dans le code
    const queryPatterns = {
      adminDashboard: {
        tables: ['franchises', 'gyms', 'jarvis_session_costs', 'openai_realtime_sessions'],
        operations: ['dashboard metrics', 'franchise management', 'monitoring']
      },
      managerDashboard: {
        tables: ['gym_members', 'jarvis_conversation_logs', 'member_session_analytics', 'onboarding_progress'],
        operations: ['member insights', 'conversation history', 'onboarding tracking']
      },
      kioskInterface: {
        tables: ['gym_members', 'openai_realtime_sessions', 'openai_realtime_audio_events', 'jarvis_conversation_logs'],
        operations: ['member lookup', 'session management', 'conversation logging']
      },
      monitoring: {
        tables: ['openai_realtime_sessions', 'jarvis_session_costs', 'openai_realtime_audio_events'],
        operations: ['session tracking', 'cost monitoring', 'performance metrics']
      }
    }

    // Colonnes critiques manquantes identifiées
    const potentialIssues = {
      missingColumns: {
        'gym_members': ['can_use_jarvis'], // Référencé dans le code mais n'existe pas
        'gyms': ['manager_user_id'], // Pour assigner un manager à une gym
        'jarvis_conversation_logs': ['sentiment_score', 'topic_tags'] // Pour analytics avancées
      },
      missingTables: [
        'gym_equipment', // Pour contexte équipements
        'member_workout_history', // Pour recommandations
        'jarvis_performance_metrics', // Pour optimisation IA
        'notification_templates' // Pour notifications automatisées
      ],
      missingIndexes: [
        'gym_members.badge_id + gym_id', // Lookup performant
        'jarvis_conversation_logs.session_id', // Requêtes conversation
        'openai_realtime_sessions.gym_id + session_started_at' // Monitoring temporal
      ]
    }

    // Relations manquantes identifiées
    const missingRelations = {
      'gyms -> profiles': 'manager_user_id (manager assigné à la gym)',
      'jarvis_conversation_logs -> gym_members': 'conversation context',
      'member_session_analytics -> gym_members': 'analytics tracking',
      'onboarding_progress -> profiles': 'user tracking'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        expectedTables,
        expectedRPCs,
        queryPatterns,
        potentialIssues,
        missingRelations,
        recommendations: {
          immediate: [
            'Ajouter colonne can_use_jarvis à gym_members',
            'Créer index sur gym_members.badge_id + gym_id', 
            'Ajouter manager_user_id à gyms pour assignation manager'
          ],
          optimization: [
            'Créer vues matérialisées pour dashboard metrics',
            'Implémenter partitioning sur jarvis_conversation_logs par date',
            'Ajouter indexes composites pour requêtes fréquentes'
          ],
          future: [
            'Table gym_equipment pour contexte détaillé',
            'Analytics avancées avec sentiment/topics',
            'Système de notifications automatisées'
          ]
        }
      }
    })

  } catch (error) {
    console.error('❌ [APP AUDIT] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
