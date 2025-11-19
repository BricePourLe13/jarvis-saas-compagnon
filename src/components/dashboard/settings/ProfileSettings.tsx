'use client'

import { useState } from 'react'
import { User, Building2, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ProfileSettingsProps {
  user: any
  profile: any
  gymName: string | null
}

export default function ProfileSettings({ user, profile, gymName }: ProfileSettingsProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Erreur mise à jour')

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées.',
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Informations personnelles</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations de profil
        </p>
      </div>

      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold text-2xl">
              {(profile.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{profile.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-muted-foreground">{profile.role === 'super_admin' ? 'Super Admin' : 'Gérant'}</p>
          </div>
        </div>

        {/* Nom complet */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nom complet
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!isEditing}
            placeholder="Votre nom complet"
          />
        </div>

        {/* Email (non éditable) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            value={profile.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            L'email ne peut pas être modifié. Contactez le support si nécessaire.
          </p>
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Téléphone
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        {/* Salle (pour managers) */}
        {profile.role === 'gym_manager' && gymName && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Salle associée
            </Label>
            <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-md">
              <p className="text-sm font-medium text-primary">{gymName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Modifier
          </Button>
        ) : (
          <>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setFormData({
                  full_name: profile.full_name || '',
                  phone: profile.phone || '',
                })
              }}
              disabled={loading}
            >
              Annuler
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

