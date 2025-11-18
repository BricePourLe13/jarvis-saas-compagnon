'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface InvitationData {
  email: string
  full_name: string
  gym_name: string
  gym_city: string
  expires_at: string
}

export default function InvitationPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Vérifier le token au chargement
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/invitation/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invitation invalide ou expirée')
          return
        }

        setInvitation(data.invitation)
      } catch (err) {
        setError('Erreur lors de la vérification de l\'invitation')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      verifyToken()
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/auth/invitation/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte')
      }

      setSuccess(true)

      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        router.push('/login?invitation=success')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation invalide</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-white transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte créé !</h1>
            <p className="text-gray-600 mb-6">
              Redirection vers la page de connexion...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Bienvenue sur JARVIS</h1>
          <p className="text-gray-600">Créez votre compte gérant</p>
        </div>

        {/* Invitation Info */}
        {invitation && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Vous avez été invité(e) pour gérer :</p>
            <p className="text-lg font-semibold text-gray-900">{invitation.gym_name}</p>
            <p className="text-sm text-gray-600">{invitation.gym_city}</p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>Email :</strong> {invitation.email}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Nom :</strong> {invitation.full_name}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Création du compte...
              </>
            ) : (
              'Créer mon compte gérant'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          En créant votre compte, vous acceptez les conditions d'utilisation de JARVIS.
        </p>
      </div>
    </div>
  )
}




