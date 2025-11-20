'use client'

/**
 * 🏷️ MEMBER BADGES
 * Affiche les adhérents de la gym sous forme de badges cliquables
 * Remplace le RFIDSimulator pour une UX plus simple et claire
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GymMember } from '@/types/kiosk'
import { logger } from '@/lib/production-logger'

interface MemberBadgesProps {
  gymSlug: string
  onMemberScanned: (member: GymMember) => void
  isActive: boolean
}

export default function MemberBadges({ gymSlug, onMemberScanned, isActive }: MemberBadgesProps) {
  const [members, setMembers] = useState<GymMember[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState<string | null>(null)
  const { toast } = useToast()

  // Charger les adhérents de la gym
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/kiosk/${gymSlug}/members`)
        const data = await response.json()
        
        if (data.members && data.members.length > 0) {
          setMembers(data.members.slice(0, 8)) // Limiter à 8 adhérents max
          logger.info(`✅ [BADGES] ${data.members.length} adhérents chargés`)
        }
      } catch (error) {
        logger.error('❌ [BADGES] Erreur chargement adhérents', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [gymSlug])

  const handleBadgeClick = async (member: GymMember) => {
    if (isActive) {
      toast({
        title: 'Session active',
        description: 'Une session est déjà en cours.',
        variant: 'destructive'
      })
      return
    }

    setScanning(member.member_id)
    
    try {
      // Simulation du délai de scan RFID
      await new Promise(resolve => setTimeout(resolve, 300))
      
      logger.info(`🎯 [BADGE] Scan: ${member.first_name} ${member.last_name}`)
      
      toast({
        title: `Badge scanné !`,
        description: `Bienvenue ${member.first_name} ${member.last_name}`
      })
      
      onMemberScanned(member)
    } catch (error) {
      logger.error('❌ [BADGE] Erreur scan', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de scanner le badge',
        variant: 'destructive'
      })
    } finally {
      setScanning(null)
    }
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Chargement adhérents...</span>
      </div>
    )
  }

  if (members.length === 0) {
    return null // Pas d'adhérents, pas d'affichage
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-muted-foreground font-medium mr-2">
            Adhérents :
          </span>
          {members.map((member) => (
            <Badge
              key={member.member_id}
              variant="outline"
              className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all ${
                scanning === member.member_id ? 'animate-pulse' : ''
              } ${
                isActive ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => handleBadgeClick(member)}
            >
              {scanning === member.member_id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              {member.first_name} {member.last_name?.charAt(0)}.
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

