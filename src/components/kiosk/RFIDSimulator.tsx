'use client'

/**
 * 🎯 SIMULATEUR RFID PRODUCTION
 * Simulation du scan de badge avec vrais profils membres
 */

import { logger } from '@/lib/production-logger';

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GymMember } from '@/types/kiosk'

interface RFIDSimulatorProdProps {
  onMemberScanned: (member: GymMember) => void
  isActive: boolean
  gymSlug?: string
}

// 🚀 BADGES PRODUCTION RÉELS
const PRODUCTION_BADGES = [
  { badge_id: 'BADGE001', name: 'Marie Dubois', type: 'Premium', level: 'beginner', emoji: '🌱' },
  { badge_id: 'BADGE002', name: 'Thomas Martin', type: 'Elite', level: 'advanced', emoji: '🏆' },
  { badge_id: 'BADGE003', name: 'Sophie Leroy', type: 'Standard', level: 'intermediate', emoji: '💪' },
  { badge_id: 'BADGE004', name: 'Jean Moreau', type: 'Premium', level: 'beginner', emoji: '🌱' },
  { badge_id: 'BADGE005', name: 'Léa Bernard', type: 'Standard', level: 'intermediate', emoji: '💪' },
  { badge_id: 'BADGE006', name: 'David Rousseau', type: 'Premium', level: 'beginner', emoji: '🌱' }
]

export default function RFIDSimulatorProd({ onMemberScanned, isActive, gymSlug }: RFIDSimulatorProdProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedBadge, setLastScannedBadge] = useState<string | null>(null)
  const { toast } = useToast()

  const simulateBadgeScan = async (badge_id: string, memberName: string) => {
    if (isActive) {
      toast({
        title: 'Session active',
        description: 'Une session est déjà en cours. Terminez-la avant de scanner un nouveau badge.',
        variant: 'destructive'
      })
      return
    }

    setIsScanning(true)
    setLastScannedBadge(badge_id)
    
    try {
      // Simulation du délai de lecture RFID
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 🔥 APPEL API RÉELLE POUR RÉCUPÉRER LE PROFIL
      logger.info(`🎯 [RFID] Scan badge: ${badge_id} pour ${memberName}`)
      
      const apiSlug = gymSlug || 'gym-yatblc8h'
      const response = await fetch(`/api/kiosk/${apiSlug}/members/${badge_id}`)
      const result = await response.json()
      
      if (result.found && result.member) {
        // ✅ Profil membre trouvé en base
        logger.info(`✅ [RFID] Profil récupéré:`, result.member)
        
        toast({
          title: `Badge scanné !`,
          description: `Bienvenue ${result.member.first_name} ${result.member.last_name}`
        })
        
        onMemberScanned(result.member)
      } else {
        // ❌ Badge non trouvé
        logger.error(`❌ [RFID] Badge non trouvé: ${badge_id}`)
        
        toast({
          title: 'Badge non reconnu',
          description: `Le badge ${badge_id} n'est pas enregistré dans cette salle.`,
          variant: 'destructive'
        })
      }
      
    } catch (error) {
      logger.error('❌ [RFID] Erreur scan:', error)
      
      toast({
        title: 'Erreur de scan',
        description: 'Impossible de lire le badge. Réessayez.',
        variant: 'destructive'
      })
    }
    
    setIsScanning(false)
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Elite': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'Premium': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Standard': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div 
      className={`relative w-full p-6 bg-white rounded-xl shadow-lg border-2 ${
        isActive ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-700">
            📱 Simulateur Badge RFID
          </p>
          {isActive && (
            <Badge variant="destructive">
              Session Active
            </Badge>
          )}
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600 text-center">
          {isActive 
            ? "⚠️ Terminez la session en cours avant de scanner un nouveau badge"
            : "Cliquez sur un badge pour simuler le scan RFID"
          }
        </p>

        {/* Badges Grid */}
        <div className="flex flex-col gap-3">
          {PRODUCTION_BADGES.map((badge) => (
            <Button
              key={badge.badge_id}
              onClick={() => simulateBadgeScan(badge.badge_id, badge.name)}
              disabled={isActive || isScanning}
              size="lg"
              variant="outline"
              className={`justify-start h-auto py-4 ${getBadgeColor(badge.type)} hover:-translate-y-0.5 hover:shadow-md transition-all ${
                (isActive || isScanning) && 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none'
              }`}
            >
              {isScanning && lastScannedBadge === badge.badge_id ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scan en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{badge.emoji}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{badge.name}</span>
                      <span className="text-xs opacity-80">
                        {badge.badge_id} • {badge.level}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {badge.type}
                  </Badge>
                </div>
              )}
            </Button>
          ))}
        </div>

        {/* Status */}
        {isScanning && (
          <div className="flex justify-center items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600">
              Lecture du badge {lastScannedBadge}...
            </p>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-2">
          💡 En production, un vrai lecteur RFID remplacera ce simulateur
        </p>
      </div>
    </div>
  )
}
