'use client'

import { useState } from 'react'
import { Shield, Key, Smartphone, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface SecuritySettingsProps {
  userId: string
  userRole: 'super_admin' | 'gym_manager'
}

export default function SecuritySettings({ userId, userRole }: SecuritySettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      if (!res.ok) throw new Error()

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été changé avec succès.',
      })
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de changer le mot de passe.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Authentification 2FA */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Authentification à deux facteurs (2FA)
            </h3>
            <p className="text-sm text-muted-foreground">
              Sécurisez votre compte avec une authentification TOTP
            </p>
          </div>
          <Badge variant={userRole === 'super_admin' ? 'default' : 'secondary'}>
            {userRole === 'super_admin' ? 'Obligatoire' : 'Recommandé'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-md">
          <div>
            <p className="text-sm font-medium">Statut 2FA</p>
            <p className="text-xs text-muted-foreground">
              Configuration depuis la page de connexion
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/auth/setup'}>
            Configurer 2FA
          </Button>
        </div>
      </div>

      {/* Changement mot de passe */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Mot de passe
          </h3>
          <p className="text-sm text-muted-foreground">
            Modifiez votre mot de passe
          </p>
        </div>

        {!showPasswordForm ? (
          <Button onClick={() => setShowPasswordForm(true)}>
            Changer le mot de passe
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Modification...' : 'Confirmer'}
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordForm(false)} disabled={loading}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions actives */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sessions actives
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos sessions connectées
          </p>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            📋 Feature à implémenter : Liste des devices/IPs connectés
          </p>
        </div>
      </div>

      {/* Zone danger */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zone danger
          </h3>
          <p className="text-sm text-red-700">
            Actions irréversibles
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
            Télécharger mes données (RGPD)
          </Button>
        </div>
      </div>
    </div>
  )
}

