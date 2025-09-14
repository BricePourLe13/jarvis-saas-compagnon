/**
 * 🏢 FRANCHISE DÉTAIL
 * REDIRECTION VERS NOUVELLE VERSION SENTRY
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function FranchiseRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    // Redirection vers la nouvelle version Sentry
    router.replace(`/dashboard/franchises/${id}/sentry`)
  }, [router, id])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers le monitoring franchise...</Text>
      </VStack>
    </Box>
  )
}