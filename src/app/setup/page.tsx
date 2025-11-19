'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import JarvisAvatar from '@/components/common/JarvisAvatar'

/**
 * 🖥️ PAGE: /setup
 * 
 * Interface d'appairage pour les nouveaux écrans (miroirs digitaux).
 * 
 * Flow:
 * 1. L'écran génère un code unique (ex: 123-456)
 * 2. Le gérant entre ce code dans son Dashboard
 * 3. L'écran poll toutes les 3s pour savoir s'il a été activé
 * 4. Quand activé → Enregistre le token device en localStorage et redirige vers /kiosk
 */

interface KioskConfig {
  id: string
  slug: string
  name: string
  device_token: string
  gym: {
    id: string
    name: string
    city: string
  }
}

export default function SetupPage() {
  const [code, setCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'waiting' | 'paired' | 'expired' | 'error'>('loading')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [kioskConfig, setKioskConfig] = useState<KioskConfig | null>(null)
  const [countdown, setCountdown] = useState<number>(15 * 60) // 15 minutes en secondes

  // Générer le code au chargement
  useEffect(() => {
    generateCode()
  }, [])

  // Polling du statut toutes les 3 secondes
  useEffect(() => {
    if (!code || status !== 'waiting') return

    const interval = setInterval(() => {
      checkStatus()
    }, 3000) // Poll toutes les 3s

    return () => clearInterval(interval)
  }, [code, status])

  // Countdown timer
  useEffect(() => {
    if (status !== 'waiting' || countdown <= 0) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, countdown])

  async function generateCode() {
    try {
      setStatus('loading')
      
      const res = await fetch('/api/device/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_fingerprint: {
            userAgent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString(),
          }
        })
      })

      if (!res.ok) {
        throw new Error('Échec génération code')
      }

      const data = await res.json()
      setCode(data.code)
      setExpiresAt(data.expires_at)
      setStatus('waiting')

    } catch (error) {
      console.error('Erreur génération code:', error)
      setStatus('error')
    }
  }

  async function checkStatus() {
    if (!code) return

    try {
      const res = await fetch(`/api/device/check-status/${code}`)
      const data = await res.json()

      if (data.status === 'paired' && data.kiosk) {
        setKioskConfig(data.kiosk)
        setStatus('paired')

        // Enregistrer le token device en localStorage
        localStorage.setItem('jarvis_device_token', data.kiosk.device_token)
        localStorage.setItem('jarvis_kiosk_id', data.kiosk.id)

        // Rediriger vers l'interface kiosk après 2 secondes
        setTimeout(() => {
          window.location.href = `/kiosk/${data.kiosk.slug}`
        }, 2000)
      } else if (data.status === 'expired') {
        setStatus('expired')
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <div className="max-w-2xl w-full">
        
        {/* Header avec Logo JARVIS */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo_jarvis.png"
              alt="JARVIS Logo"
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Configuration JARVIS
          </h1>
          <p className="text-gray-600">
            Appareillez cet écran avec votre salle de sport
          </p>
        </div>

        {/* Card principale */}
        <Card className="p-12 shadow-lg">
          
          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center space-y-6">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <p className="text-lg text-gray-600">Génération du code...</p>
            </div>
          )}

          {/* Waiting for pairing */}
          {status === 'waiting' && (
            <div className="text-center space-y-8">
              
              {/* Code d'appairage */}
              <div>
                <p className="text-sm text-gray-600 mb-3 uppercase tracking-wide">
                  Code d'appairage
                </p>
                <div className="inline-flex items-center justify-center bg-primary/5 border-2 border-primary rounded-2xl px-12 py-8">
                  <span className="text-7xl font-mono font-bold text-primary tracking-widest">
                    {code}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 max-w-md mx-auto">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <p className="text-gray-700">
                    Connectez-vous à votre <strong>Dashboard JARVIS</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <p className="text-gray-700">
                    Allez dans <strong>Kiosks</strong> → <strong>Nouvel écran</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <p className="text-gray-700">
                    Entrez le code <strong>{code}</strong>
                  </p>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  En attente... (expire dans <strong>{formatTime(countdown)}</strong>)
                </span>
              </div>

            </div>
          )}

          {/* Paired successfully */}
          {status === 'paired' && kioskConfig && (
            <div className="text-center space-y-6">
              <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  ✅ Écran activé !
                </h2>
                <p className="text-gray-600 mb-4">
                  Cet écran est maintenant connecté à :
                </p>
                <div className="inline-flex flex-col gap-1 bg-green-50 border border-green-200 rounded-lg px-6 py-4">
                  <p className="text-xl font-bold text-green-900">
                    {kioskConfig.gym.name}
                  </p>
                  <p className="text-sm text-green-700">
                    {kioskConfig.gym.city}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">⏱️</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Code expiré
                </h2>
                <p className="text-gray-600 mb-6">
                  Le code d'appairage a expiré après 15 minutes d'inactivité.
                </p>
                <Button onClick={generateCode} size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Générer un nouveau code
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Erreur
                </h2>
                <p className="text-gray-600 mb-6">
                  Impossible de générer un code. Vérifiez votre connexion internet.
                </p>
                <Button onClick={generateCode} variant="outline" size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          )}

        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Besoin d'aide ? Contactez votre gérant de salle</p>
        </div>

      </div>
    </div>
  )
}

