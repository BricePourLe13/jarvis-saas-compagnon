/**
 * 🔄 REDIRECTION ADMIN → DASHBOARD
 * Redirige automatiquement l'ancien /admin vers le nouveau /dashboard
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Text, Spinner } from '@chakra-ui/react'

export default function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirection immédiate vers le nouveau dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers le nouveau dashboard...</Text>
      </VStack>
    </Box>
  )
}

