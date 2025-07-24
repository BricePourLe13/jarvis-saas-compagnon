"use client"
import React, { useEffect, useState } from "react"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react'

// Données de démonstration
const stats = [
  { 
    label: "Franchises", 
    value: 12, 
    change: "+12%", 
    trend: "up",
    color: "brand.500"
  },
  { 
    label: "Franchises actives", 
    value: 10, 
    change: "+8%", 
    trend: "up",
    color: "green.500"
  },
  { 
    label: "Utilisateurs", 
    value: 134, 
    change: "+24%", 
    trend: "up",
    color: "blue.500"
  },
  { 
    label: "Latence API", 
    value: "120ms", 
    change: "-5ms", 
    trend: "up",
    color: "purple.500"
  }
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Box minH="100vh" bg="#fafafa">
      <Container maxW="7xl" py={10}>
        {/* Header */}
        <VStack spacing={6} align="start" mb={10}>
          <Box>
            <Heading 
              size="2xl" 
              color="#1a1a1a" 
              fontWeight="800"
              letterSpacing="-1px"
            >
              Dashboard JARVIS
            </Heading>
            <Text color="#6b7280" fontSize="lg" mt={2}>
              Plateforme d'Intelligence pour Salles de Sport
            </Text>
          </Box>
        </VStack>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              bg="white"
              p={6}
              borderRadius="16px"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
              border="1px solid"
              borderColor="#e5e7eb"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)"
              }}
              transition="all 0.3s ease"
            >
              <Stat>
                <StatLabel color="#6b7280" fontSize="sm" fontWeight="600">
                  {stat.label}
                </StatLabel>
                <StatNumber 
                  color="#1a1a1a" 
                  fontSize="2xl" 
                  fontWeight="700"
                  mt={2}
                >
                  {stat.value}
                </StatNumber>
                <StatHelpText mb={0}>
                  <Badge 
                    colorScheme={stat.trend === 'up' ? 'green' : 'red'}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {stat.change}
                  </Badge>
                </StatHelpText>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>

        {/* Welcome Card */}
        <Box
          bg="white"
          p={8}
          borderRadius="20px"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
          border="1px solid"
          borderColor="#e5e7eb"
        >
          <VStack spacing={4} align="start">
            <Heading size="lg" color="#374151" fontWeight="700">
              Bienvenue sur JARVIS Intelligence Platform
            </Heading>
            <Text color="#6b7280" fontSize="md" lineHeight="1.6">
              Votre plateforme d'analyse conversationnelle et d'insights analytiques 
              pour optimiser l'expérience de vos membres et maximiser vos revenus.
            </Text>
            <HStack spacing={3} mt={4}>
              <Badge colorScheme="blue" variant="subtle" px={3} py={1}>
                IA Conversationnelle
              </Badge>
              <Badge colorScheme="green" variant="subtle" px={3} py={1}>
                Analytics Prédictives
              </Badge>
              <Badge colorScheme="purple" variant="subtle" px={3} py={1}>
                Revenus Publicitaires
              </Badge>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
} 