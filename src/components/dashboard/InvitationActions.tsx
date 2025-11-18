'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Trash2, RefreshCw } from 'lucide-react'
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

interface InvitationActionsProps {
  invitationId: string
  email: string
  status: string
  onUpdate: () => void
}

export function InvitationActions({ invitationId, email, status, onUpdate }: InvitationActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { toast } = useToast()

  // Suppression invitation (pour tests uniquement)
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast({
        title: '✅ Invitation supprimée',
        description: `L'invitation pour ${email} a été supprimée.`,
      })

      onUpdate()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Renvoyer l'invitation (si expirée ou non acceptée)
  const handleResend = async () => {
    setIsResending(true)
    try {
      const res = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors du renvoi')
      }

      toast({
        title: '✅ Invitation renvoyée',
        description: `Un nouvel email a été envoyé à ${email}.`,
      })

      onUpdate()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message,
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Renvoyer (seulement si pending ou expired) */}
      {(status === 'pending' || status === 'expired') && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={isResending}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? 'Envoi...' : 'Renvoyer'}
        </Button>
      )}

      {/* Supprimer (avec confirmation) */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'invitation pour <strong>{email}</strong> sera définitivement supprimée.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

