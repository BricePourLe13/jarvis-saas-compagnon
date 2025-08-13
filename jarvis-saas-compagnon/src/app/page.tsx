"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Flex,
  Grid
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import JarvisAvatar from '@/components/common/JarvisAvatar'
import HCaptcha from '@hcaptcha/react-hcaptcha'

let createClient: any = null
async function loadSupabaseClient() {
  if (!createClient) {
    const supabaseModule = await import('../lib/supabase-admin')
    createClient = supabaseModule.createBrowserClientWithConfig
  }
  return createClient()
}

// Composant avec formes fluides modernes
const ModernFluidShapes = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Box position="absolute" inset={0} overflow="hidden">
      {/* Grande forme fluide principale */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '70%',
          height: '80%',
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.6) 0%, rgba(209, 213, 219, 0.4) 50%, rgba(229, 231, 235, 0.3) 100%)',
          borderRadius: '50% 30% 60% 40%',
          filter: 'blur(1px)'
        }}
        animate={{
          borderRadius: [
            '50% 30% 60% 40%',
            '40% 60% 30% 50%',
            '60% 40% 50% 30%',
            '50% 30% 60% 40%'
          ],
          rotate: [0, 10, -5, 0],
          scale: [1, 1.05, 0.98, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Forme fluide secondaire */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '60%',
          height: '70%',
          background: 'linear-gradient(225deg, rgba(107, 114, 128, 0.4) 0%, rgba(156, 163, 175, 0.3) 60%, rgba(209, 213, 219, 0.2) 100%)',
          borderRadius: '40% 50% 30% 60%',
          filter: 'blur(2px)'
        }}
        animate={{
          borderRadius: [
            '40% 50% 30% 60%',
            '60% 30% 50% 40%',
            '30% 60% 40% 50%',
            '40% 50% 30% 60%'
          ],
          rotate: [0, -15, 8, 0],
          scale: [1, 0.95, 1.03, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      />

      {/* Forme fluide accent */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '20%',
          width: '50%',
          height: '60%',
          background: 'linear-gradient(45deg, rgba(229, 231, 235, 0.5) 0%, rgba(243, 244, 246, 0.3) 100%)',
          borderRadius: '60% 40% 50% 30%',
          filter: 'blur(1.5px)'
        }}
        animate={{
          borderRadius: [
            '60% 40% 50% 30%',
            '30% 50% 40% 60%',
            '50% 30% 60% 40%',
            '60% 40% 50% 30%'
          ],
          rotate: [0, 12, -8, 0],
          scale: [1, 1.08, 0.94, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Petites formes flottantes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${15 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            width: `${40 + i * 8}px`,
            height: `${40 + i * 8}px`,
            background: `linear-gradient(${45 + i * 60}deg, rgba(${156 - i * 10}, ${163 - i * 8}, ${175 - i * 12}, ${0.4 - i * 0.05}) 0%, rgba(${209 + i * 8}, ${213 + i * 6}, ${219 + i * 4}, ${0.2 - i * 0.02}) 100%)`,
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}
          animate={{
            y: [0, -20 - i * 5, 0],
            x: [0, Math.sin(i) * 15, 0],
            scale: [1, 1.2 + i * 0.1, 1],
            opacity: [0.4 - i * 0.05, 0.7 - i * 0.08, 0.4 - i * 0.05]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
        />
      ))}

      {/* Formes géométriques subtiles */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15%',
          left: '30%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(156, 163, 175, 0.2) 100%)',
          borderRadius: '20px',
          transform: 'rotate(45deg)'
        }}
        animate={{
          rotate: [45, 135, 225, 315, 45],
          scale: [1, 1.1, 0.9, 1.05, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '25%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(225deg, rgba(156, 163, 175, 0.4) 0%, rgba(209, 213, 219, 0.2) 100%)',
          borderRadius: '50%'
        }}
        animate={{
          scale: [1, 1.3, 0.8, 1],
          opacity: [0.4, 0.7, 0.3, 0.4]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />

      {/* Éléments de profondeur */}
      <motion.div
        style={{
          position: 'absolute',
          top: '40%',
          left: '10%',
          width: '120px',
          height: '40px',
          background: 'linear-gradient(90deg, rgba(107, 114, 128, 0.2) 0%, rgba(156, 163, 175, 0.1) 100%)',
          borderRadius: '20px',
          transform: 'rotate(25deg)',
          filter: 'blur(2px)'
        }}
        animate={{
          x: [0, 30, -15, 0],
          rotate: [25, 35, 15, 25]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Particules de lumière */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            width: '4px',
            height: '4px',
            backgroundColor: 'var(--chakra-colors-gray-300)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(209, 213, 219, 0.6)'
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Gradient overlay pour unifier */}
      <Box
        position="absolute"
        inset={0}
        background="radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(248, 249, 250, 0.3) 70%, rgba(248, 249, 250, 0.6) 100%)"
        pointerEvents="none"
      />
    </Box>
  )
}

// Composant illustration JARVIS (côté gauche)
const JarvisIllustration = () => {
  return (
    <Box position="relative" w="full" h="full" overflow="hidden">
      {/* Background avec pattern */}
        <Box
        position="absolute"
        inset={0}
          bg="linear-gradient(135deg, var(--chakra-colors-gray-50) 0%, var(--chakra-colors-gray-200) 50%, var(--chakra-colors-gray-300) 100%)"
      />
      
      <ModernFluidShapes />
      
      {/* Avatar JARVIS central avec composant réutilisable */}
      <Box position="relative" zIndex={2} h="full">
        <JarvisAvatar 
          size={200}
          showText={true}
          title="Intelligence Platform"
          description="Analyse conversationnelle et insights analytiques pour salles de sport"
          variant="default"
          status="idle"
        />
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<any>(null)
  const router = useRouter()

  // Force clear des champs au montage du composant
  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Vérifier que le CAPTCHA est résolu
      if (!captchaToken && process.env.NODE_ENV === 'production') {
        setError('Veuillez compléter le CAPTCHA')
        setLoading(false)
        return
      }
      


      const supabase = await loadSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: captchaToken
        }
      })
      
      if (error) { 
        console.error('❌ Erreur Supabase Auth:', error)
        console.error('❌ Code d\'erreur:', error.status)
        console.error('❌ Message détaillé:', error.message)
        setError(error.message)
        setLoading(false)
        // Reset hCaptcha en cas d'erreur
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha()
          setCaptchaToken(null)
        }
        return 
      }
      
      if (data.user) {
        // Vérifier le rôle de l'utilisateur pour rediriger correctement
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        // Indiquer le succès avant la redirection
        setSuccess(true)
        
        // Redirection basée sur le rôle
        setTimeout(() => {
          // Unifie la redirection: admin et non-admin
          const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'franchise_owner' || userProfile?.role === 'franchise_admin'
          router.push(isAdmin ? '/admin' : '/admin')
        }, 800)
      }
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="bg.surface">
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} h="100vh">
        {/* Côté gauche - Avatar JARVIS avec sphère du kiosk */}
        <Box display={{ base: "none", lg: "block" }}>
          <JarvisIllustration />
        </Box>
        
        {/* Côté droit - Formulaire */}
        <Flex align="center" justify="center" p={8} bg="bg.subtle">
          <Box w="full" maxW="400px">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <VStack spacing={6} mb={10} textAlign="center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="800"
                    color="text.default"
                    letterSpacing="4px"
                  >
                    JARVIS
                  </Text>
                </motion.div>
                
                <VStack spacing={2}>
                  <Heading 
                    as="h1" 
                    size="xl" 
                    color="text.default"
                    fontWeight="700"
                  >
                    Bienvenue
                  </Heading>
                  <Text color="text.muted" fontSize="md">
                    Connectez-vous à votre espace
                  </Text>
                </VStack>
              </VStack>

              {/* Formulaire */}
                <Box
                as="form" 
                onSubmit={handleLogin}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              >
                {/* Champs cachés pour tromper l'autocomplétion */}
                <Input 
                  type="text" 
                  name="username" 
                  autoComplete="username" 
                  style={{ display: 'none' }} 
                  tabIndex={-1}
                />
                <Input 
                  type="password" 
                  name="password" 
                  autoComplete="current-password" 
                  style={{ display: 'none' }} 
                  tabIndex={-1}
                />
                
                <VStack spacing={6}>
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%' }}
                      >
                        <Box
                          bg="rgba(239, 68, 68, 0.1)"
                          border="1px solid rgba(239, 68, 68, 0.3)"
                          borderRadius="12px"
                          p={3}
                          w="full"
                        >
                          <Text color="red.600" fontSize="sm" textAlign="center">
                            {error}
                          </Text>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FormControl>
                    <FormLabel color="text.default" fontSize="sm" fontWeight="600" mb={2}>
                      Email
                    </FormLabel>
                    <Input
                      variant="outline"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      bg="bg.surface"
                      border="1px solid"
                      borderColor="border.default"
                      borderRadius="12px"
                      h="50px"
                      fontSize="15px"
                      color="text.default"
                      _placeholder={{ color: "gray.400" }}
                      _focus={{}}
                      _hover={{}}
                      autoComplete="off"
                      autoFocus={false}
                      name="email_field_unique"
                      required
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="text.default" fontSize="sm" fontWeight="600" mb={2}>
                      Mot de passe
                    </FormLabel>
                    <Input
                      variant="outline"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      bg="bg.surface"
                      border="1px solid"
                      borderColor="border.default"
                      borderRadius="12px"
                      h="50px"
                      fontSize="15px"
                      color="text.default"
                      _placeholder={{ color: "gray.400" }}
                      _focus={{}}
                      _hover={{}}
                      autoComplete="new-password"
                      name="password_field_unique"
                      required
                    />
                  </FormControl>

                  {/* hCaptcha */}
                  <Box display="flex" justifyContent="center" w="full">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "59b4e250-bc3c-4940-bf1c-38b0883a1a14"}
                      onVerify={(token) => {
                        console.log('✅ hCaptcha vérifié:', token)
                        setCaptchaToken(token)
                      }}
                      onError={(err) => {
                        console.error('❌ hCaptcha erreur:', err)
                        setCaptchaToken(null)
                      }}
                      onExpire={() => {
                        console.log('⏰ hCaptcha expiré')
                        setCaptchaToken(null)
                      }}
                      onLoad={() => {
                        console.log('📦 hCaptcha chargé')
                      }}
                      theme="light"
                      size="normal"
                    />
                  </Box>
                  


                  <Button
                    type="submit"
                    w="full"
                    h="50px"
                    variant={loading ? "secondary" : "primary"}
                    borderRadius="12px"
                    fontWeight="600"
                    fontSize="15px"
                    isDisabled={loading}
                    transition="all 0.2s ease"
                    position="relative"
                    overflow="hidden"
                  >
                    {loading ? (
                      success ? (
                        // État succès - Animation de checkmark
                        <HStack spacing={3} justify="center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, ease: "backOut" }}
                          >
                            <Box
                              w="20px"
                              h="20px"
                              border="2px solid white"
                              borderRadius="50%"
                              position="relative"
                            >
                              <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)'
                                }}
                              >
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <motion.path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                  />
                                </svg>
                              </motion.div>
                            </Box>
                          </motion.div>
                          <Text fontSize="14px" fontWeight="600">
                            Connecté ! Redirection...
                          </Text>
                        </HStack>
                      ) : (
                        // État loading - Animation dots
                        <HStack spacing={2} justify="center">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Box w="6px" h="6px" bg="white" borderRadius="50%" />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          >
                            <Box w="6px" h="6px" bg="white" borderRadius="50%" />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          >
                            <Box w="6px" h="6px" bg="white" borderRadius="50%" />
                          </motion.div>
                          <Text ml={2} fontSize="14px" opacity={0.9}>
                            Connexion...
                          </Text>
                        </HStack>
                      )
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </VStack>
              </Box>

              {/* Footer */}
              <Text 
                textAlign="center" 
                color="gray.400" 
                fontSize="xs" 
                mt={8}
                letterSpacing="1px"
              >
                PLATEFORME SÉCURISÉE
              </Text>
            </motion.div>
          </Box>
        </Flex>
      </Grid>
    </Box>
  )
}
