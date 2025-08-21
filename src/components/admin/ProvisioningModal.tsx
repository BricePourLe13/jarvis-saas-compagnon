"use client"
import { 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Icon,
  Code,
  useClipboard,
  useToast,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react'
import { Copy, ExternalLink, Clock, Monitor, CheckCircle } from 'lucide-react'
import { KioskProvisioningInfo } from '@/types/franchise'

interface ProvisioningModalProps {
  isOpen: boolean
  onClose: () => void
  provisioningInfo: KioskProvisioningInfo
  gymName: string
}

export default function ProvisioningModal({
  isOpen,
  onClose,
  provisioningInfo,
  gymName
}: ProvisioningModalProps) {
  const toast = useToast()
  const { onCopy: copyCode } = useClipboard(provisioningInfo.provisioning_code)
  const { onCopy: copyUrl } = useClipboard(provisioningInfo.kiosk_url)

  const handleCopyCode = () => {
    copyCode()
    toast({
      title: "Code copié !",
      description: "Le code de provisioning a été copié dans le presse-papier",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }

  const handleCopyUrl = () => {
    copyUrl()
    toast({
      title: "URL copiée !",
      description: "L'URL du kiosk a été copiée dans le presse-papier",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }

  const handleOpenKiosk = () => {
    window.open(provisioningInfo.kiosk_url, '_blank')
  }

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = new Date(provisioningInfo.expires_at) < new Date()
  const expiresInHours = Math.max(0, Math.ceil(
    (new Date(provisioningInfo.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
  ))

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={Monitor} color="blue.500" />
              <Text>Configuration Kiosk JARVIS</Text>
            </HStack>
            <Badge colorScheme="blue" fontSize="sm">
              {gymName}
            </Badge>
          </VStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6} align="stretch">
            
            {/* Statut */}
            <Alert status={isExpired ? "error" : "info"} borderRadius="12px">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="600">
                  {isExpired ? "Code expiré" : "Kiosk en attente d'activation"}
                </Text>
                <Text fontSize="sm">
                  {isExpired 
                    ? "Ce code d'activation a expiré. Créez une nouvelle salle pour générer un nouveau code."
                    : `Le kiosk sera automatiquement activé dès la saisie du code. Expire dans ${expiresInHours}h.`
                  }
                </Text>
              </VStack>
            </Alert>

            {!isExpired && (
              <>
                {/* Instructions */}
                <Box>
                  <Text fontWeight="600" mb={3} color="gray.800">
                    📋 Instructions d'installation
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color="gray.600">
                      1. Rendez-vous sur site avec l'écran du kiosk
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      2. Ouvrez un navigateur et allez sur l'URL ci-dessous
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      3. Saisissez le code d'activation à 6 caractères
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      4. Suivez les tests automatiques (micro, RFID, etc.)
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      5. Le kiosk sera automatiquement activé
                    </Text>
                  </VStack>
                </Box>

                <Divider />

                {/* URL du kiosk */}
                <Box>
                  <Text fontWeight="600" mb={3} color="gray.800">
                    🌐 URL du Kiosk
                  </Text>
                  <HStack spacing={3}>
                    <Code p={3} fontSize="md" flex={1} borderRadius="8px">
                      {provisioningInfo.kiosk_url}
                    </Code>
                    <Button size="sm" onClick={handleCopyUrl} colorScheme="gray">
                      <Icon as={Copy} />
                    </Button>
                    <Button size="sm" onClick={handleOpenKiosk} colorScheme="blue">
                      <Icon as={ExternalLink} />
                    </Button>
                  </HStack>
                </Box>

                {/* Code d'activation */}
                <Box>
                  <Text fontWeight="600" mb={3} color="gray.800">
                    🔑 Code d'Activation
                  </Text>
                  <HStack spacing={3}>
                    <Code 
                      p={4} 
                      fontSize="2xl" 
                      fontWeight="bold" 
                      fontFamily="mono"
                      flex={1} 
                      borderRadius="8px"
                      bg="blue.50"
                      color="blue.700"
                      textAlign="center"
                      border="2px solid"
                      borderColor="blue.200"
                    >
                      {provisioningInfo.provisioning_code}
                    </Code>
                    <Button onClick={handleCopyCode} colorScheme="blue">
                      <Icon as={Copy} />
                    </Button>
                  </HStack>
                </Box>

                {/* Expiration */}
                <Box>
                  <HStack spacing={2} mb={2}>
                    <Icon as={Clock} color="orange.500" size="sm" />
                    <Text fontWeight="600" color="gray.800" fontSize="sm">
                      Expiration
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Valide jusqu'au {formatExpiryDate(provisioningInfo.expires_at)}
                  </Text>
                  <Text fontSize="sm" color="orange.600" fontWeight="500">
                    ⏰ Expire dans {expiresInHours} heure{expiresInHours > 1 ? 's' : ''}
                  </Text>
                </Box>
              </>
            )}

          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {!isExpired && (
              <Button 
                leftIcon={<Icon as={ExternalLink} />}
                colorScheme="blue" 
                onClick={handleOpenKiosk}
              >
                Ouvrir le Kiosk
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
} 