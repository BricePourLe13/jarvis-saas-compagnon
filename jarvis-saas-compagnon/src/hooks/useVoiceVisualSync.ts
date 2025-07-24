// 🎭 SYNCHRONISATION AUDIO-VISUELLE ÉMOTIONNELLE - PHASE 6
// Synchronise les micro-animations de JARVIS avec ses nuances vocales

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAnimationControls } from 'framer-motion'

export interface VoiceEmotionalState {
  emotion: 'happy' | 'excited' | 'thoughtful' | 'empathetic' | 'playful' | 'serious' | 'tired' | 'frustrated'
  intensity: 'low' | 'medium' | 'high'
  speaking_pace: 'slow' | 'normal' | 'fast'
  vocal_patterns: {
    has_hesitation: boolean
    has_laughter: boolean
    has_sigh: boolean
    has_surprise: boolean
  }
}

export interface VisualSync {
  eye_animation: 'blink' | 'wink' | 'wide' | 'focused' | 'squint' | 'roll'
  sphere_animation: 'gentle_pulse' | 'excited_bounce' | 'thoughtful_sway' | 'empathetic_glow' | 'playful_wiggle'
  color_transition: string
  cosmic_intensity: number // 0-1
  breathing_pattern: 'calm' | 'excited' | 'thoughtful' | 'deep'
}

// 🎨 MAPPINGS ÉMOTIONS → ANIMATIONS VISUELLES
const emotionalAnimationMappings: Record<string, VisualSync> = {
  // 😊 JARVIS HEUREUX/CONTENT
  happy_low: {
    eye_animation: 'blink',
    sphere_animation: 'gentle_pulse',
    color_transition: 'rgba(34, 197, 94, 0.7)', // Vert doux
    cosmic_intensity: 0.6,
    breathing_pattern: 'calm'
  },
  happy_medium: {
    eye_animation: 'blink',
    sphere_animation: 'gentle_pulse',
    color_transition: 'rgba(34, 197, 94, 0.8)',
    cosmic_intensity: 0.7,
    breathing_pattern: 'calm'
  },
  happy_high: {
    eye_animation: 'wink',
    sphere_animation: 'excited_bounce',
    color_transition: 'rgba(34, 197, 94, 0.9)',
    cosmic_intensity: 0.8,
    breathing_pattern: 'excited'
  },

  // 🚀 JARVIS EXCITÉ/ENTHOUSIASTE
  excited_low: {
    eye_animation: 'wide',
    sphere_animation: 'excited_bounce',
    color_transition: 'rgba(59, 130, 246, 0.7)', // Bleu vif
    cosmic_intensity: 0.8,
    breathing_pattern: 'excited'
  },
  excited_medium: {
    eye_animation: 'wide',
    sphere_animation: 'excited_bounce',
    color_transition: 'rgba(59, 130, 246, 0.8)',
    cosmic_intensity: 0.9,
    breathing_pattern: 'excited'
  },
  excited_high: {
    eye_animation: 'wide',
    sphere_animation: 'playful_wiggle',
    color_transition: 'rgba(59, 130, 246, 1.0)',
    cosmic_intensity: 1.0,
    breathing_pattern: 'excited'
  },

  // 🤔 JARVIS RÉFLÉCHI/PENSIF
  thoughtful_low: {
    eye_animation: 'focused',
    sphere_animation: 'thoughtful_sway',
    color_transition: 'rgba(139, 92, 246, 0.6)', // Violet pensif
    cosmic_intensity: 0.4,
    breathing_pattern: 'thoughtful'
  },
  thoughtful_medium: {
    eye_animation: 'focused',
    sphere_animation: 'thoughtful_sway',
    color_transition: 'rgba(139, 92, 246, 0.7)',
    cosmic_intensity: 0.5,
    breathing_pattern: 'thoughtful'
  },
  thoughtful_high: {
    eye_animation: 'squint',
    sphere_animation: 'thoughtful_sway',
    color_transition: 'rgba(139, 92, 246, 0.8)',
    cosmic_intensity: 0.6,
    breathing_pattern: 'deep'
  },

  // 💝 JARVIS EMPATHIQUE/SOUTIEN
  empathetic_low: {
    eye_animation: 'blink',
    sphere_animation: 'empathetic_glow',
    color_transition: 'rgba(251, 191, 36, 0.6)', // Orange chaleureux
    cosmic_intensity: 0.5,
    breathing_pattern: 'calm'
  },
  empathetic_medium: {
    eye_animation: 'blink',
    sphere_animation: 'empathetic_glow',
    color_transition: 'rgba(251, 191, 36, 0.7)',
    cosmic_intensity: 0.6,
    breathing_pattern: 'calm'
  },
  empathetic_high: {
    eye_animation: 'focused',
    sphere_animation: 'empathetic_glow',
    color_transition: 'rgba(251, 191, 36, 0.8)',
    cosmic_intensity: 0.7,
    breathing_pattern: 'deep'
  },

  // 🎪 JARVIS TAQUIN/JOUEUR
  playful_low: {
    eye_animation: 'wink',
    sphere_animation: 'playful_wiggle',
    color_transition: 'rgba(236, 72, 153, 0.7)', // Rose malicieux
    cosmic_intensity: 0.7,
    breathing_pattern: 'excited'
  },
  playful_medium: {
    eye_animation: 'wink',
    sphere_animation: 'playful_wiggle',
    color_transition: 'rgba(236, 72, 153, 0.8)',
    cosmic_intensity: 0.8,
    breathing_pattern: 'excited'
  },
  playful_high: {
    eye_animation: 'roll',
    sphere_animation: 'playful_wiggle',
    color_transition: 'rgba(236, 72, 153, 0.9)',
    cosmic_intensity: 0.9,
    breathing_pattern: 'excited'
  }
}

// 🎵 PATTERNS VOCAUX → MICRO-ANIMATIONS
const vocalPatternAnimations = {
  hesitation: {
    eye_action: 'pause_and_look_aside',
    sphere_action: 'slight_sway',
    duration: 800
  },
  laughter: {
    eye_action: 'squint_happy',
    sphere_action: 'joyful_bounce',
    duration: 1200
  },
  sigh: {
    eye_action: 'slow_blink',
    sphere_action: 'gentle_deflate',
    duration: 1500
  },
  surprise: {
    eye_action: 'wide_open',
    sphere_action: 'sudden_expand',
    duration: 600
  },
  breathing: {
    eye_action: 'natural_blink',
    sphere_action: 'rhythmic_pulse',
    duration: 2000
  }
}

// 🎭 HOOK PRINCIPAL
export function useVoiceVisualSync() {
  const [currentEmotion, setCurrentEmotion] = useState<VoiceEmotionalState>({
    emotion: 'happy',
    intensity: 'medium',
    speaking_pace: 'normal',
    vocal_patterns: {
      has_hesitation: false,
      has_laughter: false,
      has_sigh: false,
      has_surprise: false
    }
  })

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const sphereControls = useAnimationControls()
  const eyeControls = useAnimationControls()
  const cosmicControls = useAnimationControls()
  
  const animationQueue = useRef<Array<() => void>>([])
  const processingAnimation = useRef(false)

  // 🎯 ANALYSER LE TEXTE DE JARVIS POUR DÉTECTER LES ÉMOTIONS
  const analyzeEmotionalContent = useCallback((text: string): VoiceEmotionalState => {
    const lowerText = text.toLowerCase()
    
    // Détection patterns vocaux
    const vocal_patterns = {
      has_hesitation: /\b(euh|hmm|alors|voyons|comment dire)\b/.test(lowerText),
      has_laughter: /\*(rire|hihi|aha)\*/.test(lowerText),
      has_sigh: /\*(soupir|souffle)\*/.test(lowerText),
      has_surprise: /\b(oh|wahou|vraiment|sans blague)\b/.test(lowerText)
    }
    
    // Détection émotions par mots-clés
    let emotion: VoiceEmotionalState['emotion'] = 'happy'
    let intensity: VoiceEmotionalState['intensity'] = 'medium'
    
    if (/\b(génial|super|fantastique|excellent|parfait)\b/.test(lowerText)) {
      emotion = 'excited'
      intensity = 'high'
    } else if (/\b(intéressant|voyons|réfléchir|comprends)\b/.test(lowerText)) {
      emotion = 'thoughtful'
      intensity = 'medium'
    } else if (/\b(comprends|normal|écoute|rassure)\b/.test(lowerText)) {
      emotion = 'empathetic'
      intensity = 'medium'
    } else if (/\*(rire|taquin|malicieux)\*/.test(lowerText)) {
      emotion = 'playful'
      intensity = 'high'
    }
    
    // Détection vitesse de parole
    const wordCount = lowerText.split(' ').length
    let speaking_pace: VoiceEmotionalState['speaking_pace'] = 'normal'
    
    if (vocal_patterns.has_hesitation || emotion === 'thoughtful') {
      speaking_pace = 'slow'
    } else if (emotion === 'excited' || emotion === 'playful') {
      speaking_pace = 'fast'
    }
    
    return { emotion, intensity, speaking_pace, vocal_patterns }
  }, [])

  // 🎨 APPLIQUER LES ANIMATIONS CORRESPONDANTES
  const applyEmotionalAnimations = useCallback(async (emotionalState: VoiceEmotionalState) => {
    const animationKey = `${emotionalState.emotion}_${emotionalState.intensity}`
    const visualSync = emotionalAnimationMappings[animationKey] || emotionalAnimationMappings['happy_medium']
    
    // 🎭 Animation de la sphère principale
    sphereControls.start({
      scale: visualSync.sphere_animation === 'excited_bounce' ? [1, 1.05, 1] : 
             visualSync.sphere_animation === 'gentle_pulse' ? [1, 1.02, 1] :
             visualSync.sphere_animation === 'thoughtful_sway' ? [1, 1.01, 1] :
             visualSync.sphere_animation === 'empathetic_glow' ? [1, 1.03, 1] :
             visualSync.sphere_animation === 'playful_wiggle' ? [0.98, 1.05, 0.98] : [1, 1.02, 1],
      
      rotateZ: visualSync.sphere_animation === 'playful_wiggle' ? [-2, 2, -2] : 0,
      
      filter: [
        `brightness(1) saturate(1) drop-shadow(0 0 20px ${visualSync.color_transition})`,
        `brightness(1.1) saturate(1.2) drop-shadow(0 0 30px ${visualSync.color_transition})`,
        `brightness(1) saturate(1) drop-shadow(0 0 20px ${visualSync.color_transition})`
      ],
      
      transition: {
        duration: emotionalState.speaking_pace === 'fast' ? 0.6 : 
                 emotionalState.speaking_pace === 'slow' ? 2.0 : 1.2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    })

    // 👀 Animation des yeux
    if (visualSync.eye_animation === 'wink') {
      eyeControls.start({
        scaleX: [1, 0.5, 1],
        rotateZ: [0, -5, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
      })
    } else if (visualSync.eye_animation === 'wide') {
      eyeControls.start({
        scaleY: [1, 1.3, 1],
        scaleX: [1, 1.1, 1],
        transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
      })
    } else if (visualSync.eye_animation === 'squint') {
      eyeControls.start({
        scaleY: [1, 0.7, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      })
    }

    // ✨ Animation cosmique
    cosmicControls.start({
      opacity: [visualSync.cosmic_intensity * 0.8, visualSync.cosmic_intensity, visualSync.cosmic_intensity * 0.8],
      scale: [1, 1 + (visualSync.cosmic_intensity * 0.1), 1],
      transition: {
        duration: emotionalState.speaking_pace === 'fast' ? 1.5 : 3.0,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    })
    
  }, [sphereControls, eyeControls, cosmicControls])

  // 🎵 RÉAGIR AUX PATTERNS VOCAUX SPÉCIFIQUES
  const handleVocalPattern = useCallback((pattern: keyof typeof vocalPatternAnimations) => {
    const animation = vocalPatternAnimations[pattern]
    
    if (pattern === 'hesitation') {
      // Pause, regard de côté
      eyeControls.start({
        x: [0, 5, 0],
        scaleY: [1, 0.8, 1],
        transition: { duration: animation.duration / 1000 }
      })
    } else if (pattern === 'laughter') {
      // Yeux plissés de joie
      eyeControls.start({
        scaleY: [1, 0.3, 1],
        scaleX: [1, 1.2, 1],
        transition: { duration: animation.duration / 1000, repeat: 2 }
      })
      sphereControls.start({
        scale: [1, 1.1, 1],
        y: [0, -5, 0],
        transition: { duration: animation.duration / 1000, repeat: 2 }
      })
    } else if (pattern === 'sigh') {
      // Respiration profonde
      sphereControls.start({
        scale: [1, 0.95, 1.05, 1],
        transition: { duration: animation.duration / 1000 }
      })
    } else if (pattern === 'surprise') {
      // Yeux écarquillés
      eyeControls.start({
        scaleY: [1, 1.5, 1],
        scaleX: [1, 1.3, 1],
        transition: { duration: animation.duration / 1000 }
      })
    }
  }, [eyeControls, sphereControls])

  // 🎤 ANALYSER LE TEXTE DE JARVIS ET SYNCHRONISER
  const syncWithVoiceContent = useCallback((text: string) => {
    const emotionalState = analyzeEmotionalContent(text)
    setCurrentEmotion(emotionalState)
    
    // Appliquer animations émotionnelles globales
    applyEmotionalAnimations(emotionalState)
    
    // Traiter les patterns vocaux spécifiques
    Object.entries(emotionalState.vocal_patterns).forEach(([pattern, hasPattern]) => {
      if (hasPattern) {
        setTimeout(() => {
          handleVocalPattern(pattern.replace('has_', '') as keyof typeof vocalPatternAnimations)
        }, Math.random() * 500) // Décalage aléatoire pour naturel
      }
    })
  }, [analyzeEmotionalContent, applyEmotionalAnimations, handleVocalPattern])

  // 🎧 ÉTATS D'ÉCOUTE/PAROLE
  const setListeningState = useCallback((listening: boolean) => {
    setIsListening(listening)
    
    if (listening) {
      // Animation d'écoute attentive
      sphereControls.start({
        scale: [1, 1.01, 1],
        filter: [
          'brightness(1) saturate(1) drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))',
          'brightness(1.05) saturate(1.1) drop-shadow(0 0 25px rgba(34, 197, 94, 0.8))',
          'brightness(1) saturate(1) drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))'
        ],
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
      })
      
      eyeControls.start({
        scaleY: [1, 1.1, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      })
    }
  }, [sphereControls, eyeControls])

  const setSpeakingState = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking)
    
    if (!speaking) {
      // Retour à l'état de repos
      sphereControls.start({
        scale: 1,
        rotateZ: 0,
        filter: 'brightness(1) saturate(1) drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))',
        transition: { duration: 1 }
      })
      
      eyeControls.start({
        scaleX: 1,
        scaleY: 1,
        x: 0,
        rotateZ: 0,
        transition: { duration: 1 }
      })
    }
  }, [sphereControls, eyeControls])

  return {
    // État actuel
    currentEmotion,
    isListening,
    isSpeaking,
    
    // Contrôles d'animation
    sphereControls,
    eyeControls,
    cosmicControls,
    
    // Fonctions de synchronisation
    syncWithVoiceContent,
    setListeningState,
    setSpeakingState,
    handleVocalPattern,
    
    // Utilitaires
    analyzeEmotionalContent
  }
} 