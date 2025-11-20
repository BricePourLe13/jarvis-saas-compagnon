'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddMemberDialogProps {
  gymId: string
  onSuccess: () => void
}

export default function AddMemberDialog({ gymId, onSuccess }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    badgeId: ''
  })
  
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.badgeId) {
      toast({
        title: "Données manquantes",
        description: "Prénom, Nom et Badge ID sont obligatoires.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // On réutilise l'API d'import qui gère déjà l'insertion sécurisée
      // On envoie un tableau avec un seul membre
      const response = await fetch('/api/manager/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          members: [{
            prenom: formData.firstName,
            nom: formData.lastName,
            email: formData.email || undefined,
            badge_id: formData.badgeId
          }]
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erreur inconnue')
      }

      toast({
        title: 'Adhérent ajouté',
        description: `${formData.firstName} ${formData.lastName} a été ajouté avec succès.`,
      })

      setIsOpen(false)
      setFormData({ firstName: '', lastName: '', email: '', badgeId: '' })
      onSuccess()
      router.refresh()

    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'ajouter l'adhérent.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter manuellement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un adhérent</DialogTitle>
          <DialogDescription>
            Créez une nouvelle fiche adhérent. Le Badge ID est essentiel pour le kiosk.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  placeholder="Jean" 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  placeholder="Dupont" 
                  required 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="jean.dupont@exemple.com" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="badgeId">Badge ID (RFID) *</Label>
              <Input 
                id="badgeId" 
                value={formData.badgeId} 
                onChange={handleChange} 
                placeholder="ex: BADGE123" 
                required 
              />
              <p className="text-[0.8rem] text-muted-foreground">
                L'identifiant unique lu par le lecteur RFID du kiosk.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ajouter l'adhérent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
