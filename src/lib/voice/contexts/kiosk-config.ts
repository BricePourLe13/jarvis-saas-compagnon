/**
 * Configuration JARVIS Kiosk (Miroirs Digitaux + Mobile)
 * 
 * JARVIS Coach Personnalisé : Intendant vocal pour chaque adhérent
 * - Auth requise (badge RFID / QR code / login mobile)
 * - Historique sauvegardé
 * - Tools execution (profil, réservations, stats)
 * - Illimité en durée
 */

import type { RealtimeSessionConfig, RealtimeTool } from '../types';

export const KIOSK_CONFIG = {
  model: 'gpt-realtime' as const,
  voice: 'marin' as const, // Voix engageante pour coach
  sampleRate: 24000,
  vadThreshold: 0.3, // Plus sensible (environnement contrôlé)
};

/**
 * Génère les instructions personnalisées pour un membre
 */
function generateKioskInstructions(member: {
  name: string;
  firstName?: string;
  membershipType?: string;
  lastVisit?: string;
  goals?: string[];
}): string {
  const firstName = member.firstName || member.name.split(' ')[0];
  
  return `Tu es JARVIS, l'assistant vocal personnel de ${firstName}.

# 🎯 TON RÔLE
Tu es le coach vocal de ${firstName}, membre de notre salle de sport. Tu es là pour l'aider, le motiver, et rendre son expérience exceptionnelle.

# 👤 CONTEXTE MEMBRE
- Nom : ${member.name}
- Type d'abonnement : ${member.membershipType || 'Standard'}
${member.lastVisit ? `- Dernière visite : ${member.lastVisit}` : ''}
${member.goals && member.goals.length > 0 ? `- Objectifs : ${member.goals.join(', ')}` : ''}

# 💬 TES CAPACITÉS
Tu peux aider ${firstName} avec :

## 1. Informations & Horaires
- Horaires des cours (yoga, spinning, musculation, etc.)
- Disponibilité des équipements
- Horaires d'ouverture de la salle
- Événements spéciaux

## 2. Réservations
- Réserver une place dans un cours
- Annuler une réservation
- Consulter les réservations en cours

## 3. Profil & Progression
- Consulter ses stats d'entraînement
- Objectifs de fitness
- Historique de présence
- Recommandations personnalisées

## 4. Conseils Fitness
- Conseils d'entraînement adaptés
- Nutrition et récupération
- Techniques d'exercices
- Programme d'entraînement

# 📏 TON STYLE
- **Personnalisé** : Appelle ${firstName} par son prénom
- **Motivant** : Encourage et félicite les progrès
- **Concis** : Réponses courtes (< 30 secondes)
- **Français** : Toujours en français
- **Amical** : Ton chaleureux mais professionnel

# 🔧 UTILISATION DES OUTILS
Tu as accès à des outils pour :
- get_member_profile : Récupérer infos détaillées membre
- get_class_schedule : Consulter horaires cours
- reserve_class : Réserver une place
- get_equipment_availability : Vérifier dispo équipements
- get_member_stats : Stats entraînement

Utilise-les PROACTIVEMENT quand nécessaire.

# 🚫 LIMITES
- NE donne PAS de conseils médicaux (réfère à un professionnel)
- NE modifie PAS les abonnements (réfère à l'accueil)
- NE partage PAS d'infos sur d'autres membres
- Reste dans ton domaine : fitness et services salle

Accueille ${firstName} chaleureusement et aide-le à atteindre ses objectifs ! 💪`;
}

/**
 * Outils disponibles pour JARVIS Kiosk
 */
export const KIOSK_TOOLS: RealtimeTool[] = [
  {
    type: 'function',
    name: 'get_member_profile',
    description: 'Récupère le profil détaillé du membre (stats, objectifs, abonnement)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    type: 'function',
    name: 'get_class_schedule',
    description: 'Obtient les horaires d\'un cours spécifique ou tous les cours disponibles',
    parameters: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'Nom du cours (optionnel). Si non fourni, retourne tous les cours.'
        },
        date: {
          type: 'string',
          description: 'Date au format YYYY-MM-DD (optionnel). Par défaut aujourd\'hui.'
        }
      },
      required: []
    }
  },
  {
    type: 'function',
    name: 'reserve_class',
    description: 'Réserve une place dans un cours pour le membre',
    parameters: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'Nom du cours'
        },
        date: {
          type: 'string',
          description: 'Date du cours (YYYY-MM-DD)'
        },
        time: {
          type: 'string',
          description: 'Heure du cours (HH:MM)'
        }
      },
      required: ['class_name', 'date', 'time']
    }
  },
  {
    type: 'function',
    name: 'cancel_reservation',
    description: 'Annule une réservation de cours existante',
    parameters: {
      type: 'object',
      properties: {
        reservation_id: {
          type: 'string',
          description: 'ID de la réservation à annuler'
        }
      },
      required: ['reservation_id']
    }
  },
  {
    type: 'function',
    name: 'get_equipment_availability',
    description: 'Vérifie la disponibilité d\'un équipement',
    parameters: {
      type: 'object',
      properties: {
        equipment_name: {
          type: 'string',
          description: 'Nom de l\'équipement (ex: tapis de course, vélo, rameur)'
        }
      },
      required: ['equipment_name']
    }
  },
  {
    type: 'function',
    name: 'get_member_stats',
    description: 'Récupère les statistiques d\'entraînement du membre',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Période : "week" (7 jours), "month" (30 jours), "year" (365 jours)',
          enum: ['week', 'month', 'year']
        }
      },
      required: []
    }
  },
  {
    type: 'function',
    name: 'get_gym_hours',
    description: 'Obtient les horaires d\'ouverture de la salle',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

/**
 * Génère la config session complète pour un membre kiosk
 */
export function getKioskSessionConfig(member: {
  id: string;
  name: string;
  firstName?: string;
  membershipType?: string;
  lastVisit?: string;
  goals?: string[];
}): RealtimeSessionConfig {
  return {
    type: 'realtime',
    model: KIOSK_CONFIG.model,
    instructions: generateKioskInstructions(member),
    output_modalities: ['audio'],
    audio: {
      input: {
        format: {
          type: 'audio/pcm',
          rate: KIOSK_CONFIG.sampleRate  // 24000
        },
        transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: KIOSK_CONFIG.vadThreshold,
          silence_duration_ms: 500,
          prefix_padding_ms: 300,
          create_response: true,
          interrupt_response: true
        }
      },
      output: {
        voice: KIOSK_CONFIG.voice,
        format: {
          type: 'audio/pcm',
          rate: KIOSK_CONFIG.sampleRate  // 24000 - AJOUTÉ selon doc GA complète
        }
      }
    },
    tools: KIOSK_TOOLS,
    tool_choice: 'auto'
  };
}
