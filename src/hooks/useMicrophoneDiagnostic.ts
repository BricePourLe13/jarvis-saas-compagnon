import { useState, useCallback } from 'react'
import { testMicrophoneRealtime, checkMicrophoneHealth } from '@/lib/microphone-health-monitor'

interface DiagnosticResult {
  permissions: {
    status: 'success' | 'error' | 'warning'
    message: string
    details?: string
  }
  microphone: {
    status: 'success' | 'error' | 'warning'
    message: string
    details?: string
  }
  webrtc: {
    status: 'success' | 'error' | 'warning'
    message: string
    details?: string
  }
  openai: {
    status: 'success' | 'error' | 'warning'
    message: string
    details?: string
  }
  overall: 'success' | 'warning' | 'error'
  recommendations?: string[]
}

interface UseMicrophoneDiagnosticReturn {
  isRunning: boolean
  result: DiagnosticResult | null
  error: string | null
  runDiagnostic: () => Promise<void>
  runQuickTest: () => Promise<boolean>
  checkHealth: (gymId: string, kioskSlug: string) => Promise<void>
}

export function useMicrophoneDiagnostic(): UseMicrophoneDiagnosticReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Test rapide du microphone (sans diagnostic complet)
  const runQuickTest = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const metrics = await testMicrophoneRealtime()
      return metrics.isActive && metrics.level > 10
    } catch (error: any) {
      setError(error.message)
      return false
    }
  }, [])

  // Diagnostic complet
  const runDiagnostic = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      // Test des permissions
      const permissionsResult = await testPermissions()
      
      // Test du microphone
      const microphoneResult = await testMicrophone()
      
      // Test WebRTC
      const webrtcResult = await testWebRTC()
      
      // Test OpenAI
      const openaiResult = await testOpenAI()

      // Analyser le résultat global
      const hasErrors = [permissionsResult, microphoneResult, webrtcResult, openaiResult]
        .some(r => r.status === 'error')
      const hasWarnings = [permissionsResult, microphoneResult, webrtcResult, openaiResult]
        .some(r => r.status === 'warning')

      let overall: 'success' | 'warning' | 'error' = 'success'
      if (hasErrors) overall = 'error'
      else if (hasWarnings) overall = 'warning'

      // Générer des recommandations
      const recommendations: string[] = []
      if (permissionsResult.status === 'error') {
        recommendations.push('Autorisez l\'accès au microphone dans les paramètres du navigateur')
      }
      if (microphoneResult.status === 'error') {
        recommendations.push('Vérifiez que le microphone est branché et fonctionnel')
      }
      if (webrtcResult.status === 'error') {
        recommendations.push('Utilisez un navigateur récent (Chrome, Firefox, Safari)')
      }
      if (openaiResult.status === 'error') {
        recommendations.push('Vérifiez la connexion internet et réessayez')
      }

      const finalResult: DiagnosticResult = {
        permissions: permissionsResult,
        microphone: microphoneResult,
        webrtc: webrtcResult,
        openai: openaiResult,
        overall,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      }

      setResult(finalResult)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsRunning(false)
    }
  }, [])

  // Vérifier la santé via le monitoring
  const checkHealth = useCallback(async (gymId: string, kioskSlug: string) => {
    try {
      setError(null)
      const healthResult = await checkMicrophoneHealth(gymId, kioskSlug)
      
      // Convertir le résultat de santé en format diagnostic
      const diagnosticResult: DiagnosticResult = {
        permissions: { status: 'success', message: 'Non testé' },
        microphone: {
          status: healthResult.status === 'healthy' ? 'success' : 
                   healthResult.status === 'warning' ? 'warning' : 'error',
          message: `Score: ${healthResult.score}/100`,
          details: healthResult.issues.join(', ')
        },
        webrtc: { status: 'success', message: 'Non testé' },
        openai: { status: 'success', message: 'Non testé' },
        overall: healthResult.status === 'healthy' ? 'success' : 
                 healthResult.status === 'warning' ? 'warning' : 'error',
        recommendations: healthResult.recommendations
      }

      setResult(diagnosticResult)

    } catch (error: any) {
      setError(error.message)
    }
  }, [])

  return {
    isRunning,
    result,
    error,
    runDiagnostic,
    runQuickTest,
    checkHealth
  }
}

// Fonctions de test individuelles
async function testPermissions() {
  try {
    if (!navigator.permissions) {
      return {
        status: 'warning' as const,
        message: 'API Permissions non disponible',
        details: 'Navigateur ancien - test direct du microphone'
      }
    }

    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    
    switch (permission.state) {
      case 'granted':
        return {
          status: 'success' as const,
          message: 'Permissions accordées'
        }
      case 'denied':
        return {
          status: 'error' as const,
          message: 'Permissions refusées',
          details: 'Cliquez sur l\'icône cadenas dans la barre d\'adresse pour autoriser'
        }
      case 'prompt':
        return {
          status: 'warning' as const,
          message: 'Permissions à demander',
          details: 'Le navigateur demandera l\'autorisation'
        }
      default:
        return {
          status: 'warning' as const,
          message: 'État inconnu'
        }
    }
  } catch (error: any) {
    return {
      status: 'error' as const,
      message: 'Erreur de vérification',
      details: error.message
    }
  }
}

async function testMicrophone() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        status: 'error' as const,
        message: 'getUserMedia non supporté',
        details: 'Navigateur incompatible ou connexion non sécurisée'
      }
    }

    const metrics = await testMicrophoneRealtime()

    if (metrics.isActive && metrics.level > 10) {
      return {
        status: 'success' as const,
        message: `Microphone actif (niveau: ${metrics.level}, qualité: ${metrics.quality})`
      }
    } else if (metrics.isActive) {
      return {
        status: 'warning' as const,
        message: 'Microphone silencieux',
        details: 'Vérifiez que le microphone n\'est pas coupé'
      }
    } else {
      return {
        status: 'error' as const,
        message: 'Microphone inaccessible',
        details: 'Vérifiez les permissions et le matériel'
      }
    }

  } catch (error: any) {
    let message = 'Erreur microphone'
    let details = error.message

    switch (error.name || error.message) {
      case 'NotAllowedError':
        message = 'Permissions refusées'
        details = 'Autorisez l\'accès au microphone et rechargez'
        break
      case 'NotFoundError':
        message = 'Microphone introuvable'
        details = 'Branchez un microphone et rechargez'
        break
      case 'NotReadableError':
        message = 'Microphone occupé'
        details = 'Fermez les autres applications utilisant le micro'
        break
    }

    return {
      status: 'error' as const,
      message,
      details
    }
  }
}

async function testWebRTC() {
  try {
    if (!window.RTCPeerConnection) {
      return {
        status: 'error' as const,
        message: 'WebRTC non supporté',
        details: 'Navigateur incompatible'
      }
    }

    // Test création PeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // Test data channel
    const dc = pc.createDataChannel('test')
    
    pc.close()

    return {
      status: 'success' as const,
      message: 'WebRTC fonctionnel'
    }

  } catch (error: any) {
    return {
      status: 'error' as const,
      message: 'Erreur WebRTC',
      details: error.message
    }
  }
}

async function testOpenAI() {
  try {
    const response = await fetch('/api/voice/session', {
      method: 'HEAD',
      cache: 'no-cache'
    })

    if (response.ok) {
      return {
        status: 'success' as const,
        message: 'API accessible'
      }
    } else {
      return {
        status: 'error' as const,
        message: `Erreur API (${response.status})`,
        details: 'Problème serveur ou configuration'
      }
    }
  } catch (error: any) {
    return {
      status: 'error' as const,
      message: 'Connexion échouée',
      details: error.message
    }
  }
}

