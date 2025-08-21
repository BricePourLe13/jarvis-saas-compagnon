/**
 * 🎯 Hook dédié à la détection "au revoir" avec Web Speech API
 * Solution simple, gratuite et en temps réel qui écoute en parallèle
 */

import { useEffect, useRef, useCallback, useState } from 'react'
// import { whisperParallelTracker } from '@/lib/whisper-parallel-tracker' // 🗑️ SUPPRIMÉ
import { kioskLogger } from '@/lib/kiosk-logger'


interface UseGoodbyeDetectionProps {
  isActive: boolean
  isJarvisSpeaking?: boolean // Nouveau: bloquer quand JARVIS parle
  onGoodbyeDetected: () => void
}

export const useGoodbyeDetection = ({ 
  isActive, 
  isJarvisSpeaking = false,
  onGoodbyeDetected 
}: UseGoodbyeDetectionProps) => {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const lastDetectionRef = useRef<number>(0)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Vérifier si Speech Recognition est supporté
  const isSpeechRecognitionSupported = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }, [])

  // Créer et configurer SpeechRecognition
  const createRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      // Warning supprimé pour production
      return null
    }

    // @ts-ignore - SpeechRecognition types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // Configuration optimisée pour "au revoir"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'fr-FR'
    recognition.maxAlternatives = 1

    // Gestion des résultats
    recognition.onresult = (event) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim()
        // Log supprimé pour production

        // ❌ IGNORER SI JARVIS PARLE
        if (isJarvisSpeaking) {
          // Log supprimé pour production
          return
        }

        // 🗑️ [WHISPER TRACKER] SUPPRIMÉ - OpenAI gère tout maintenant

        // Détection stricte "au revoir" uniquement
        const isGoodbye = (
          transcript === 'au revoir' ||
          transcript === 'au revoir.' ||
          transcript === 'au revoir !' ||
          (transcript.startsWith('au revoir ') && transcript.length <= 15)
        )

        if (isGoodbye) {
          // Éviter les détections multiples rapides
          const now = Date.now()
          if (now - lastDetectionRef.current < 5000) {
            // Log supprimé pour production
            return
          }
          
          lastDetectionRef.current = now
          // Log supprimé pour production
          
          // Arrêter la reconnaissance et déclencher la fermeture
          recognition.stop()
          onGoodbyeDetected()
        } else {
          // Log supprimé pour production
        }
      }
    }

    // Gestion des erreurs
    recognition.onerror = (event) => {
      // Warning supprimé pour production
      
      // Redémarrer automatiquement sauf si arrêt volontaire
      if (isActive && event.error !== 'aborted') {
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive) {
            // Log supprimé pour production
            startListening()
          }
        }, 1000)
      }
    }

    // Redémarrer quand ça s'arrête
    recognition.onend = () => {
      // Log supprimé pour production
      
      // 🗑️ [WHISPER TRACKER] SUPPRIMÉ - OpenAI gère tout maintenant
      
      if (isActive) {
        // Redémarrer automatiquement
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              // Warning supprimé pour production
            }
          }
        }, 500)
      }
    }

    return recognition
  }, [isActive, onGoodbyeDetected])

  // Démarrer l'écoute
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      // Warning supprimé pour production
      return
    }

    try {
      // Log supprimé pour production

      // Créer nouvelle instance si nécessaire
      if (!recognitionRef.current) {
        recognitionRef.current = createRecognition()
      }

      if (recognitionRef.current) {
        // Vérifier que la reconnaissance n'est pas déjà en cours
        try {
          recognitionRef.current.start()
          setIsListening(true)
          // Log supprimé pour production
        } catch (startError) {
          if (startError instanceof Error && startError.message.includes('already started')) {
            // Log supprimé pour production
          } else {
            throw startError
          }
        }
      }

    } catch (error) {
      // Erreur supprimée pour production
    }
  }, [createRecognition, isSpeechRecognitionSupported])

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    // Log supprimé pour production

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setIsListening(false)
  }, [])

  // Gérer l'activation/désactivation
  useEffect(() => {
    if (isActive && !isListening && !isJarvisSpeaking) {
      startListening()
    } else if (!isActive && isListening) {
      stopListening()
    }
  }, [isActive, isListening, isJarvisSpeaking, startListening, stopListening])

  // Pauser/reprendre quand JARVIS parle
  useEffect(() => {
    if (isJarvisSpeaking && isListening && recognitionRef.current) {
      // Log supprimé pour production
      recognitionRef.current.stop()
    } else if (!isJarvisSpeaking && isActive && !isListening) {
      // Log supprimé pour production
      startListening()
    }
  }, [isJarvisSpeaking, isActive, isListening, startListening])

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return {
    isListening,
    isSupported: isSpeechRecognitionSupported(),
    stopListening
  }
}