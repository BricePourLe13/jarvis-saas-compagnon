'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GymApprovalActionsProps {
  gymId: string
  gymName: string
}

export default function GymApprovalActions({ gymId, gymName }: GymApprovalActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Salle approuvée',
          description: `"${gymName}" est maintenant active.`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible d\'approuver la salle',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez fournir une raison du rejet',
        variant: 'destructive',
      })
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approved: false, 
          rejection_reason: rejectionReason 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Salle rejetée',
          description: `"${gymName}" a été rejetée.`,
        })
        setIsRejectDialogOpen(false)
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de rejeter la salle',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Approuver
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => setIsRejectDialogOpen(true)}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rejeter
        </Button>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la salle &quot;{gymName}&quot;</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison claire du rejet. Le gérant recevra cette information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Raison du rejet *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: Informations incomplètes, localisation non éligible, doublon..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


