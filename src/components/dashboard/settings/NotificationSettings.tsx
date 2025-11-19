'use client'

import { useState } from 'react'
import { Bell, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface NotificationSettingsProps {
  userId: string
  userEmail: string
}

export default function NotificationSettings({ userId, userEmail }: NotificationSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    emailChurnAlerts: true,
    emailWeeklyReports: true,
    emailNewMembers: true,
    emailSystemUpdates: false,
    digestFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error()

      toast({
        title: 'Préférences enregistrées',
        description: 'Vos paramètres de notification ont été mis à jour.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les préférences.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications Email */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notifications par email
          </h3>
          <p className="text-sm text-muted-foreground">
            Choisissez les emails que vous souhaitez recevoir sur <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
            <div>
              <Label htmlFor="churnAlerts" className="text-sm font-medium cursor-pointer">
                Alertes churn
              </Label>
              <p className="text-xs text-muted-foreground">
                Notifications quand un adhérent est à risque de désengagement
              </p>
            </div>
            <Switch
              id="churnAlerts"
              checked={settings.emailChurnAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, emailChurnAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
            <div>
              <Label htmlFor="weeklyReports" className="text-sm font-medium cursor-pointer">
                Rapports hebdomadaires
              </Label>
              <p className="text-xs text-muted-foreground">
                Résumé des activités de la semaine
              </p>
            </div>
            <Switch
              id="weeklyReports"
              checked={settings.emailWeeklyReports}
              onCheckedChange={(checked) => setSettings({ ...settings, emailWeeklyReports: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
            <div>
              <Label htmlFor="newMembers" className="text-sm font-medium cursor-pointer">
                Nouveaux adhérents
              </Label>
              <p className="text-xs text-muted-foreground">
                Alerte quand un nouvel adhérent s'inscrit
              </p>
            </div>
            <Switch
              id="newMembers"
              checked={settings.emailNewMembers}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNewMembers: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
            <div>
              <Label htmlFor="systemUpdates" className="text-sm font-medium cursor-pointer">
                Mises à jour système
              </Label>
              <p className="text-xs text-muted-foreground">
                Nouvelles fonctionnalités et maintenances
              </p>
            </div>
            <Switch
              id="systemUpdates"
              checked={settings.emailSystemUpdates}
              onCheckedChange={(checked) => setSettings({ ...settings, emailSystemUpdates: checked })}
            />
          </div>
        </div>
      </div>

      {/* Fréquence digest */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Digest
          </h3>
          <p className="text-sm text-muted-foreground">
            Fréquence du résumé d'activité
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['daily', 'weekly', 'monthly'].map((freq) => (
            <button
              key={freq}
              onClick={() => setSettings({ ...settings, digestFrequency: freq as any })}
              className={`p-3 border rounded-md text-sm font-medium transition-colors ${
                settings.digestFrequency === freq
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {freq === 'daily' && 'Quotidien'}
              {freq === 'weekly' && 'Hebdomadaire'}
              {freq === 'monthly' && 'Mensuel'}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </div>
  )
}

