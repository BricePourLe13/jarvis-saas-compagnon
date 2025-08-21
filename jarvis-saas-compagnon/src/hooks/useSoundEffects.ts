import { useCallback, useRef } from 'react'

interface SoundEffectsOptions {
  enabled?: boolean
  volume?: number
}

export function useSoundEffects({ enabled = true, volume = 0.3 }: SoundEffectsOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialiser le contexte audio
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && enabled) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [enabled])

  // Générer un son de feedback
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabled) return

    const audioContext = initAudioContext()
    if (!audioContext) return

    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type

      // Enveloppe pour éviter les clics
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

    } catch (error) {
      // Warning supprimé pour production
    }
  }, [enabled, volume, initAudioContext])

  // Sons prédéfinis
  const sounds = {
    // Son de scan de badge (bip court et aigu)
    badgeScan: useCallback(() => {
      playTone(800, 0.1, 'square')
      setTimeout(() => playTone(1000, 0.1, 'square'), 100)
    }, [playTone]),

    // Son de connexion (mélodie ascendante)
    connect: useCallback(() => {
      playTone(440, 0.1)
      setTimeout(() => playTone(550, 0.1), 80)
      setTimeout(() => playTone(660, 0.15), 160)
    }, [playTone]),

    // Son de déconnexion (mélodie descendante)
    disconnect: useCallback(() => {
      playTone(660, 0.1)
      setTimeout(() => playTone(550, 0.1), 80)
      setTimeout(() => playTone(440, 0.15), 160)
    }, [playTone]),

    // Son d'erreur (tonalité grave)
    error: useCallback(() => {
      playTone(200, 0.3, 'sawtooth')
    }, [playTone]),

    // Son de début d'écoute (ton doux)
    startListening: useCallback(() => {
      playTone(500, 0.2, 'sine')
    }, [playTone]),

    // Son de fin d'écoute (ton descendant)
    stopListening: useCallback(() => {
      playTone(400, 0.15, 'sine')
    }, [playTone]),

    // Son de début de réponse (notification douce)
    startSpeaking: useCallback(() => {
      playTone(600, 0.1, 'triangle')
      setTimeout(() => playTone(700, 0.1, 'triangle'), 50)
    }, [playTone]),

    // Son de notification (double bip)
    notification: useCallback(() => {
      playTone(750, 0.1)
      setTimeout(() => playTone(750, 0.1), 150)
    }, [playTone]),

    // Son de succès (accord majeur)
    success: useCallback(() => {
      playTone(523, 0.15) // Do
      setTimeout(() => playTone(659, 0.15), 50) // Mi
      setTimeout(() => playTone(784, 0.2), 100) // Sol
    }, [playTone]),

    // Son de hover (ton très court et doux)
    hover: useCallback(() => {
      playTone(600, 0.05, 'sine')
    }, [playTone]),

    // Son de clic (clic sec)
    click: useCallback(() => {
      playTone(1200, 0.03, 'square')
    }, [playTone])
  }

  // Feedback haptique (si supporté)
  const hapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enabled || !navigator.vibrate) return

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }

    navigator.vibrate(patterns[pattern])
  }, [enabled])

  return {
    sounds,
    hapticFeedback,
    playTone,
    enabled
  }
} 