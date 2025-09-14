/**
 * 🏋️ GYM DÉTAIL
 * REDIRECTION VERS NOUVELLE VERSION SENTRY
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function GymRedirect({ params }: { params: Promise<{ id: string, gymId: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string, gymId: string } | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      const { id, gymId } = await params
      setResolvedParams({ id, gymId })
      // Redirection vers la nouvelle architecture Overview
      router.replace(`/dashboard/franchises/${id}/gyms/${gymId}/overview`)
    }
    resolveParams()
  }, [router, params])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers la nouvelle architecture...</Text>
      </VStack>
    </Box>
  )
}