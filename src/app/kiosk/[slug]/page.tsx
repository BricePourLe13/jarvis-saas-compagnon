'use client'

import { useState, useEffect, useCallback, use } from 'react'
// 🔇 Nettoyage logs production automatique
import '@/lib/production-log-cleaner'
// Chakra UI remplacé par Tailwind CSS + composants custom
import { Box, VStack, HStack, Text, Badge, Spinner } from '@/components/kiosk/ChakraCompat'
import { motion, AnimatePresence } from 'framer-motion'
import VoiceInterface from '@/components/kiosk/VoiceInterface'
import MemberBadges from '@/components/kiosk/MemberBadges'
import JarvisAvatar from '@/components/common/JarvisAvatar'
// Removed BrowserPermissionsFallback - conflicts with MicrophoneManager
import { KioskValidationResponse, GymMember, MemberLookupResponse, KioskState, HardwareStatus, ExtendedKioskValidationResponse } from '@/types/kiosk'
import { useSoundEffects } from '@/hooks/useSoundEffects'
// 💓 Import du hook de heartbeat pour le statut temps réel
import { useKioskHeartbeat } from '@/hooks/useKioskHeartbeat'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import ModernFluidShapes from '@/components/common/ModernFluidShapes'
import MicrophoneDiagnostic from '@/components/kiosk/MicrophoneDiagnostic'
import { startMicrophoneMonitoring, stopMicrophoneMonitoring } from '@/lib/microphone-health-monitor'
import { kioskLogger } from '@/lib/kiosk-logger'
import { startPeriodicCleanup } from '@/lib/session-cleanup'

// ✅ PHASE 3: Browser Compatibility & Fallbacks
const getBrowserInfo = () => {
  if (typeof window === 'undefined') return null
  
  const userAgent = navigator.userAgent
  const browser = {
    isChrome: /Chrome/i.test(userAgent) && !/Edg/i.test(userAgent),
    isFirefox: /Firefox/i.test(userAgent),
    isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
    isEdge: /Edg/i.test(userAgent),
    isMobile: /Mobile|Android|iPhone|iPad/i.test(userAgent),
    supportsWebRTC: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
    supportsGetUserMedia: !!(navigator.mediaDevices?.getUserMedia),
    supportsPermissionsAPI: !!navigator.permissions,
    version: parseFloat(userAgent.match(/(?:Chrome|Firefox|Safari|Edg)\/(\d+\.\d+)/)?.[1] || '0'),
    hasKnownIssues: false
  }
  
  // Détection problèmes connus
  browser.hasKnownIssues = (
    (browser.isSafari && browser.version < 14) ||
    (browser.isFirefox && browser.version < 60) ||
    (browser.isChrome && browser.version < 70) ||
    browser.isMobile
  )
  
  return browser
}

const checkMicrophonePermissions = async () => {
  try {
    if (!navigator.permissions) {
      return { state: 'unknown', fallback: 'permissions_api_unavailable' }
    }
    
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return { 
      state: permission.state,
      fallback: permission.state === 'denied' ? 'user_denied' : null
    }
  } catch (error) {
    // Log supprimé pour production
    return { state: 'unknown', fallback: 'check_failed' }
  }
}

export default function KioskPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params)
  
  const [kioskData, setKioskData] = useState<ExtendedKioskValidationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [currentMember, setCurrentMember] = useState<GymMember | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  
  // États pour la progression de chargement
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStep, setLoadingStep] = useState('')
  const [sessionError, setSessionError] = useState<string | null>(null)

  // États pour warnings et timeouts adaptatifs
  const [sessionWarning, setSessionWarning] = useState<{ time: number; message: string } | null>(null)
  const [timeoutDuration, setTimeoutDuration] = useState(300000) // 5 min par défaut

  // États pour session pre-warming
  const [prewarmStatus, setPrewarmStatus] = useState<'idle' | 'warming' | 'ready' | 'error'>('idle')
  const [prewarmCache, setPrewarmCache] = useState<Record<string, any>>({})
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  // État pour gérer la fin de session en attente
  const [pendingSessionEnd, setPendingSessionEnd] = useState<'natural' | 'timeout' | 'error' | null>(null)

  const [kioskState, setKioskState] = useState<KioskState>({
    status: 'idle',
    currentMember: null,
    lastActivity: Date.now(),
    sessionDuration: 0,
    hardware: {
      rfid_reader: 'connected',
      microphone: 'available',
      speakers: 'available',
      network: 'online'
    },
    isOnline: true,
    audioEnabled: true,
    rfidEnabled: true
  })

  const { sounds, hapticFeedback } = useSoundEffects({ enabled: false, volume: 0.1 })

  // 💓 Heartbeat pour signaler que le kiosk est en ligne - OPTIMISÉ ⚡
  useKioskHeartbeat({
    kioskSlug: slug,
    enabled: !!kioskData?.kiosk?.id, // Activer seulement quand les données sont chargées
    interval: 10000 // ⚡ 10 secondes pour détection ultra-rapide
  })

  // 🎤 MONITORING MICROPHONE EN TEMPS RÉEL
  useEffect(() => {
    if (!kioskData?.kiosk?.id) return

    // Démarrer le monitoring microphone
    startMicrophoneMonitoring(kioskData.kiosk.id, slug)
    kioskLogger.system('🎤 Monitoring microphone démarré', 'info')

    // 🧹 Démarrer le nettoyage automatique des sessions orphelines
    const stopCleanup = startPeriodicCleanup(30) // Toutes les 30 minutes
    kioskLogger.system('🧹 Nettoyage automatique sessions démarré', 'info')

    // Nettoyer au démontage
    return () => {
      stopMicrophoneMonitoring()
      stopCleanup()
      kioskLogger.system('🎤 Monitoring microphone arrêté', 'info')
      kioskLogger.system('🧹 Nettoyage automatique sessions arrêté', 'info')
    }
  }, [kioskData?.kiosk?.id, slug])



  // 🎤 PRÉ-INITIALISATION MICROPHONE INTELLIGENTE
  // NOUVELLE APPROCHE: Test permissions sans créer de stream persistant
  useEffect(() => {
    if (!kioskData?.gym) return

    const initializeMicrophoneIntelligent = async () => {
      try {
        kioskLogger.system('🎤 Pré-initialisation microphone intelligente...', 'info')
        
        // 1. Vérifier support des APIs nécessaires
        if (!navigator.mediaDevices?.getUserMedia) {
          setKioskState(prev => ({ 
            ...prev, 
            hardware: { ...prev.hardware, microphone: 'unavailable' }
          }))
          kioskLogger.system('❌ getUserMedia non supporté', 'error')
          return
        }

        // 2. Vérifier permissions via Permissions API si disponible
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
            
            switch (permission.state) {
              case 'granted':
                kioskLogger.system('✅ Permissions microphone déjà accordées', 'success')
                break
              case 'denied':
                setKioskState(prev => ({ 
                  ...prev, 
                  hardware: { ...prev.hardware, microphone: 'permission_denied' }
                }))
                kioskLogger.system('❌ Permissions microphone refusées', 'error')
                return
              case 'prompt':
                kioskLogger.system('⚠️ Permissions microphone à demander', 'warning')
                break
            }
          } catch (permError) {
            kioskLogger.system('⚠️ Impossible de vérifier les permissions', 'warning')
          }
        }

        // 3. Test rapide du microphone (sans stream persistant)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000 
          } 
        })
        
        // 4. Fermer immédiatement pour éviter les conflits avec WebRTC
        stream.getTracks().forEach(track => track.stop())
        
        setKioskState(prev => ({ 
          ...prev, 
          hardware: { ...prev.hardware, microphone: 'available' }
        }))
        
        kioskLogger.system('✅ Microphone pré-initialisé avec succès', 'success')
        
      } catch (error: any) {
        let microphoneStatus: 'unavailable' | 'permission_denied' = 'unavailable'
        let logMessage = 'Erreur pré-initialisation microphone'
        
        switch (error.name) {
          case 'NotAllowedError':
            microphoneStatus = 'permission_denied'
            logMessage = 'Permissions microphone refusées'
            break
          case 'NotFoundError':
            logMessage = 'Aucun microphone détecté'
            break
          case 'NotReadableError':
            logMessage = 'Microphone déjà utilisé'
            break
          default:
            logMessage = `Erreur microphone: ${error.message}`
        }
        
        setKioskState(prev => ({ 
          ...prev, 
          hardware: { ...prev.hardware, microphone: microphoneStatus }
        }))
        
        kioskLogger.system(`⚠️ ${logMessage}`, 'warning')
      }
    }

    // Délai pour éviter les conflits avec le pre-warming des sessions
    const timer = setTimeout(initializeMicrophoneIntelligent, 3000)
    return () => clearTimeout(timer)
  }, [kioskData?.gym])

  // 🎯 [OPENAI REALTIME] Logs simplifiés et structurés directement

  // Système de pre-warming au démarrage de l'app
  useEffect(() => {
    if (!kioskData?.gym) return

    const prewarmSessions = async () => {
      try {
        setPrewarmStatus('warming')
        // Log supprimé pour production
        
        // 1. Pre-compiler l'endpoint
        const precompileStart = Date.now()
        await fetch('/api/voice/session', { 
          method: 'HEAD',
          cache: 'no-cache'
        }).catch(() => {}) // Ignore les erreurs, c'est juste pour précompiler
        
        const precompileTime = Date.now() - precompileStart
        // Log supprimé pour production
        
        // 2. Pre-warming microphone SUPPRIMÉ (conflit WebRTC)
        // ⚠️ Microphone sera initialisé dans VoiceInterface uniquement
        // Log supprimé pour production
        
        // 3. (DÉSACTIVÉ) Pré-création de session générique côté DB pour éviter les sessions fantômes
        // On garde uniquement le precompile HEAD pour réduire la latence sans polluer les métriques.
        
        setPrewarmStatus('ready')
        // Log supprimé pour production
        
      } catch (error) {
        // Log supprimé pour production
        setPrewarmStatus('error')
      }
    }

    // Délai avant pre-warming pour ne pas surcharger le démarrage
    const prewarmTimer = setTimeout(prewarmSessions, 2000)
    return () => clearTimeout(prewarmTimer)
  }, [kioskData?.gym, slug])

  // Renouvellement automatique des sessions pre-warmed désactivé (pas de session DB créée)
  useEffect(() => {
    return
  }, [prewarmStatus, prewarmCache, slug])

  // Fonction pour calculer timeout adaptatif selon le membre
  const calculateAdaptiveTimeout = useCallback((member: GymMember) => {
    const baseTimeout = 180000 // 3 minutes de base
    
    // Timeout selon le type de membership
    let multiplier = 1
    switch (member.membership_type?.toLowerCase()) {
      case 'elite':
      case 'premium':
        multiplier = 2 // 6 minutes pour les membres premium
        break
      case 'vip':
        multiplier = 2.5 // 7.5 minutes pour VIP
        break
      case 'basic':
      default:
        multiplier = 1 // 3 minutes pour basic
    }
    
    // Bonus pour les membres réguliers
    const totalVisits = member.total_visits || 0
    if (totalVisits > 100) {
      multiplier *= 1.2 // +20% pour les habitués
    }
    
    const finalTimeout = baseTimeout * multiplier
    // Log supprimé pour production
    
    return finalTimeout
  }, [])

  // Gestionnaire de warnings avant expiration
  const scheduleSessionWarnings = useCallback((duration: number) => {
    const warnings = [
      { timeOffset: 30000, message: "Session se termine dans 30 secondes" },
      { timeOffset: 10000, message: "Session se termine dans 10 secondes" }
    ]
    
    warnings.forEach(({ timeOffset, message }) => {
      const warningTime = duration - timeOffset
      if (warningTime > 0) {
        setTimeout(() => {
          setSessionWarning({
            time: timeOffset / 1000,
            message
          })
          
          // Auto-clear warning après 3 secondes
          setTimeout(() => setSessionWarning(null), 3000)
        }, warningTime)
      }
    })
  }, [])

  // Gestionnaire de scan RFID (réel ou simulé) - VERSION OPTIMISÉE AVEC PRE-WARMING
  const handleMemberScanned = useCallback(async (member: GymMember) => {
    // Log supprimé pour production
    
    hapticFeedback('medium')
    setSessionError(null)
    
    // Début du chargement RÉEL
    setSessionLoading(true)
    setCurrentMember(member)
    setLoadingProgress(0)
    setLoadingStep('Vérification du badge...')
    setKioskState(prev => ({
      ...prev,
      status: 'loading',
      currentMember: member,
      lastActivity: Date.now()
    }))

    try {
      // Mode optimisé si pre-warming disponible
      if (prewarmStatus === 'ready' && prewarmCache.generic_session) {
        // Log supprimé pour production
        
        setLoadingProgress(30)
        setLoadingStep('Utilisation session pré-chauffée...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setLoadingProgress(70)
        setLoadingStep('Personnalisation pour vous...')
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setLoadingProgress(100)
        setLoadingStep('JARVIS est prêt !')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Log supprimé pour production
      } else {
        // Mode classique (fallback)
        // Log supprimé pour production
        
        // Étape 1: Validation membre
        setLoadingProgress(15)
        setLoadingStep('Validation du membre...')
        await new Promise(resolve => setTimeout(resolve, 800))

        // Étape 2: Préparation
        setLoadingProgress(30)
        setLoadingStep('Préparation de JARVIS...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Étape 3: Connexion à JARVIS (déplacée dans VoiceInterface → useVoiceChat.connect())
        setLoadingProgress(45)
        setLoadingStep('Connexion à JARVIS...')

        // Étape 4: Initialisation audio
        setLoadingProgress(75)
        setLoadingStep('Initialisation des équipements...')
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Étape 5: Finalisation
        setLoadingProgress(95)
        setLoadingStep('JARVIS est prêt !')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Session RÉELLEMENT prête !
      setLoadingProgress(100)
      setSessionLoading(false)
      setKioskState(prev => ({ ...prev, status: 'authenticated' }))
      setVoiceActive(true)
      
      // Configurer timeout adaptatif et warnings
      const adaptiveTimeout = calculateAdaptiveTimeout(member)
      setTimeoutDuration(adaptiveTimeout)
      scheduleSessionWarnings(adaptiveTimeout)
      
      // Log supprimé pour production

      // ✅ Logging automatique via OpenAI Realtime - Plus de "Plan B" nécessaire

    } catch (error) {
      // Log supprimé pour production
      setSessionError(error instanceof Error ? error.message : 'Erreur inconnue')
      setSessionLoading(false)
      setCurrentMember(null)
      setKioskState(prev => ({ ...prev, status: 'idle' }))
    }
  }, [slug, hapticFeedback, prewarmStatus, prewarmCache, calculateAdaptiveTimeout, scheduleSessionWarnings])

  // Validation initiale du kiosk
  useEffect(() => {
    const validateKiosk = async () => {
      try {
        // 🔒 SÉCURITÉ: Vérifier le device token en localStorage
        const deviceToken = localStorage.getItem('jarvis_device_token')
        const kioskId = localStorage.getItem('jarvis_kiosk_id')
        
        if (!deviceToken || !kioskId) {
          // Pas de token → Afficher erreur 403 (pas de redirection pour ne pas exposer /setup)
          kioskLogger.system('❌ Device token manquant - Accès refusé', 'error')
          setError('Accès refusé : Cet écran n\'est pas autorisé à accéder à ce kiosk.')
          return
        }
        
        // Envoyer le token dans les headers pour validation côté serveur
        const response = await fetch(`/api/kiosk/${slug}`, {
          headers: {
            'X-Device-Token': deviceToken,
            'X-Kiosk-ID': kioskId,
          }
        })
        
        if (response.status === 401 || response.status === 403) {
          // Token invalide → Nettoyer localStorage et afficher erreur
          localStorage.removeItem('jarvis_device_token')
          localStorage.removeItem('jarvis_kiosk_id')
          kioskLogger.system('❌ Device token invalide - Accès refusé', 'error')
          setError('Accès refusé : Authentification invalide. Cet écran n\'est pas autorisé.')
          return
        }
        
        if (!response.ok) {
          throw new Error(`Kiosk non trouvé: ${response.status}`)
        }
        
        const data = await response.json()
        setKioskData(data)
        
        // Vérifier si le kiosk nécessite un provisioning
        // Provisioning check supprimé - géré par device_token via /setup
        
        // Log supprimé pour production
        
      } catch (err) {
        // Log supprimé pour production
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    validateKiosk()
  }, [slug])

  // Fonction pour terminer gracieusement la session (déclarée en premier)
  const gracefulSessionEnd = useCallback(async (reason: 'natural' | 'timeout' | 'error' = 'natural') => {
    // Log supprimé pour production
    
    // Message d'au revoir selon le contexte
    const goodbyeMessages = {
      natural: "Au revoir ! À bientôt dans votre salle !",
      timeout: "Session terminée. À bientôt !",
      error: "Session interrompue. Merci de votre visite !"
    }
    
    // Afficher message temporaire (plus long pour fin naturelle)
    const displayDuration = reason === 'natural' ? 4000 : 3000
    setSessionWarning({
      time: displayDuration / 1000,
      message: goodbyeMessages[reason]
    })
    
    // Nettoyer après le délai approprié
    setTimeout(() => {
      setCurrentMember(null)
      setVoiceActive(false)
      setSessionWarning(null)
      setSessionError(null)
      setKioskState(prev => ({ ...prev, status: 'idle' }))
      // 🔄 Point d'application: recharger la config si une nouvelle version a été publiée
      try {
        fetch(`/api/kiosk/${slug}`).then(() => {
          // Log supprimé pour production
        })
      } catch {}
    }, displayDuration)
  }, [])

  // Auto-reset adaptatif avec gestion d'erreurs
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    if (sessionError) {
      // Auto-reset après erreur (plus rapide)
      timeout = setTimeout(() => {
        gracefulSessionEnd('error')
      }, 15000) // 15 secondes après une erreur
    } else if (currentMember && !voiceActive && !sessionLoading) {
      // Reset adaptatif basé sur le membre
      const effectiveTimeout = timeoutDuration
      // Log supprimé pour production
      
      timeout = setTimeout(() => {
        // Log supprimé pour production
        const currentStatus = getJarvisStatus()
        if (currentStatus === 'speaking') {
          // Log supprimé pour production
          setPendingSessionEnd('timeout')
        } else {
          gracefulSessionEnd('timeout')
        }
      }, effectiveTimeout)
    }
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [currentMember, voiceActive, sessionLoading, sessionError, timeoutDuration, gracefulSessionEnd])

  // Surveillant pour fin de session en attente - attendre que JARVIS finisse de parler
  useEffect(() => {
    if (!pendingSessionEnd || !currentMember) return

    const jarvisStatus = getJarvisStatus()
    
    // Si JARVIS n'est plus en train de parler, on peut terminer la session
    if (jarvisStatus !== 'speaking') {
      // Log supprimé pour production
      gracefulSessionEnd(pendingSessionEnd)
      setPendingSessionEnd(null)
      return
    }

    // Timeout de sécurité : maximum 8 secondes d'attente
    const maxWaitTime = 8000
    const fallbackTimer = setTimeout(() => {
      // Log supprimé pour production
      gracefulSessionEnd(pendingSessionEnd)
      setPendingSessionEnd(null)
    }, maxWaitTime)

    return () => clearTimeout(fallbackTimer)
  }, [pendingSessionEnd, currentMember, kioskState.status, voiceActive, gracefulSessionEnd])

  // Fonction de retry pour les erreurs temporaires
  const retrySessionCreation = useCallback(async () => {
    if (!currentMember) return
    
    // Log supprimé pour production
    setSessionError(null)
    
    // Relancer le processus complet
    await handleMemberScanned(currentMember)
  }, [currentMember, handleMemberScanned])

  // 🎯 DÉTECTION "AU REVOIR" RÉACTIVÉE
  const detectExitIntent = useCallback((transcript: string) => {
    const exitKeywords = [
      /au\s*revoir/i,
      /merci\s+(beaucoup|bien|bcp)/i,
      /\b(salut|ciao|bye|adieu)\b/i,
      /bonne\s+(journée|journ[ée]e|soir[ée]e|nuit)/i,
      /à\s+(bientôt|bient[ôo]t|plus|tout\s+à\s+l'heure|demain)/i,
      /c['']\s*est\s+bon/i,
      /j['']\s*y\s+vais/i,
      /je\s+(pars|m['']\s*en\s+vais)/i
    ]
    return exitKeywords.some(regex => regex.test(transcript.toLowerCase()))
  }, [])

  // Callback pour analyser les transcriptions
  const handleTranscriptUpdate = useCallback((transcript: string, isFinal: boolean) => {
    // Log supprimé pour production
    
    if (isFinal && transcript.trim().length > 3) {
      // Détecter intention de départ sur transcription finale
      if (detectExitIntent(transcript)) {
        // Log supprimé pour production
        // Log supprimé pour production
        setPendingSessionEnd('natural')
        
        // Terminer la session après un délai pour laisser JARVIS répondre
        setTimeout(() => {
          setVoiceActive(false)
          setCurrentMember(null)
          setKioskState(prev => ({ ...prev, status: 'idle' }))
          setPendingSessionEnd(null)
        }, 3000)
      }
    }
  }, [detectExitIntent, voiceActive])




  // Statut pour JARVIS
  const getJarvisStatus = (): 'idle' | 'listening' | 'speaking' | 'thinking' => {
    if (voiceActive) {
      // Normaliser les états inconnus vers 'listening'
      const s = kioskState.status as any
      if (s === 'speaking' || s === 'listening' || s === 'idle') return s
      if (s === 'processing' || s === 'authenticated' || s === 'scanning') return 'thinking'
      return 'listening'
    }
    if (currentMember) return 'thinking'
    return 'idle'
  }

  // Message détaillé selon l'état avec progression
  const getStatusMessage = () => {
    if (sessionError) {
      return "Erreur technique"
    }
    if (sessionLoading && loadingStep) {
      return loadingStep
    }
    if (sessionLoading) {
      return "Initialisation en cours..."
    }
    if (currentMember && !voiceActive) {
      return `Bonjour ${currentMember.first_name} !`
    }
    if (voiceActive) {
      return "Je vous écoute..."
    }
    return "Présentez votre badge"
  }

  // Message d'erreur détaillé
  const getErrorMessage = () => {
    if (!sessionError) return null
    
    if (sessionError.includes('404')) {
      return "Service JARVIS temporairement indisponible"
    }
    if (sessionError.includes('500')) {
      return "Erreur serveur - Veuillez réessayer"
    }
    if (sessionError.includes('timeout')) {
      return "Connexion trop lente - Vérifiez le réseau"
    }
    return "Erreur technique - Contactez l'équipe"
  }

  // ✅ SOLUTION 3: Browser permissions fallback state
  // Removed showPermissionsFallback - handled by MicrophoneManager
  const [permissionError, setPermissionError] = useState<string | null>(null)
  // Provisioning géré via /setup (Device Flow)

  // ✅ Console interceptor automatiquement activé (logging via OpenAI Realtime)

  // ✅ Handle permission failures with fallback
  const handlePermissionFailure = useCallback((error: string) => {
    // Log supprimé pour production
    setPermissionError(error)
    
    // Permissions now handled by MicrophoneManager
  }, [])

  // Removed permission handlers - managed by MicrophoneManager

  // ✅ Enhanced error detection - trigger fallback for permission errors
  useEffect(() => {
    if (sessionError) {
      const errorLower = sessionError.toLowerCase()
      if (errorLower.includes('permission') || 
          errorLower.includes('microphone') || 
          errorLower.includes('notallowederror') ||
          errorLower.includes('blocked')) {
        handlePermissionFailure(sessionError)
      }
    }
  }, [sessionError, handlePermissionFailure])

  if (error) {
    return (
      <Box 
        h="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="linear-gradient(135deg, #0a0a0f 0%, #151520 50%, #0f0f1a 100%)"
        color="white"
      >
        <VStack spacing={6}>
          <Text fontSize="2xl" color="red.300" fontFamily="SF Pro Display, system-ui" fontWeight="300">
            Erreur Kiosk
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontFamily="SF Pro Display, system-ui" fontSize="lg">
            {error}
          </Text>
        </VStack>
      </Box>
    )
  }

  // Provisioning géré via /setup (Device Flow) - Plus besoin de ce composant

  if (!kioskData) {
    return (
      <Box 
        h="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="linear-gradient(135deg, #0a0a0f 0%, #151520 50%, #0f0f1a 100%)"
        color="white"
      >
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Text fontSize="xl" color="rgba(255,255,255,0.8)" fontFamily="SF Pro Display, system-ui" fontWeight="300">
            Initialisation...
          </Text>
        </motion.div>
      </Box>
    )
  }

  return (
    <>
      <Head>
        {/* ✅ SOLUTION 1: BigBlueButton Method - Allow Attributes */}
        <meta httpEquiv="Permissions-Policy" content="microphone=(self), camera=(self), display-capture=(self), autoplay=(self), encrypted-media=(self), fullscreen=(self), picture-in-picture=(self)" />
        <meta httpEquiv="Feature-Policy" content="microphone 'self'; camera 'self'; display-capture 'self'; autoplay 'self'; encrypted-media 'self'; fullscreen 'self'; picture-in-picture 'self'" />
        
        {/* ✅ Ensure secure context */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        
        {/* ✅ User Agent specific hints */}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </Head>
      
      <Box
        h="100vh"
        position="relative"
        overflow="hidden"
        bg="linear-gradient(135deg, var(--chakra-colors-gray-50) 0%, var(--chakra-colors-gray-200) 50%, var(--chakra-colors-gray-300) 100%)"
        fontFamily="SF Pro Display, -apple-system, system-ui"
        suppressHydrationWarning
        role="application"
        aria-label="Interface Jarvis Kiosk"
        data-permissions-context="kiosk-microphone"
      >
        {/* Shapes fluides comme sur la page de login */}
        <ModernFluidShapes />
        {/* 🌌 COSMOS NOIR OPTIMISÉ */}
        <Box
          position="absolute"
          inset="0"
          zIndex={1}
          opacity={0.8}
          display="none"
        >
          {/* 🌌 COUCHE ULTRA LOINTAINE - Voie lactée dense OPTIMISÉE */}
          <Box
            position="absolute"
            inset="0"
            opacity={0.15}
            style={{ willChange: 'transform' }}
          >
            {/* Fond galactique ultra-dense */}
            {Array.from({ length: 150 }, (_, i) => {
              const x = Math.random() * 100
              const y = Math.random() * 100
              const size = Math.random() * 0.4 + 0.1 // 0.1px à 0.5px
              const opacity = Math.random() * 0.2 + 0.05 // Très subtil
              
              return (
                <motion.div
                  key={`ultra-distant-star-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    background: `rgba(255, 255, 255, ${opacity})`,
                    willChange: 'transform, opacity'
                  }}
                  animate={{
                    opacity: [opacity * 0.5, opacity, opacity * 0.5],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 15 + (i * 0.01),
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )
            })}
          </Box>

          {/* 🌌 COUCHE ARRIÈRE-PLAN - Étoiles lointaines OPTIMISÉES */}
          <Box
            position="absolute"
            inset="0"
            opacity={0.25}
            style={{ willChange: 'transform' }}
          >
            {/* Amas d'étoiles lointaines - Voie lactée simulation */}
            {Array.from({ length: 120 }, (_, i) => {
              const x = Math.random() * 100
              const y = Math.random() * 100
              const size = Math.random() * 0.8 + 0.2 // 0.2px à 1px
              const opacity = Math.random() * 0.3 + 0.1
              const colors = [
                'rgba(255, 255, 255, ',
                'rgba(147, 197, 253, ',
                'rgba(196, 181, 253, '
              ]
              const color = colors[Math.floor(Math.random() * colors.length)]
              
              return (
                <motion.div
                  key={`distant-star-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    background: `${color}${opacity})`,
                    boxShadow: `0 0 ${size * 2}px ${color}${opacity * 0.4})`,
                    willChange: 'transform, opacity'
                  }}
                  animate={{
                    opacity: [opacity * 0.7, opacity, opacity * 0.7],
                    scale: [0.9, 1.1, 0.9]
                  }}
                  transition={{
                    duration: 12 + (i * 0.03),
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )
            })}
          </Box>

          {/* 🌌 COUCHE INTERMÉDIAIRE - Amas stellaires OPTIMISÉS */}
          <Box
            position="absolute"
            inset="0"
            opacity={0.4}
            style={{ willChange: 'transform' }}
          >
            {/* Amas stellaires concentrés - OPTIMISÉS */}
            {[
              { cx: 20, cy: 30, count: 15, spread: 8 },
              { cx: 80, cy: 20, count: 12, spread: 6 },
              { cx: 15, cy: 70, count: 13, spread: 7 },
              { cx: 90, cy: 85, count: 14, spread: 8 },
              { cx: 60, cy: 10, count: 10, spread: 5 },
              { cx: 35, cy: 90, count: 13, spread: 7 }
            ].map((cluster, clusterIndex) => 
              Array.from({ length: cluster.count }, (_, i) => {
                const angle = (Math.random() * Math.PI * 2)
                const distance = Math.random() * cluster.spread
                const x = cluster.cx + (Math.cos(angle) * distance)
                const y = cluster.cy + (Math.sin(angle) * distance)
                const size = Math.random() * 1.2 + 0.6 // 0.6px à 1.8px
                const brightness = Math.random() * 0.5 + 0.2
                const colors = [
                  'rgba(255, 255, 255, ',
                  'rgba(59, 130, 246, ',
                  'rgba(147, 51, 234, '
                ]
                const color = colors[Math.floor(Math.random() * colors.length)]
                
                return (
                  <motion.div
                    key={`cluster-${clusterIndex}-star-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: '50%',
                      background: `${color}${brightness})`,
                      boxShadow: `0 0 ${size * 3}px ${color}${brightness * 0.5})`,
                      willChange: 'transform, opacity'
                    }}
                    animate={{
                      opacity: [brightness * 0.6, brightness, brightness * 0.6],
                      scale: [0.9, 1.2, 0.9]
                    }}
                    transition={{
                      duration: 8 + (i * 0.15),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )
              })
            )}
          </Box>

          {/* 🌌 NÉBULEUSES SOMBRES OPTIMISÉES */}
          
          {/* Nébuleuse violette principale */}
          <motion.div
            style={{
              position: 'absolute',
              top: '10%',
              left: '0%',
              width: '50%',
              height: '40%',
              background: `
                radial-gradient(ellipse 70% 50% at 30% 40%, 
                  rgba(147, 51, 234, 0.08) 0%,
                  rgba(139, 92, 246, 0.06) 35%,
                  rgba(59, 130, 246, 0.04) 65%,
                  transparent 85%
                )
              `,
              filter: 'blur(40px)',
              borderRadius: '50%',
              willChange: 'transform'
            }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Nébuleuse bleue secondaire */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              right: '0%',
              width: '45%',
              height: '35%',
              background: `
                radial-gradient(ellipse 65% 70% at 60% 50%, 
                  rgba(6, 182, 212, 0.06) 0%,
                  rgba(59, 130, 246, 0.04) 50%,
                  transparent 75%
                )
              `,
              filter: 'blur(35px)',
              borderRadius: '60%',
              willChange: 'transform'
            }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Nébuleuse verte subtile */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '30%',
              width: '40%',
              height: '25%',
              background: `
                radial-gradient(ellipse 75% 55% at 50% 60%, 
                  rgba(34, 197, 94, 0.05) 0%,
                  rgba(59, 130, 246, 0.03) 60%,
                  transparent 80%
                )
              `,
              filter: 'blur(30px)',
              borderRadius: '70%',
              willChange: 'transform'
            }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* 🌟 ÉTOILES FILANTES OPTIMISÉES */}
          {Array.from({ length: 2 }, (_, i) => (
            <motion.div
              key={`shooting-star-${i}`}
              style={{
                position: 'absolute',
                top: `${Math.random() * 30 + 20}%`,
                left: '-5%',
                width: '100px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                borderRadius: '1px',
                filter: 'blur(0.5px)',
                willChange: 'transform'
              }}
              initial={{ x: -120, opacity: 0 }}
              animate={{
                x: typeof window !== 'undefined' ? window.innerWidth + 120 : 1920,
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3,
                delay: i * 20 + Math.random() * 15,
                repeat: Infinity,
                repeatDelay: 45 + Math.random() * 30,
                ease: "easeOut"
              }}
            />
          ))}

          {/* 🌌 PARTICULES COSMIQUES RÉDUITES */}
          {Array.from({ length: 8 }, (_, i) => {
            const colors = [
              { bg: 'rgba(59, 130, 246, 0.6)', glow: 'rgba(59, 130, 246, 0.4)' },
              { bg: 'rgba(147, 51, 234, 0.6)', glow: 'rgba(147, 51, 234, 0.4)' },
              { bg: 'rgba(255, 255, 255, 0.4)', glow: 'rgba(255, 255, 255, 0.2)' }
            ]
            const color = colors[i % colors.length]
            const size = Math.random() * 2 + 1
            return (
              <motion.div
                key={`cosmic-particle-${i}`}
                style={{
                  position: 'absolute',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: color.bg,
                  boxShadow: `0 0 ${size * 6}px ${color.glow}`,
                  zIndex: 2,
                  willChange: 'transform, opacity'
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 10, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.7, 1.2, 0.7]
                }}
                transition={{
                  duration: 15 + (i * 1.5),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )
          })}

          {/* 🌌 COUCHE AVANT-PLAN - Étoiles principales OPTIMISÉES */}
          <Box
            position="absolute"
            inset="0"
            zIndex={3}
            style={{ willChange: 'transform' }}
          >
            {/* Étoiles principales épurées */}
            {[
              { left: '15%', top: '25%', color: 'rgba(255, 255, 255, 0.9)', size: 3.5 },
              { left: '75%', top: '20%', color: 'rgba(147, 197, 253, 0.8)', size: 3 },
              { left: '85%', top: '70%', color: 'rgba(255, 255, 255, 0.85)', size: 3.5 },
              { left: '25%', top: '75%', color: 'rgba(196, 181, 253, 0.8)', size: 3 },
              { left: '55%', top: '15%', color: 'rgba(255, 255, 255, 0.9)', size: 3.5 },
              { left: '10%', top: '60%', color: 'rgba(167, 243, 208, 0.8)', size: 3 }
            ].map((star, i) => (
              <motion.div
                key={`main-star-${i}`}
                style={{
                  position: 'absolute',
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  borderRadius: '50%',
                  background: star.color,
                  boxShadow: `
                    0 0 ${star.size * 4}px ${star.color},
                    0 0 ${star.size * 8}px ${star.color.replace('1)', '0.3)')},
                    0 0 ${star.size * 12}px ${star.color.replace('1)', '0.1)')}
                  `,
                  willChange: 'transform, opacity'
                }}
                animate={{
                  opacity: [0.8, 1, 0.8],
                  scale: [0.9, 1.2, 0.9]
                }}
                transition={{
                  duration: 6 + (i * 0.5),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Étoiles moyennes colorées RÉDUITES */}
            {[
              { left: '40%', top: '35%', color: 'rgba(34, 197, 94, 0.7)', size: 2 },
              { left: '65%', top: '65%', color: 'rgba(251, 146, 60, 0.7)', size: 1.8 },
              { left: '30%', top: '50%', color: 'rgba(59, 130, 246, 0.7)', size: 2 },
              { left: '80%', top: '45%', color: 'rgba(168, 85, 247, 0.7)', size: 1.8 },
              { left: '20%', top: '40%', color: 'rgba(255, 255, 255, 0.6)', size: 1.5 },
              { left: '70%', top: '30%', color: 'rgba(6, 182, 212, 0.7)', size: 2 }
            ].map((star, i) => (
              <motion.div
                key={`colored-star-${i}`}
                style={{
                  position: 'absolute',
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  borderRadius: '50%',
                  background: star.color,
                  boxShadow: `
                    0 0 ${star.size * 6}px ${star.color},
                    0 0 ${star.size * 12}px ${star.color.replace('0.7)', '0.2)')}
                  `,
                  willChange: 'transform, opacity'
                }}
                animate={{
                  opacity: [0.6, 0.9, 0.6],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 8 + (i * 0.4),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </Box>
        </Box>

        {/* 🎭 LAYOUT CENTRÉ & ÉPURÉ */}
        <div
          className="h-screen flex flex-col items-center justify-center relative z-10 pb-20"
        >
          {/* 🏢 INFOS GYM (Haut discret) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full pointer-events-none"
          >
            <p 
              className="text-lg text-gray-800 font-semibold tracking-widest uppercase"
            >
              {kioskData.gym.name}
            </p>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 bg-gray-800/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <div
                className={`w-1.5 h-1.5 rounded-full ${voiceActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-500"}`}
              />
              <span className="text-xs text-gray-700 font-medium">
                {voiceActive ? "EN ÉCOUTE" : "DISPONIBLE"}
              </span>
            </div>

            {/* Prewarm status */}
            {prewarmStatus === 'warming' && (
               <span className="text-xs text-purple-400">Connexion IA...</span>
            )}
          </motion.div>


          {/* 🤖 AVATAR CENTRAL (Cœur de l'interface) */}
          <div className="relative mb-12">
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 520,
                height: 520,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0) 70%)',
                filter: 'blur(20px)',
                pointerEvents: 'none'
              }}
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <JarvisAvatar
              size={420}
              showText={false}
              variant="default"
              status={getJarvisStatus()}
              eyeScale={1}
            />
          </div>


          {/* 💬 MESSAGES & INSTRUCTIONS (Sous l'avatar) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={getStatusMessage()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center" // Centrer le conteneur
            >
              <div className="flex flex-col gap-6 items-center text-center max-w-[600px]">
                
                {/* Message Principal */}
                <div className="flex items-center gap-3 justify-center">
                  {sessionLoading && (
                    <Spinner size="sm" />
                  )}
                  <Text 
                    className="text-3xl font-light tracking-wide leading-tight text-center text-gray-900"
                  >
                    {getStatusMessage()}
                  </Text>
                </div>

                {/* Barre de progression (si loading) */}
                {sessionLoading && !sessionError && (
                  <div className="flex flex-col gap-2 w-[240px]">
                    <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <Text className="text-xs text-gray-600">Initialisation...</Text>
                  </div>
                )}

                {/* Instructions contextuelles */}
                <AnimatePresence>
                  {voiceActive && !sessionLoading && !sessionError && !pendingSessionEnd && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div
                        className="px-6 py-3 bg-gray-100/80 border border-gray-300 rounded-full backdrop-blur-md"
                      >
                        <Text className="text-sm text-gray-700">
                          Dites <strong style={{color: '#1f2937'}}>Au revoir</strong> pour terminer
                        </Text>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Warning d'expiration */}
                {sessionWarning && !sessionError && !sessionLoading && !pendingSessionEnd && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="px-5 py-2 bg-orange-500/20 rounded-full border border-orange-500/40">
                      <Text className="text-sm text-orange-200">⏰ {sessionWarning.message}</Text>
                    </div>
                  </motion.div>
                )}

                {/* Bouton Retry si erreur */}
                {sessionError && (
                  <Button 
                    onClick={retrySessionCreation}
                    variant="outline" 
                    className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 mt-4"
                  >
                    🔄 Réessayer
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interface vocale cachée (logique only) */}
          <div className="hidden">
            <VoiceInterface
              gymSlug={slug}
              currentMember={currentMember}
              isActive={voiceActive}
              onActivate={() => {
                console.log('🔄 [KIOSK] Activation manuelle')
                setVoiceActive(true)
              }}
              onDeactivate={() => {
                console.log('🔄 [KIOSK] Déactivation session')
                setVoiceActive(false)
                setCurrentMember(null)
                setSessionError(null)
                setSessionLoading(false)
                setKioskState(prev => ({ ...prev, status: 'idle' }))
              }}
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          </div>

          {/* 🏷️ MEMBER BADGES - Adhérents cliquables en bas */}
          <MemberBadges
            gymSlug={slug}
            onMemberScanned={handleMemberScanned}
          isActive={voiceActive}
        />
      </div>
    </Box>
    </>
  )
}