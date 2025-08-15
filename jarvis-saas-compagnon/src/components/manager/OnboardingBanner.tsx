'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Progress,
  Badge,
  IconButton,
  Collapse,
  useColorModeValue,
  Icon
} from '@chakra-ui/react'
import { ChevronDown, CheckCircle, X } from 'lucide-react'

type OnboardingBannerProps = {
  gymId: string
  onComplete?: () => void
  onDismiss?: () => void
}

export default function OnboardingBanner({ gymId, onComplete, onDismiss }: OnboardingBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [missions, setMissions] = useState([
    { id: 'appairage', title: 'Appairer JARVIS', completed: false },
    { id: 'mission', title: 'Créer une mission', completed: false },
    { id: 'fiche', title: 'Voir fiche membre', completed: false },
    { id: 'suggestion', title: 'Appliquer suggestion', completed: false },
    { id: 'classement', title: 'Voir classement', completed: false }
  ])

  const bgColor = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('blue.200', 'blue.600')

  useEffect(() => {
    const fetchOnboarding = async () => {
      try {
        const res = await fetch(`/api/manager/onboarding?gymId=${encodeURIComponent(gymId)}`)
        if (res.ok) {
          const data = await res.json()
          const updatedMissions = missions.map(mission => ({
            ...mission,
            completed: data[`${mission.id}_done`] || false
          }))
          setMissions(updatedMissions)
          const completedCount = updatedMissions.filter(m => m.completed).length
          setProgress((completedCount / updatedMissions.length) * 100)
          
          if (completedCount === updatedMissions.length && onComplete) {
            setTimeout(() => onComplete(), 1000)
          }
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

  if (loading) return null

  if (progress === 100) return null // Masquer une fois terminé

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="12px"
      overflow="hidden"
      shadow="sm"
    >
      {/* Header toujours visible */}
      <HStack 
        p={4} 
        justify="space-between" 
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: 'blue.100' }}
        transition="background 0.2s ease"
      >
        <HStack spacing={3}>
          <Box w={3} h={3} bg="blue.400" borderRadius="full" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="600" color="blue.700" fontSize="sm">
              Configuration en cours
            </Text>
            <Text fontSize="xs" color="blue.600">
              {Math.round(progress)}% terminé • {missions.filter(m => !m.completed).length} étapes restantes
            </Text>
          </VStack>
        </HStack>
        
        <HStack spacing={2}>
          <Progress 
            value={progress} 
            colorScheme="blue" 
            size="sm" 
            w="100px"
            borderRadius="full"
            bg="blue.100"
          />
          <Badge colorScheme="blue" variant="solid" size="sm">
            {Math.round(progress)}%
          </Badge>
          <IconButton
            aria-label="Dismiss"
            icon={<Icon as={X} />}
            variant="ghost"
            size="xs"
            color="blue.600"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss?.()
            }}
          />
          <Icon 
            as={ChevronDown} 
            w={4} 
            h={4} 
            color="blue.600"
            transform={isExpanded ? 'rotate(180deg)' : 'none'}
            transition="transform 0.2s ease"
          />
        </HStack>
      </HStack>

      {/* Contenu expandable */}
      <Collapse in={isExpanded}>
        <Box p={4} pt={0} bg="white" borderTop="1px solid" borderColor="blue.100">
          <VStack spacing={2} align="stretch">
            {missions.map((mission) => (
              <HStack key={mission.id} justify="space-between" p={2} bg="gray.50" borderRadius="6px">
                <HStack spacing={2}>
                  <Icon
                    as={CheckCircle}
                    w={4}
                    h={4}
                    color={mission.completed ? 'green.500' : 'gray.300'}
                  />
                  <Text 
                    fontSize="sm" 
                    color={mission.completed ? 'gray.500' : 'gray.700'}
                    textDecoration={mission.completed ? 'line-through' : 'none'}
                  >
                    {mission.title}
                  </Text>
                </HStack>
                
                {!mission.completed && (
                  <Button
                    size="xs"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => handleMissionComplete(mission.id)}
                  >
                    Valider
                  </Button>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  )
}
