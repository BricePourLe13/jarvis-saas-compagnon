'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

export default function MFAChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClientWithConfig()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        router.push('/')
        return 
      }

      // Récupérer le premier facteur TOTP
      // @ts-ignore
      const list = await (supabase.auth as any).mfa?.listFactors?.()
      const totp = list?.data?.totp?.[0]
      
      if (!totp) { 
        setError('Aucun facteur TOTP configuré. Activez d\'abord la 2FA.')
        return 
      }
      
      setFactorId(totp.id || totp.factorId)
    }
    init()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Veuillez entrer le code')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const supabase = createBrowserClientWithConfig()
      
      if (!factorId) { 
        setError('Facteur d\'authentification introuvable')
        setLoading(false)
        return 
      }

      // @ts-ignore
      const challenge = await (supabase.auth as any).mfa?.challenge({ factorId })
      const challengeId = challenge?.data?.id

      if (!challengeId || challenge?.error) { 
        setError('Impossible de générer le challenge d\'authentification')
        setLoading(false)
        return 
      }

      // @ts-ignore
      const verify = await (supabase.auth as any).mfa?.verify({ 
        factorId, 
        challengeId, 
        code: code.trim() 
      })

      if (verify?.error) { 
        setError('Code invalide. Veuillez réessayer.')
        setLoading(false)
        return 
      }

      // Redirection vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo_jarvis.png"
              alt="JARVIS Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vérification 2FA</h1>
          <p className="text-gray-600">
            Entrez le code à 6 chiffres de votre application d'authentification
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="code" className="text-gray-700 font-medium">
              Code 2FA
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="mt-2 text-center text-2xl font-mono tracking-wider"
              disabled={loading || !factorId}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-lg"
            disabled={loading || !factorId || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Vérification...
              </>
            ) : (
              'Valider le code'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
            disabled={loading}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  )
}
