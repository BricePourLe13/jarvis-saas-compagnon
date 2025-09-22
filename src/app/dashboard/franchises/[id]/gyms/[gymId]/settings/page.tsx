/**
 * ⚙️ GYM SETTINGS - CONFIGURATION SALLE
 * Paramètres avec nouvelle architecture
 */

'use client'

import { useState, useEffect } from 'react'
import { Box, Text } from '@chakra-ui/react'
import SentryMainLayout from '@/components/dashboard/layouts/SentryMainLayout'

interface SettingsPageProps {
  params: Promise<{ id: string; gymId: string }>
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; gymId: string } | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        setResolvedParams(resolved)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    resolveParams()
  }, [params])

  if (!resolvedParams) {
    return <Box>Loading...</Box>
  }

  return (
    <SentryMainLayout
      currentPath={['dashboard', 'franchises', resolvedParams.id, 'gyms', resolvedParams.gymId, 'settings']}
      gymId={resolvedParams.gymId}
      franchiseId={resolvedParams.id}
    >
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Paramètres de la Salle
        </Text>
        <Text color="gray.600">
          Configuration générale, utilisateurs, permissions...
        </Text>
      </Box>
    </SentryMainLayout>
  )
}



