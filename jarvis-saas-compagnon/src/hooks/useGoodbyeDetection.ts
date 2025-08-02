/**
 * 🎯 Hook dédié à la détection "au revoir" avec Web Speech API
 * Solution simple, gratuite et en temps réel qui écoute en parallèle
 */

import { useEffect, useRef, useCallback, useState } from 'react'

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
      console.warn('❌ [GOODBYE] Speech Recognition non supporté')
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
        console.log('🎯 [GOODBYE] Speech Recognition:', transcript)

        // ❌ IGNORER SI JARVIS PARLE
        if (isJarvisSpeaking) {
          console.log('🔇 [GOODBYE] Ignoré - JARVIS parle:', transcript)
          return
        }

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
            console.log('🔄 [GOODBYE] Détection trop rapide, ignorée')
            return
          }
          
          lastDetectionRef.current = now
          console.log('👋 [GOODBYE] AU REVOIR DÉTECTÉ !', transcript)
          
          // Arrêter la reconnaissance et déclencher la fermeture
          recognition.stop()
          onGoodbyeDetected()
        } else {
          console.log('➡️ [GOODBYE] Pas un au revoir:', transcript)
        }
      }
    }

    // Gestion des erreurs
    recognition.onerror = (event) => {
      console.warn('⚠️ [GOODBYE] Erreur Speech Recognition:', event.error)
      
      // Redémarrer automatiquement sauf si arrêt volontaire
      if (isActive && event.error !== 'aborted') {
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive) {
            console.log('🔄 [GOODBYE] Redémarrage automatique...')
            startListening()
          }
        }, 1000)
      }
    }

    // Redémarrer quand ça s'arrête
    recognition.onend = () => {
      console.log('🔄 [GOODBYE] Recognition terminée')
      
      if (isActive) {
        // Redémarrer automatiquement
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              console.warn('⚠️ [GOODBYE] Impossible de redémarrer:', error)
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
      console.warn('❌ [GOODBYE] Speech Recognition non disponible')
      return
    }

    try {
      console.log('🎤 [GOODBYE] Démarrage détection au revoir...')

      // Créer nouvelle instance si nécessaire
      if (!recognitionRef.current) {
        recognitionRef.current = createRecognition()
      }

      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsListening(true)
        console.log('✅ [GOODBYE] Détection démarrée')
      }

    } catch (error) {
      console.error('❌ [GOODBYE] Erreur démarrage:', error)
    }
  }, [createRecognition, isSpeechRecognitionSupported])

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    console.log('🛑 [GOODBYE] Arrêt détection au revoir...')

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
      console.log('⏸️ [GOODBYE] Pause - JARVIS parle')
      recognitionRef.current.stop()
    } else if (!isJarvisSpeaking && isActive && !isListening) {
      console.log('▶️ [GOODBYE] Reprise - JARVIS arrêté')
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