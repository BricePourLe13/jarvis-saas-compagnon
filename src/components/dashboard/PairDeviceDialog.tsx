'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Monitor } from 'lucide-react'

interface PairDeviceDialogProps {
  kiosks: Array<{
    id: string
    name: string
    gym_id: string
    gyms?: {
      name: string
    }
  }>
  userRole: 'super_admin' | 'gym_manager'
}

export default function PairDeviceDialog({ kiosks, userRole }: PairDeviceDialogProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [selectedKioskId, setSelectedKioskId] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handlePair() {
    if (!code || !selectedKioskId) {
      toast({
        variant: 'destructive',
        title: 'Champs manquants',
        description: 'Veuillez entrer le code et sélectionner un kiosk.',
      })
      return
    }

    // Formater le code (enlever espaces, tirets éventuels)
    const formattedCode = code.trim().replace(/\s/g, '')

    setLoading(true)

    try {
      const res = await fetch('/api/device/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formattedCode,
          kiosk_id: selectedKioskId,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'appairage')
      }

      toast({
        title: '✅ Écran appairé !',
        description: data.message || 'L\'écran a été activé avec succès.',
      })

      // Reset form
      setCode('')
      setSelectedKioskId('')
      setOpen(false)

      // Rafraîchir la page pour voir le nouveau statut
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur d\'appairage',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Monitor className="w-4 h-4 mr-2" />
          Appareiller un écran
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Appareiller un nouvel écran</DialogTitle>
          <DialogDescription>
            Entrez le code à 6 chiffres affiché sur l'écran et sélectionnez le kiosk correspondant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Code input */}
          <div className="space-y-2">
            <Label htmlFor="code">Code d'appairage</Label>
            <Input
              id="code"
              placeholder="123-456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={7}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Format : XXX-XXX (6 chiffres)
            </p>
          </div>

          {/* Kiosk selection */}
          <div className="space-y-2">
            <Label htmlFor="kiosk">Kiosk à activer</Label>
            <Select
              value={selectedKioskId}
              onValueChange={setSelectedKioskId}
              disabled={loading}
            >
              <SelectTrigger id="kiosk">
                <SelectValue placeholder="Sélectionnez un kiosk" />
              </SelectTrigger>
              <SelectContent>
                {kiosks.length === 0 && (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    Aucun kiosk disponible
                  </div>
                )}
                {kiosks.map((kiosk) => (
                  <SelectItem key={kiosk.id} value={kiosk.id}>
                    {kiosk.name}
                    {userRole === 'super_admin' && kiosk.gyms && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({kiosk.gyms.name})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choisissez le kiosk qui correspond à cet écran
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">
              📋 Instructions
            </p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Ouvrez <code className="bg-white px-1 rounded">app.jarvis-group.net/setup</code> sur l'écran</li>
              <li>Un code à 6 chiffres s'affiche</li>
              <li>Entrez ce code ci-dessus et validez</li>
              <li>L'écran sera automatiquement redirigé vers l'interface JARVIS</li>
            </ol>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handlePair} disabled={loading || !code || !selectedKioskId}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Valider l'appairage
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

