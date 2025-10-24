/**
 * 🏠 DASHBOARD PRINCIPAL UNIFIÉ
 * Point d'entrée unique avec vue adaptée au rôle utilisateur
 * REDIRECTION VERS NOUVEAU DASHBOARD V2 (OVERVIEW)
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirection immédiate vers le nouveau dashboard V2 (Overview)
    router.replace('/dashboard/overview')
  }, [router])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Chargement du dashboard...</Text>
      </VStack>
    </Box>
  )
}