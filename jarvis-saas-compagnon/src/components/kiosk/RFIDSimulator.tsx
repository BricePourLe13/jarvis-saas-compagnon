"use client"
import { useState } from 'react'
import { Box, VStack, HStack, Text, Button, Badge, Avatar } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { GymMember } from '@/types/kiosk'

interface RFIDSimulatorProps {
  onMemberScanned: (member: GymMember) => void
  isActive: boolean
}

// Membres de test pour la simulation
const DEMO_MEMBERS: GymMember[] = [
  {
    id: 'member_001',
    gym_id: 'gym_001',
    badge_id: 'BADGE_001',
    first_name: 'Pierre',
    last_name: 'Martin',
    email: 'pierre.martin@email.com',
    phone: '+33 6 12 34 56 78',
    membership_type: 'Premium',
    member_since: '2023-06-15',
    member_preferences: {
      language: 'fr',
      goals: ['Perte de poids', 'Renforcement musculaire'],
      dietary_restrictions: [],
      favorite_activities: ['Cardio', 'Musculation'],
      notification_preferences: {
        email: true,
        sms: true
      }
    },
    total_visits: 156,
    last_visit: '2024-01-20T09:30:00Z',
    is_active: true,
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2024-01-20T09:30:00Z'
  },
  {
    id: 'member_002',
    gym_id: 'gym_001', 
    badge_id: 'BADGE_002',
    first_name: 'Sophie',
    last_name: 'Dubois',
    email: 'sophie.dubois@email.com',
    phone: '+33 6 98 76 54 32',
    membership_type: 'Standard',
    member_since: '2023-11-02',
    member_preferences: {
      language: 'fr',
      goals: ['Flexibilité', 'Bien-être'],
      dietary_restrictions: [],
      favorite_activities: ['Yoga', 'Pilates'],
      notification_preferences: {
        email: true,
        sms: false
      }
    },
    total_visits: 87,
    last_visit: '2024-01-19T18:45:00Z',
    is_active: true,
    created_at: '2023-11-02T00:00:00Z',
    updated_at: '2024-01-19T18:45:00Z'
  },
  {
    id: 'member_003',
    gym_id: 'gym_001',
    badge_id: 'BADGE_003',
    first_name: 'Alex',
    last_name: 'Chen',
    email: 'alex.chen@email.com',
    phone: '+33 7 45 23 67 89',
    membership_type: 'Elite',
    member_since: '2022-03-20',
    member_preferences: {
      language: 'en',
      goals: ['Performance', 'Gain musculaire'],
      dietary_restrictions: [],
      favorite_activities: ['CrossFit', 'Haltérophilie'],
      notification_preferences: {
        email: false,
        sms: false
      }
    },
    total_visits: 342,
    last_visit: '2024-01-21T07:15:00Z',
    is_active: true,
    created_at: '2022-03-20T00:00:00Z',
    updated_at: '2024-01-21T07:15:00Z'
  }
]

export default function RFIDSimulator({ onMemberScanned, isActive }: RFIDSimulatorProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedMember, setLastScannedMember] = useState<GymMember | null>(null)

  const simulateBadgeScan = async (member: GymMember) => {
    if (isActive) return // Ne pas scanner si une session est déjà active

    setIsScanning(true)
    
    try {
      // Simulation de la lecture RFID (délai réaliste)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 🔥 FUTURE: Appel API Supabase (TODO: Implémenter le gymSlug)
      // const response = await fetch(`/api/kiosk/{gymSlug}/members/${member.badge_id}`)
      // const result = await response.json()
      
      // Pour l'instant, utiliser les données simulées passées en paramètre
      setLastScannedMember(member)
      
      // Déclencher la session vocale avec les données membre
      onMemberScanned(member)
      
      console.log(`🏷️ Badge RFID scanné: ${member.first_name} ${member.last_name} (${member.badge_id})`)
      console.log(`📋 Mode: Simulation (TODO: Intégrer API Supabase)`)
      
    } catch (error) {
      console.error('Erreur simulation badge:', error)
    }
    
    setIsScanning(false)
  }

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'Elite': return 'purple'
      case 'Premium': return 'blue'
      case 'Standard': return 'green'
      default: return 'gray'
    }
  }

  const getFitnessLevelEmoji = (level: string) => {
    switch (level) {
      case 'advanced': return '🏆'
      case 'intermediate': return '💪'
      case 'beginner': return '🌱'
      default: return '👤'
    }
  }

  return (
    <Box position="relative" w="full">
      {/* Zone de scan RFID */}
      <VStack spacing={6} align="center">
        <Box textAlign="center">
          <Text color="rgba(255,255,255,0.9)" fontSize="lg" fontWeight="500" mb={2}>
            Simulation Badge RFID
          </Text>
          <Text color="rgba(255,255,255,0.6)" fontSize="sm">
            {isActive ? "Session vocale active" : "Sélectionnez un membre pour démarrer"}
          </Text>
        </Box>

        {/* Indicateur de scan */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              <Box
                bg="rgba(34, 197, 94, 0.2)"
                border="2px solid"
                borderColor="green.500"
                borderRadius="xl"
                p={6}
                textAlign="center"
                backdropFilter="blur(20px)"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Text fontSize="3xl" mb={2}>📡</Text>
                </motion.div>
                <Text color="green.500" fontWeight="600">
                  Lecture en cours...
                </Text>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des membres simulés */}
        <VStack spacing={3} w="full" maxW="400px" opacity={isActive ? 0.5 : 1}>
          {DEMO_MEMBERS.map((member) => (
            <motion.div
              key={member.id}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: isActive ? 1 : 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                variant="ghost"
                size="lg"
                w="full"
                h="auto"
                p={4}
                isDisabled={isActive || isScanning}
                onClick={() => simulateBadgeScan(member)}
                _hover={{
                  bg: isActive ? 'transparent' : 'rgba(255,255,255,0.1)',
                  transform: isActive ? 'none' : 'translateY(-2px)'
                }}
                _active={{
                  bg: 'rgba(255,255,255,0.2)'
                }}
                cursor={isActive ? 'default' : 'pointer'}
              >
                <HStack spacing={4} w="full" justify="space-between">
                  {/* Avatar et infos */}
                  <HStack spacing={3}>
                    <Avatar 
                      size="md" 
                      name={`${member.first_name} ${member.last_name}`}
                      bg={`${getMembershipColor(member.membership_type)}.500`}
                      color="white"
                    />
                    <VStack spacing={1} align="start">
                      <HStack spacing={2}>
                        <Text color="white" fontWeight="600" fontSize="md">
                          {member.first_name} {member.last_name}
                        </Text>
                        <Text fontSize="lg">
                          {getFitnessLevelEmoji(member.member_preferences?.goals[0] || 'beginner')}
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Badge 
                          colorScheme={getMembershipColor(member.membership_type)}
                          size="sm"
                          borderRadius="full"
                        >
                          {member.membership_type}
                        </Badge>
                        <Text color="rgba(255,255,255,0.6)" fontSize="xs">
                          {member.total_visits} visites
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>

                  {/* Badge ID */}
                  <VStack spacing={1} align="end">
                    <Text color="rgba(255,255,255,0.5)" fontSize="xs">
                      {member.badge_id}
                    </Text>
                    <Text color="rgba(255,255,255,0.4)" fontSize="xs">
                      {member.member_preferences?.language?.toUpperCase()}
                    </Text>
                  </VStack>
                </HStack>
              </Button>
            </motion.div>
          ))}
        </VStack>

        {/* Informations sur le dernier membre scanné */}
        <AnimatePresence>
          {lastScannedMember && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ width: '100%', maxWidth: '400px' }}
            >
              <Box
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid"
                borderColor="green.300"
                borderRadius="lg"
                p={4}
                textAlign="center"
              >
                <Text color="green.500" fontSize="sm" fontWeight="500" mb={1}>
                  ✅ Dernier scan réussi
                </Text>
                <Text color="rgba(255,255,255,0.8)" fontSize="sm">
                  {lastScannedMember.first_name} {lastScannedMember.last_name} - {lastScannedMember.membership_type}
                </Text>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </VStack>
    </Box>
  )
} 