/**
 * 🏠 DASHBOARD PRINCIPAL UNIFIÉ
 * Point d'entrée unique avec vue adaptée au rôle utilisateur
 * REDIRECTION VERS NOUVEAU DASHBOARD SENTRY
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirection immédiate vers le nouveau dashboard Sentry
    router.replace('/dashboard/sentry')
  }, [router])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers le nouveau dashboard...</Text>
      </VStack>
    </Box>
  )
}