import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Switch,
  Select,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Bell, Save } from 'lucide-react'
import type { NotificationSettings, User } from '@/types/franchise'

interface NotificationPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_notifications: true,
  push_notifications: true,
  reports_frequency: 'weekly'
}

export default function NotificationPreferencesModal({ isOpen, onClose, user, onSuccess }: NotificationPreferencesModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (isOpen && user) {
      setSettings(user.notification_settings || DEFAULT_SETTINGS)
    }
  }, [isOpen, user])

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_settings: settings })
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Préférences sauvegardées',
          description: 'Vos préférences de notifications ont été mises à jour.',
          status: 'success',
          duration: 3000,
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de sauvegarder les préférences',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#fff"
        borderRadius="16px"
        border="1px solid #e5e7eb"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        mx={4}
      >
        <ModalHeader p={6} pb={0}>
          <HStack spacing={4}>
            <Box p={3} bg="#f3f4f6" borderRadius="12px">
              <Bell size={20} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Préférences de notifications
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Personnalisez vos alertes et rapports
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} bg="#f3f4f6" borderRadius="8px" _hover={{ bg: "#e5e7eb" }} isDisabled={saving} />
        <ModalBody p={6} pt={4}>
          <VStack spacing={6} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="email_notifications" mb="0" fontWeight="600" color="#374151">
                Notifications par email
              </FormLabel>
              <Switch
                id="email_notifications"
                isChecked={settings.email_notifications}
                onChange={e => handleChange('email_notifications', e.target.checked)}
                colorScheme="blue"
                isDisabled={saving}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="push_notifications" mb="0" fontWeight="600" color="#374151">
                Notifications push
              </FormLabel>
              <Switch
                id="push_notifications"
                isChecked={settings.push_notifications}
                onChange={e => handleChange('push_notifications', e.target.checked)}
                colorScheme="green"
                isDisabled={saving}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="reports_frequency" fontWeight="600" color="#374151">
                Fréquence des rapports
              </FormLabel>
              <Select
                id="reports_frequency"
                value={settings.reports_frequency}
                onChange={e => handleChange('reports_frequency', e.target.value)}
                bg="white"
                border="1px solid #d1d5db"
                borderRadius="8px"
                fontSize="sm"
                isDisabled={saving}
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="space-between">
            <Text fontSize="sm" color="#6b7280">
              Vos préférences sont personnelles et modifiables à tout moment.
            </Text>
            <Button
              bg="#059669"
              color="white"
              borderRadius="12px"
              h="48px"
              px={6}
              fontWeight="600"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<Save size={18} />}
              _hover={{
                bg: "#047857",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s"
            >
              Sauvegarder
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}