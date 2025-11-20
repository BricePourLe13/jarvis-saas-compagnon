'use client'

/**
 * 🎬 KIOSK ACTIONS
 * Actions disponibles pour un kiosk : Copier lien, Supprimer
 */

import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface KioskActionsProps {
  kioskId: string
  kioskSlug: string
  kioskName: string
}

export default function KioskActions({ kioskId, kioskSlug, kioskName }: KioskActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleCopyLink = () => {
    const kioskUrl = `${window.location.origin}/kiosk/${kioskSlug}`
    navigator.clipboard.writeText(kioskUrl)
    toast({
      title: 'Lien copié !',
      description: 'Le lien du kiosk a été copié dans le presse-papiers.',
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/kiosks/${kioskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast({
        title: 'Kiosk supprimé',
        description: `Le kiosk "${kioskName}" a été supprimé avec succès.`,
      })

      // Rafraîchir la page pour voir les changements
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le kiosk.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {/* Bouton Copier lien */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="h-8"
      >
        <Copy className="h-4 w-4" />
      </Button>

      {/* Bouton Supprimer avec confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le kiosk ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le kiosk <strong>"{kioskName}"</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

