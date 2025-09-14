/**
 * 💬 SESSION DÉTAIL
 * REDIRECTION VERS NOUVELLE VERSION SENTRY
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function SessionRedirect({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const { sessionId } = params

  useEffect(() => {
    // Redirection vers la nouvelle version Sentry
    router.replace(`/dashboard/sessions/${sessionId}/sentry`)
  }, [router, sessionId])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers la conversation...</Text>
      </VStack>
    </Box>
  )
}
