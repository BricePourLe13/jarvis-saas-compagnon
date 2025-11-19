'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface CreateKioskDialogProps {
  gymId: string
  gymName: string
}

export default function CreateKioskDialog({ gymId, gymName }: CreateKioskDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kioskData, setKioskData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: `${gymName} - Kiosk Principal`,
    location_in_gym: 'Entrée principale',
  })

  const handleCreate = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/kiosks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      setKioskData(data.data)
      toast({
        title: 'Kiosk créé !',
        description: 'Le kiosk a été créé avec succès.',
      })

      // Rafraîchir la page pour afficher le nouveau kiosk
      setTimeout(() => {
        router.refresh()
        setOpen(false)
        setKioskData(null)
      }, 3000)

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copié !',
      description: 'Le code a été copié dans le presse-papier.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Kiosk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un Kiosk</DialogTitle>
          <DialogDescription>
            Créez un nouveau kiosk pour {gymName}
          </DialogDescription>
        </DialogHeader>

        {!kioskData ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du Kiosk</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Kiosk Principal"
              />
            </div>

            <div>
              <Label htmlFor="location">Emplacement</Label>
              <Input
                id="location"
                value={formData.location_in_gym}
                onChange={(e) => setFormData({ ...formData, location_in_gym: e.target.value })}
                placeholder="Ex: Entrée principale"
              />
            </div>

            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? 'Création...' : 'Créer le Kiosk'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-2">✅ Kiosk créé avec succès !</p>
              <p className="text-xs text-green-700">Le kiosk a été créé. Voici les informations de provisioning :</p>
            </div>

            <div>
              <Label>Code de Provisioning</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={kioskData.provisioning_code}
                  readOnly
                  className="font-mono text-lg font-bold"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(kioskData.provisioning_code)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Expire le {new Date(kioskData.provisioning_code_expires_at).toLocaleString('fr-FR')}
              </p>
            </div>

            <div>
              <Label>URL du Kiosk</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={kioskData.provisioning_url}
                  readOnly
                  className="text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(kioskData.provisioning_url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Cette fenêtre se fermera automatiquement dans quelques secondes...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

