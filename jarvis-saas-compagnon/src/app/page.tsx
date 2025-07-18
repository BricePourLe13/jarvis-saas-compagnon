'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Center,
  Icon,
  Flex,
} from '@chakra-ui/react'
import { Shield, Zap } from 'lucide-react'

// Import dynamique pour éviter les problèmes de build
let createClient: any = null

async function loadSupabaseClient() {
  try {
    const supabaseModule = await import('../lib/supabase-simple')
    createClient = supabaseModule.createClient
    return { createClient }
  } catch (error) {
    console.error('Failed to load Supabase:', error)
    return null
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supabaseReady, setSupabaseReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initializeSupabase()
  }, [])

  const initializeSupabase = async () => {
    const supabaseModules = await loadSupabaseClient()
    if (supabaseModules) {
      setSupabaseReady(true)
    } else {
      setError('Impossible de charger Supabase')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabaseReady || !createClient) {
      setError('Supabase n\'est pas encore prêt')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('Tentative de connexion avec:', { email })
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erreur d\'authentification:', error)
        setError(`Erreur de connexion: ${error.message}`)
        return
      }

      console.log('Connexion réussie:', data.user?.email)

      if (data.user) {
        console.log('✅ Authentification réussie pour:', data.user.email)
        
        // Note: Éviter les requêtes vers la table users à cause des politiques RLS
        // Le profil sera créé côté dashboard à partir des données d'auth
        
        // Redirection directe vers le dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)">
      <Flex minH="100vh" align="center" justify="center" p={4}>
        
        {/* Container principal */}
        <Box maxW="4xl" w="full">
          <Flex 
            bg="whiteAlpha.100" 
            borderRadius="2xl" 
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            overflow="hidden"
            direction={{ base: 'column', lg: 'row' }}
            minH="500px"
          >
            
            {/* Left side - Branding */}
            <Box
              flex="1"
              bg="linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)"
              p={10}
              display={{ base: 'none', lg: 'flex' }}
              flexDirection="column"
              justifyContent="space-between"
              position="relative"
            >
              <VStack align="start" gap={4}>
                <HStack>
                  <Icon as={Shield} boxSize={6} color="white" />
                  <Text fontSize="lg" fontWeight="medium" color="white">
                    JARVIS SaaS Platform
                  </Text>
                </HStack>
              </VStack>
              
              <Box>
                <Text fontSize="lg" color="white" mb={4}>
                  "L'assistant IA révolutionnaire qui transforme chaque interaction membre en data précieuse et opportunité commerciale."
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  JARVIS Team
                </Text>
              </Box>
            </Box>

            {/* Right side - Login Form */}
            <Box flex="1" p={8}>
              <VStack gap={6} align="stretch" maxW="350px" mx="auto" justify="center" h="full">
                
                {/* Header */}
                <VStack gap={4} align="center">
                  <HStack>
                    <Box
                      p={2}
                      bg="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                      borderRadius="lg"
                    >
                      <Icon as={Zap} boxSize={6} color="white" />
                    </Box>
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      bgGradient="linear(to-r, purple.400, blue.400)"
                      bgClip="text"
                    >
                      JARVIS
                    </Text>
                  </HStack>
                  <Heading size="lg" color="white" textAlign="center">
                    Connexion Plateforme
                  </Heading>
                  <Text color="whiteAlpha.700" textAlign="center">
                    Accédez à votre dashboard JARVIS
                  </Text>
                </VStack>

                {/* Login Form */}
                <Box
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  borderRadius="xl"
                  p={6}
                >
                  <form onSubmit={handleLogin}>
                    <VStack gap={4}>
                      
                      {error && (
                        <Box 
                          bg="red.500" 
                          color="white" 
                          p={3} 
                          borderRadius="md" 
                          w="full"
                          textAlign="center"
                        >
                          {error}
                        </Box>
                      )}

                      <Box w="full">
                        <Text color="white" mb={2} fontSize="sm" fontWeight="medium">
                          Email
                        </Text>
                        <Input
                          type="email"
                          placeholder="admin@jarvis.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          bg="whiteAlpha.100"
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                          color="white"
                          _placeholder={{ color: 'whiteAlpha.600' }}
                          _focus={{
                            borderColor: 'purple.400',
                            boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                          }}
                        />
                      </Box>

                      <Box w="full">
                        <Text color="white" mb={2} fontSize="sm" fontWeight="medium">
                          Mot de passe
                        </Text>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          bg="whiteAlpha.100"
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                          color="white"
                          _focus={{
                            borderColor: 'purple.400',
                            boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                          }}
                        />
                      </Box>

                      <Button
                        type="submit"
                        w="full"
                        bgGradient="linear(to-r, purple.500, blue.500)"
                        color="white"
                        _hover={{
                          bgGradient: "linear(to-r, purple.600, blue.600)",
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <HStack>
                            <Spinner size="sm" />
                            <Text>Connexion...</Text>
                          </HStack>
                        ) : (
                          'Se connecter'
                        )}
                      </Button>
                    </VStack>
                  </form>

                  <Center mt={6}>
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Besoin d'aide ? Contactez votre administrateur
                    </Text>
                  </Center>
                </Box>
              </VStack>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}
