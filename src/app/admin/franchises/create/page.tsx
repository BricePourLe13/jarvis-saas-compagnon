"use client"
import { 
  Box, 
  VStack,
  HStack,
  Heading, 
  Text, 
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Icon,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

interface FormData {
  name: string
  contact_email: string
  contact_phone: string
  contact_name: string
}

export default function CreateFranchisePage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_email: '',
    contact_phone: '',
    contact_name: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const toast = useToast()

  // Animations subtiles
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.23, 1, 0.32, 1] 
      }
    }
  }

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la franchise est requis'
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'L\'email de contact est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Format d\'email invalide'
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Le nom du contact est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/franchises/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      setSuccess(true)
      toast({
        title: "Franchise créée !",
        description: "La franchise a été créée avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Redirection après succès
      setTimeout(() => {
        router.push('/admin/franchises')
      }, 2000)

    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (success) {
    return (
      <Box 
        minH="100vh" 
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <MotionVStack
          spacing={6}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            w={16}
            h={16}
            bg="black"
            borderRadius="2px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={CheckCircle} color="white" boxSize={8} />
          </Box>
          
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="500" color="black">
              Franchise créée
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="400">
              Redirection en cours...
            </Text>
          </VStack>
        </MotionVStack>
      </Box>
    )
  }

  return (
    <Box 
      minH="100vh" 
      bg="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
    >
      {/* Pattern de points subtil */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.02}
        bgImage="radial-gradient(circle, black 1px, transparent 1px)"
        bgSize="24px 24px"
        pointerEvents="none"
      />

      <MotionVStack
        spacing={10}
        align="stretch"
        maxW="600px"
        mx="auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} align="start">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              color="gray.600"
              fontSize="sm"
              fontWeight="400"
              px={3}
              py={2}
              h="auto"
              borderRadius="2px"
              _hover={{ 
                color: 'black', 
                bg: 'gray.50',
                transition: "all 0.15s ease"
              }}
            >
              Retour
            </Button>
            
            <VStack spacing={2} align="start">
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  bg="black"
                  borderRadius="2px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={Building2} color="white" boxSize={5} />
                </Box>
                <VStack spacing={0} align="start">
                  <Heading 
                    size="xl" 
                    color="black"
                    fontWeight="400"
                    letterSpacing="-0.5px"
                  >
                    Nouvelle franchise
                  </Heading>
                  <Text 
                    color="gray.600" 
                    fontSize="lg"
                    fontWeight="400"
                  >
                    Créer une nouvelle franchise JARVIS
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </MotionBox>

        {/* Formulaire */}
        <MotionBox variants={itemVariants}>
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="2px"
            p={8}
            shadow="0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              bg: 'linear-gradient(90deg, transparent, gray.100, transparent)',
            }}
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                {/* Nom de la franchise */}
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="500" 
                    color="black"
                    mb={2}
                  >
                    Nom de la franchise
                  </FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Fitness Premium Paris"
                    size="lg"
                    borderRadius="2px"
                    borderColor="gray.300"
                    bg="white"
                    _focus={{
                      borderColor: "black",
                      boxShadow: "0 0 0 1px black"
                    }}
                    _hover={{
                      borderColor: "gray.400"
                    }}
                    fontFamily="system-ui"
                  />
                  <FormErrorMessage fontSize="sm" color="gray.600">
                    {errors.name}
                  </FormErrorMessage>
                </FormControl>

                {/* Email de contact */}
                <FormControl isInvalid={!!errors.contact_email} isRequired>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="500" 
                    color="black"
                    mb={2}
                  >
                    Email de contact
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@franchise.com"
                    size="lg"
                    borderRadius="2px"
                    borderColor="gray.300"
                    bg="white"
                    _focus={{
                      borderColor: "black",
                      boxShadow: "0 0 0 1px black"
                    }}
                    _hover={{
                      borderColor: "gray.400"
                    }}
                    fontFamily="system-ui"
                  />
                  <FormErrorMessage fontSize="sm" color="gray.600">
                    {errors.contact_email}
                  </FormErrorMessage>
                </FormControl>

                {/* Nom du contact */}
                <FormControl isInvalid={!!errors.contact_name} isRequired>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="500" 
                    color="black"
                    mb={2}
                  >
                    Nom du responsable
                  </FormLabel>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Jean Dupont"
                    size="lg"
                    borderRadius="2px"
                    borderColor="gray.300"
                    bg="white"
                    _focus={{
                      borderColor: "black",
                      boxShadow: "0 0 0 1px black"
                    }}
                    _hover={{
                      borderColor: "gray.400"
                    }}
                    fontFamily="system-ui"
                  />
                  <FormErrorMessage fontSize="sm" color="gray.600">
                    {errors.contact_name}
                  </FormErrorMessage>
                </FormControl>

                {/* Téléphone (optionnel) */}
                <FormControl>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="500" 
                    color="black"
                    mb={2}
                  >
                    Téléphone
                    <Text as="span" color="gray.500" fontWeight="400" ml={1}>
                      (optionnel)
                    </Text>
                  </FormLabel>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="01 23 45 67 89"
                    size="lg"
                    borderRadius="2px"
                    borderColor="gray.300"
                    bg="white"
                    _focus={{
                      borderColor: "black",
                      boxShadow: "0 0 0 1px black"
                    }}
                    _hover={{
                      borderColor: "gray.400"
                    }}
                    fontFamily="system-ui"
                  />
                </FormControl>

                {/* Boutons */}
                <HStack spacing={4} pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    borderRadius="2px"
                    borderColor="gray.300"
                    color="gray.700"
                    fontWeight="400"
                    fontSize="sm"
                    px={6}
                    py={3}
                    _hover={{
                      bg: "gray.50",
                      borderColor: "gray.400"
                    }}
                    flex="1"
                  >
                    Annuler
                  </Button>
                  
                  <Button
                    type="submit"
                    bg="black"
                    color="white"
                    isLoading={loading}
                    loadingText="Création..."
                    borderRadius="2px"
                    fontWeight="500"
                    fontSize="sm"
                    px={6}
                    py={3}
                    _hover={{
                      bg: "gray.900"
                    }}
                    _active={{
                      transform: "translateY(0)"
                    }}
                    spinner={<Spinner size="sm" color="white" />}
                    flex="1"
                  >
                    Créer la franchise
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Box>
        </MotionBox>
      </MotionVStack>
    </Box>
  )
} 