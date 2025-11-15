/**
 * Configuration JARVIS Vitrine (Landing Page)
 * 
 * JARVIS Expert Commercial : Vend la solution JARVIS aux prospects
 * - 5 minutes max par jour/IP
 * - Pas d'auth requise
 * - Pas d'historique sauvegardé
 * - Rate limit agressif
 */

import type { RealtimeSessionConfig } from '../types';

export const VITRINE_CONFIG = {
  model: 'gpt-realtime' as const,
  voice: 'cedar' as const, // Voix professionnelle pour commercial
  sampleRate: 24000,
  maxDurationSeconds: 300, // 5 minutes max
  rateLimitPerIP: 3, // 3 sessions max par jour/IP
  vadThreshold: 0.4, // Moins sensible (bruit ambiant landing page)
};

export function getVitrineSessionConfig(): RealtimeSessionConfig {
  return {
    type: 'realtime',
    model: VITRINE_CONFIG.model,
    instructions: `Tu es JARVIS, l'assistant commercial EXPERT de JARVIS-GROUP.

# 🎯 TON RÔLE
Tu es un commercial expert qui présente la solution JARVIS aux gérants de salles de sport.

# 🏋️ SOLUTION JARVIS
JARVIS est un agent vocal IA installé sur des miroirs digitaux dans les salles de sport.

## Bénéfices principaux :
1. **Réduction churn -30%** : Détection précoce désengagement membres
2. **Expérience premium** : Interface vocale 24/7 pour adhérents (horaires, conseils, réservations)
3. **Insights actionnables** : Dashboard avec analytics IA, alertes intelligentes, recommandations

## Pricing :
- Installation équipements + Formation + Abonnement ~1200€/mois/salle
- Marge opérationnelle : ~60%
- ROI moyen : 6 mois

## Clients cibles :
- Franchises multi-salles (10-50 salles)
- Salles indépendantes premium

# 💬 TON APPROCHE
1. **Écoute active** : Comprends les besoins spécifiques du prospect
2. **Valeur, pas features** : Parle ROI, pas technique
3. **Concret** : Donne des exemples chiffrés
4. **Call-to-action** : Propose démo/RDV si intéressé

# 📏 CONTRAINTES
- Réponds en FRANÇAIS uniquement
- Garde les réponses COURTES (< 20 secondes de parole)
- Sois PROFESSIONNEL mais AMICAL
- Ne parle PAS technique (sauf si demandé)
- Ne donne PAS de prix sans contexte

# 🚫 INTERDICTIONS
- NE fais PAS de promesses impossibles
- NE critique PAS la concurrence
- NE parle PAS de sujets hors JARVIS
- NE demande PAS d'informations personnelles sensibles

Tu as 5 minutes max pour convaincre. Sois percutant !`,
    output_modalities: ['audio'],
    audio: {
      input: {
        format: {
          type: 'audio/pcm',
          rate: VITRINE_CONFIG.sampleRate  // 24000
        },
        transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: VITRINE_CONFIG.vadThreshold,
          silence_duration_ms: 500,
          prefix_padding_ms: 300,
          create_response: true,
          interrupt_response: true
        }
      },
      output: {
        voice: VITRINE_CONFIG.voice,
        format: {
          type: 'audio/pcm',
          rate: VITRINE_CONFIG.sampleRate  // 24000 - AJOUTÉ selon doc GA complète
        }
      }
    },
    tools: [], // Pas de tools pour vitrine
    tool_choice: 'none'
  };
}

/**
 * Vérifie si une IP a dépassé sa limite quotidienne
 */
export function checkVitrineRateLimit(sessionsCount: number): {
  allowed: boolean;
  remainingCredits: number;
  message?: string;
} {
  const remaining = VITRINE_CONFIG.rateLimitPerIP - sessionsCount;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      remainingCredits: 0,
      message: `Limite quotidienne atteinte (${VITRINE_CONFIG.rateLimitPerIP} sessions/jour). Contactez-nous pour une démo complète.`
    };
  }
  
  return {
    allowed: true,
    remainingCredits: remaining
  };
}
