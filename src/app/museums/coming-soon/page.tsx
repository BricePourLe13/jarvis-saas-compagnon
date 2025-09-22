'use client'

import { 
  Box, 
  Container, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Button,
  Icon,
  Badge,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { FaUniversity, FaArrowLeft, FaEnvelope, FaBell } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MuseumsComingSoonPage() {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const cardBg = useColorModeValue('white', 'gray.800')
  const bgGradient = useColorModeValue(
    'linear(to-br, purple.50, pink.50)',
    'linear(to-br, gray.900, purple.900)'
  )

  const handleNotifyMe = async () => {
    if (!email) {
      toast({
        title: 'Email requis',
        description: 'Veuillez saisir votre adresse email',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    
    // Simulation d'inscription à la newsletter
    setTimeout(() => {
      toast({
        title: 'Inscription réussie !',
        description: 'Nous vous notifierons dès que JARVIS Museums sera disponible.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      setEmail('')
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <Box minH="100vh" bg={bgGradient} display="flex" alignItems="center">
      <Container maxW="2xl">
        <VStack spacing={8}>
          {/* Back to home */}
          <Button
            variant="ghost"
            leftIcon={<FaArrowLeft />}
            onClick={() => router.push('/')}
            alignSelf="flex-start"
          >
            Retour à l'accueil
          </Button>

          {/* Coming Soon Card */}
          <Card bg={cardBg} shadow="2xl" borderRadius="2xl" w="full">
            <CardBody p={12}>
              <VStack spacing={8} textAlign="center">
                {/* Header */}
                <VStack spacing={4}>
                  <HStack spacing={3}>
                    <Icon as={FaUniversity} boxSize={12} color="purple.500" />
                    <VStack align="start" spacing={0}>
                      <Heading size="2xl" color="purple.600">
                        JARVIS Museums
                      </Heading>
                      <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                        Bientôt disponible
                      </Badge>
                    </VStack>
                  </HStack>
                  
                  <Text fontSize="xl" color="gray.600" maxW="lg">
                    Révolutionnez l'expérience muséale avec un guide IA interactif 
                    qui enrichit chaque visite culturelle.
                  </Text>
                </VStack>

                {/* Features Preview */}
                <VStack spacing={4} w="full" maxW="md">
                  <Heading size="md" color="gray.700">
                    Fonctionnalités à venir :
                  </Heading>
                  
                  <VStack spacing={3} align="start" w="full">
                    <HStack spacing={3}>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text color="gray.600">Guide vocal intelligent et contextuel</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text color="gray.600">Parcours personnalisés par visiteur</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text color="gray.600">Contenu adaptatif selon les intérêts</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text color="gray.600">Analytics et insights visiteurs</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text color="gray.600">Intégration multilingue</Text>
                    </HStack>
                  </VStack>
                </VStack>

                {/* Newsletter Signup */}
                <VStack spacing={4} w="full" maxW="md" pt={6} borderTop="1px" borderColor="gray.200">
                  <VStack spacing={2}>
                    <Icon as={FaBell} boxSize={6} color="purple.500" />
                    <Heading size="md" color="gray.700">
                      Soyez notifié du lancement
                    </Heading>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Inscrivez-vous pour être parmi les premiers à découvrir JARVIS Museums
                    </Text>
                  </VStack>

                  <VStack spacing={3} w="full">
                    <FormControl>
                      <FormLabel srOnly>Adresse email</FormLabel>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>
                    
                    <Button
                      colorScheme="purple"
                      size="lg"
                      w="full"
                      leftIcon={<FaEnvelope />}
                      onClick={handleNotifyMe}
                      isLoading={isSubmitting}
                      loadingText="Inscription..."
                    >
                      Me notifier du lancement
                    </Button>
                  </VStack>
                </VStack>

                {/* Timeline */}
                <VStack spacing={2} pt={4}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Calendrier prévisionnel :
                  </Text>
                  <VStack spacing={1} fontSize="sm" color="gray.600">
                    <Text>• Q1 2024 : Développement et tests</Text>
                    <Text>• Q2 2024 : Programme bêta avec musées partenaires</Text>
                    <Text>• Q3 2024 : Lancement commercial</Text>
                  </VStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  )
}


