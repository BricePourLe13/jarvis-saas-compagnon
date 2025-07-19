'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Text, Spinner, VStack } from '@chakra-ui/react'

// Import alternatif pour tester
let createClient: any = null

async function loadSupabaseClient() {
  try {
    const module = await import('../../lib/supabase-simple')
    return module.createClient
  } catch (error) {
    console.error('Failed to load Supabase client:', error)
    return null
  }
}

export default function TestDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function initSupabase() {
      try {
        createClient = await loadSupabaseClient()
        if (!createClient) {
          setError('Impossible de charger le client Supabase')
          return
        }
        
        const supabase = createClient()
        console.log('✅ Client Supabase chargé:', typeof supabase)
        
        setLoading(false)
      } catch (err) {
        console.error('Erreur:', err)
        setError(`Erreur de chargement: ${err}`)
        setLoading(false)
      }
    }
    
    initSupabase()
  }, [])

  if (loading) {
    return (
      <Box minH="100vh" bg="linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="xl" color="purple.400" />
          <Text color="white" fontSize="xl">Test de chargement Supabase...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box minH="100vh" bg="linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Text color="red.400" fontSize="xl">❌ Erreur</Text>
          <Text color="white" fontSize="md" textAlign="center">{error}</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4}>
        <Text color="green.400" fontSize="xl">✅ Supabase chargé avec succès!</Text>
        <Text color="white" fontSize="md">Le module Supabase fonctionne correctement.</Text>
      </VStack>
    </Box>
  )
}
