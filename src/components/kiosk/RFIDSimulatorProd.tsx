/**
 * 🎯 SIMULATEUR RFID PRODUCTION
 * Simulation du scan de badge avec vrais profils membres
 */

'use client'

import { useState, useEffect } from 'react'
import { Box, VStack, HStack, Button, Text, Badge, Spinner, useToast } from '@chakra-ui/react'
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
  const toast = useToast()

  const simulateBadgeScan = async (badge_id: string, memberName: string) => {
    if (isActive) {
      toast({
        title: 'Session active',
        description: 'Une session est déjà en cours. Terminez-la avant de scanner un nouveau badge.',
        status: 'warning',
        duration: 3000
      })
      return
    }

    setIsScanning(true)
    setLastScannedBadge(badge_id)
    
    try {
      // Simulation du délai de lecture RFID
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 🔥 APPEL API RÉELLE POUR RÉCUPÉRER LE PROFIL
      console.log(`🎯 [RFID] Scan badge: ${badge_id} pour ${memberName}`)
      
      const apiSlug = gymSlug || 'gym-yatblc8h'
      const response = await fetch(`/api/kiosk/${apiSlug}/members/${badge_id}`)
      const result = await response.json()
      
      if (result.found && result.member) {
        // ✅ Profil membre trouvé en base
        console.log(`✅ [RFID] Profil récupéré:`, result.member)
        
        toast({
          title: `Badge scanné !`,
          description: `Bienvenue ${result.member.first_name} ${result.member.last_name}`,
          status: 'success',
          duration: 2000
        })
        
        onMemberScanned(result.member)
      } else {
        // ❌ Badge non trouvé
        console.error(`❌ [RFID] Badge non trouvé: ${badge_id}`)
        
        toast({
          title: 'Badge non reconnu',
          description: `Le badge ${badge_id} n'est pas enregistré dans cette salle.`,
          status: 'error',
          duration: 4000
        })
      }
      
    } catch (error) {
      console.error('❌ [RFID] Erreur scan:', error)
      
      toast({
        title: 'Erreur de scan',
        description: 'Impossible de lire le badge. Réessayez.',
        status: 'error',
        duration: 4000
      })
    }
    
    setIsScanning(false)
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Elite': return 'purple'
      case 'Premium': return 'blue'
      case 'Standard': return 'green'
      default: return 'gray'
    }
  }

  return (
    <Box 
      position="relative" 
      w="full" 
      p={6} 
      bg="white" 
      borderRadius="xl" 
      shadow="lg"
      border="2px solid"
      borderColor={isActive ? "red.200" : "gray.200"}
    >
      <VStack spacing={4} align="stretch">
        
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            📱 Simulateur Badge RFID
          </Text>
          {isActive && (
            <Badge colorScheme="red" variant="solid">
              Session Active
            </Badge>
          )}
        </HStack>

        {/* Instructions */}
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {isActive 
            ? "⚠️ Terminez la session en cours avant de scanner un nouveau badge"
            : "Cliquez sur un badge pour simuler le scan RFID"
          }
        </Text>

        {/* Badges Grid */}
        <VStack spacing={3} align="stretch">
          {PRODUCTION_BADGES.map((badge) => (
            <Button
              key={badge.badge_id}
              onClick={() => simulateBadgeScan(badge.badge_id, badge.name)}
              isDisabled={isActive || isScanning}
              isLoading={isScanning && lastScannedBadge === badge.badge_id}
              loadingText="Scan en cours..."
              size="lg"
              variant="outline"
              colorScheme={getBadgeColor(badge.type)}
              justifyContent="flex-start"
              leftIcon={<Text fontSize="xl">{badge.emoji}</Text>}
              _hover={{ 
                transform: isActive ? 'none' : 'translateY(-2px)',
                shadow: isActive ? 'none' : 'md'
              }}
              transition="all 0.2s"
            >
              <HStack spacing={3} w="full" justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">{badge.name}</Text>
                  <Text fontSize="xs" opacity={0.8}>
                    {badge.badge_id} • {badge.level}
                  </Text>
                </VStack>
                <Badge 
                  colorScheme={getBadgeColor(badge.type)} 
                  variant="subtle"
                  fontSize="xs"
                >
                  {badge.type}
                </Badge>
              </HStack>
            </Button>
          ))}
        </VStack>

        {/* Status */}
        {isScanning && (
          <HStack justify="center" spacing={2} py={2}>
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="sm" color="blue.600">
              Lecture du badge {lastScannedBadge}...
            </Text>
          </HStack>
        )}

        {/* Info */}
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
          💡 En production, un vrai lecteur RFID remplacera ce simulateur
        </Text>
      </VStack>
    </Box>
  )
}
