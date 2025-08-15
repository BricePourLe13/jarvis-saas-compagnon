'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Progress,
  Button,
  Icon,
  Flex,
  useColorModeValue,
  Badge,
  Divider,
  SimpleGrid
} from '@chakra-ui/react'
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons'
import { Circle } from 'lucide-react'

type Mission = {
  id: string
  title: string
  description: string
  completed: boolean
  icon: any
}

type OnboardingMissionsProps = {
  gymId: string
  onComplete?: () => void
}

export default function OnboardingMissions({ gymId, onComplete }: OnboardingMissionsProps) {
  const [loading, setLoading] = useState(true)
  const [missions, setMissions] = useState<Mission[]>([])
  const [progress, setProgress] = useState(0)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const completedColor = useColorModeValue('green.50', 'green.900')
  const completedBorderColor = useColorModeValue('green.200', 'green.600')

  useEffect(() => {
    const fetchOnboarding = async () => {
      try {
        const res = await fetch(`/api/manager/onboarding?gymId=${encodeURIComponent(gymId)}`)
        if (res.ok) {
          const data = await res.json()
          const missionData = [
            {
              id: 'appairage',
              title: 'Appairer JARVIS au dashboard',
              description: 'Connecter votre kiosque JARVIS à ce dashboard',
              completed: data.appairage_done || false,
              icon: CheckCircleIcon
            },
            {
              id: 'mission',
              title: 'Créer une première mission vocale',
              description: 'Définir une mission personnalisée pour JARVIS',
              completed: data.mission_done || false,
              icon: StarIcon
            },
            {
              id: 'fiche',
              title: 'Consulter une fiche adhérent',
              description: 'Explorer le profil détaillé d\'un membre',
              completed: data.fiche_done || false,
              icon: CheckCircleIcon
            },
            {
              id: 'suggestion',
              title: 'Appliquer une suggestion IA',
              description: 'Mettre en place une recommandation intelligente',
              completed: data.suggestion_done || false,
              icon: StarIcon
            },
            {
              id: 'classement',
              title: 'Consulter son classement réseau',
              description: 'Voir votre position dans le réseau',
              completed: data.classement_done || false,
              icon: CheckCircleIcon
            }
          ]
          
          setMissions(missionData)
          const completedCount = missionData.filter(m => m.completed).length
          setProgress((completedCount / missionData.length) * 100)
        }
      } catch (error) {
        console.error('Error fetching onboarding:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOnboarding()
  }, [gymId])

  const handleMissionComplete = async (missionId: string) => {
    try {
      const res = await fetch('/api/manager/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId,
          missionId,
          completed: true
        })
      })

      if (res.ok) {
        setMissions(prev => prev.map(m => 
          m.id === missionId ? { ...m, completed: true } : m
        ))
        
        const newCompletedCount = missions.filter(m => 
          m.completed || m.id === missionId
        ).length
        const newProgress = (newCompletedCount / missions.length) * 100
        setProgress(newProgress)

        if (newProgress === 100 && onComplete) {
          setTimeout(() => onComplete(), 1000)
        }
      }
    } catch (error) {
      console.error('Error updating mission:', error)
    }
  }

  if (loading) {
    return (
      <Box p={6} bg={bgColor} borderRadius="16px" border="1px solid" borderColor={borderColor}>
        <VStack spacing={4}>
          <Heading size="md" color="text.default">Chargement...</Heading>
        </VStack>
      </Box>
    )
  }

  return (
    <Box 
      p={6} 
      bg={bgColor} 
      borderRadius="16px" 
      border="1px solid" 
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
    >
      {/* Gradient background pour l'effet premium */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bg="linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
        borderTopRadius="16px"
      />
      
      <VStack spacing={6} align="stretch">
        {/* Header avec progression */}
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="md" color="text.default">Missions d'intégration</Heading>
              <Text color="text.muted" fontSize="sm">
                Complétez ces étapes pour débloquer toutes les fonctionnalités
              </Text>
            </VStack>
            <Badge 
              colorScheme={progress === 100 ? 'green' : 'blue'} 
              variant="subtle"
              px={3}
              py={1}
              borderRadius="full"
            >
              {Math.round(progress)}% terminé
            </Badge>
          </HStack>
          
          <Box>
            <Progress 
              value={progress} 
              colorScheme="blue" 
              size="sm" 
              borderRadius="full"
              bg="gray.100"
            />
          </Box>
        </VStack>

        <Divider />

        {/* Liste des missions */}
        <VStack spacing={3} align="stretch">
          {missions.map((mission, index) => (
            <Box
              key={mission.id}
              p={4}
              bg={mission.completed ? completedColor : 'bg.subtle'}
              border="1px solid"
              borderColor={mission.completed ? completedBorderColor : borderColor}
              borderRadius="12px"
              position="relative"
              transition="all 0.2s ease"
              _hover={{ 
                transform: mission.completed ? 'none' : 'translateY(-1px)',
                shadow: mission.completed ? 'none' : 'md'
              }}
            >
              <HStack spacing={4} align="center">
                <Icon
                  as={mission.completed ? CheckCircleIcon : Circle}
                  w={6}
                  h={6}
                  color={mission.completed ? 'green.500' : 'gray.400'}
                />
                
                <VStack align="start" spacing={1} flex={1}>
                  <HStack spacing={2} align="center">
                    <Text 
                      fontWeight={mission.completed ? 'normal' : 'medium'} 
                      color={mission.completed ? 'green.700' : 'text.default'}
                      textDecoration={mission.completed ? 'line-through' : 'none'}
                    >
                      {mission.title}
                    </Text>
                    {index === 0 && !mission.completed && (
                      <Badge size="sm" colorScheme="orange">Suivant</Badge>
                    )}
                  </HStack>
                  <Text 
                    fontSize="sm" 
                    color={mission.completed ? 'green.600' : 'text.muted'}
                  >
                    {mission.description}
                  </Text>
                </VStack>

                {!mission.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => handleMissionComplete(mission.id)}
                    _hover={{ bg: 'blue.50' }}
                  >
                    Valider
                  </Button>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>

        {/* Footer si toutes les missions sont terminées */}
        {progress === 100 && (
          <Box 
            p={4} 
            bg="green.50" 
            borderRadius="12px" 
            border="1px solid" 
            borderColor="green.200"
            textAlign="center"
          >
            <VStack spacing={2}>
              <Icon as={StarIcon} w={6} h={6} color="green.500" />
              <Text fontWeight="medium" color="green.700">
                🎉 Félicitations ! Toutes les missions sont terminées
              </Text>
              <Text fontSize="sm" color="green.600">
                Vous avez maintenant accès à toutes les fonctionnalités du dashboard
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
