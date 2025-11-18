'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface KioskApprovalActionsProps {
  kioskId: string
  kioskName: string
}

export default function KioskApprovalActions({ kioskId, kioskName }: KioskApprovalActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/kiosks/${kioskId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Kiosk approuvé',
          description: `"${kioskName}" est maintenant en ligne.`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible d\'approuver le kiosk',
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
    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/kiosks/${kioskId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Kiosk rejeté',
          description: `"${kioskName}" doit être reconfiguré.`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de rejeter le kiosk',
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
        onClick={handleReject}
        disabled={isRejecting}
      >
        {isRejecting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-1" />
        )}
        Rejeter
      </Button>
    </div>
  )
}


