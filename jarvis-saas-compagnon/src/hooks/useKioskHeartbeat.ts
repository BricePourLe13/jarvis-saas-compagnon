import { useEffect, useRef } from 'react'

interface UseKioskHeartbeatProps {
  gymId: string
  kioskSlug: string
  enabled?: boolean
  interval?: number // en millisecondes
}

export function useKioskHeartbeat({ 
  gymId, 
  kioskSlug, 
  enabled = true, 
  interval = 30000 // 30 secondes par défaut
}: UseKioskHeartbeatProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)
  const lastKnownConfigVersionRef = useRef<number>(0)

  const sendHeartbeat = async () => {
    try {
      const response = await fetch('/api/kiosk/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gymId,
          kioskSlug,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        // Warning supprimé pour production
      }
      // ⚡ Logs réduits pour éviter le spam (succès en mode silencieux)
    } catch (error) {
      // Warning supprimé pour production
    }
  }

  // Vérifier périodiquement la version de configuration et appliquer entre sessions
  const checkConfigVersion = async () => {
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}`)
      if (!res.ok) return
      const json = await res.json()
      const version = Number((json?.data?.kiosk_config?.config_version) || 0)
      if (version > lastKnownConfigVersionRef.current) {
        lastKnownConfigVersionRef.current = version
        // Log supprimé pour production
        // Ici on pourrait déclencher un callback global (ex: event bus) pour recharger config quand idle
      }
    } catch (e) {
      // silencieux
    }
  }

  // Gérer la visibilité de la page
  const handleVisibilityChange = () => {
    isActiveRef.current = !document.hidden
    
    if (document.hidden) {
      // Log supprimé pour production
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      // Log supprimé pour production
      startHeartbeat()
    }
  }

  const startHeartbeat = () => {
    if (!enabled || !gymId || !kioskSlug) return

    // Envoyer immédiatement un heartbeat
    sendHeartbeat()

    // Puis envoyer régulièrement
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && !document.hidden) {
        sendHeartbeat()
        // Check config toutes les 60 secondes environ
        if (Math.random() < (interval >= 60000 ? 1 : interval / 60000)) {
          checkConfigVersion()
        }
      }
    }, interval)
  }

  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Démarrer le heartbeat
    startHeartbeat()

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Gérer la fermeture de la page
    const handleBeforeUnload = () => {
      // Optionnel : envoyer un signal de déconnexion
      navigator.sendBeacon('/api/kiosk/heartbeat', JSON.stringify({
        gymId,
        kioskSlug,
        status: 'offline',
        timestamp: new Date().toISOString()
      }))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      stopHeartbeat()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [gymId, kioskSlug, enabled, interval])

  return {
    sendHeartbeat,
    startHeartbeat,
    stopHeartbeat
  }
} 