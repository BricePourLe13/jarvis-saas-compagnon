'use client'

import { Box, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface MetricsData {
  activeSessions: number
  totalMembers: number
  dailyVisits: number
  avgSessionDuration: number
}

interface RealtimeMetricsPanelProps {
  gymId?: string
}

export default function RealtimeMetricsPanel({ gymId }: RealtimeMetricsPanelProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    activeSessions: 0,
    totalMembers: 0,
    dailyVisits: 0,
    avgSessionDuration: 0
  })

  useEffect(() => {
    // Simulation de données en temps réel
    const interval = setInterval(() => {
      setMetrics({
        activeSessions: Math.floor(Math.random() * 10),
        totalMembers: 150 + Math.floor(Math.random() * 50),
        dailyVisits: 25 + Math.floor(Math.random() * 15),
        avgSessionDuration: 180 + Math.floor(Math.random() * 120)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [gymId])

  return (
    <Box p={6} bg="white" borderRadius="lg" shadow="sm">
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        📊 Métriques Temps Réel
      </Text>
      
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat>
          <StatLabel>Sessions Actives</StatLabel>
          <StatNumber color="green.500">{metrics.activeSessions}</StatNumber>
          <StatHelpText>En cours</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Membres Total</StatLabel>
          <StatNumber color="blue.500">{metrics.totalMembers}</StatNumber>
          <StatHelpText>Inscrits</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Visites Aujourd'hui</StatLabel>
          <StatNumber color="purple.500">{metrics.dailyVisits}</StatNumber>
          <StatHelpText>Aujourd'hui</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Durée Moyenne</StatLabel>
          <StatNumber color="orange.500">{Math.round(metrics.avgSessionDuration / 60)}min</StatNumber>
          <StatHelpText>Par session</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  )
}
