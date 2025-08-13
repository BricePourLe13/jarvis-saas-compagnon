'use client'

import {
  Box,
  HStack,
  VStack,
  Text,
  Code,
  Icon,
  Badge,
  SimpleGrid
} from '@chakra-ui/react'
import { ChevronRight, Info } from 'lucide-react'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface AuditChangeDisplayProps {
  oldValues: Record<string, any>
  newValues: Record<string, any>
  fieldsChanged?: string[]
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function AuditChangeDisplay({ 
  oldValues, 
  newValues, 
  fieldsChanged 
}: AuditChangeDisplayProps) {
  
  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'full_name': 'Nom complet',
      'email': 'Email',
      'role': 'Rôle',
      'is_active': 'Statut',
      'franchise_access': 'Accès franchises',
      'gym_access': 'Accès salles',
      'dashboard_preferences': 'Préférences dashboard',
      'notification_settings': 'Paramètres notifications'
    }
    return fieldNames[field] || field
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'Non défini'
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Actif' : 'Inactif'
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} élément(s)` : 'Aucun'
    }
    
    if (typeof value === 'object') {
      return 'Paramètres personnalisés'
    }
    
    return String(value)
  }

  const getChangeType = (oldVal: any, newVal: any): 'added' | 'removed' | 'modified' => {
    if (!oldVal && newVal) return 'added'
    if (oldVal && !newVal) return 'removed'
    return 'modified'
  }

  const getChangeColor = (changeType: 'added' | 'removed' | 'modified') => {
    switch (changeType) {
      case 'added': return 'green'
      case 'removed': return 'red'
      case 'modified': return 'blue'
      default: return 'gray'
    }
  }

  const renderValueChange = (field: string, oldVal: any, newVal: any) => {
    const changeType = getChangeType(oldVal, newVal)
    
    return (
      <Box
        key={field}
        p={3}
        bg="bg.subtle"
        borderRadius="8px"
        border="1px solid"
        borderColor="border.default"
        _hover={{ bg: "bg.muted" }}
        transition="all 0.2s"
      >
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="600" color="text.default">
              {getFieldDisplayName(field)}
            </Text>
            <Badge
              colorScheme={getChangeColor(changeType)}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="6px"
            >
              {changeType === 'added' ? 'Ajouté' : 
               changeType === 'removed' ? 'Supprimé' : 'Modifié'}
            </Badge>
          </HStack>
          
          <HStack spacing={2} align="center">
            <Code 
              fontSize="xs" 
              bg="red.50" 
              color="red.600" 
              px={2} 
              py={1} 
              borderRadius="4px"
              flex={1}
              isTruncated
            >
              {formatValue(oldVal)}
            </Code>
            <Icon as={ChevronRight} boxSize={3} color="gray.500" />
            <Code 
              fontSize="xs" 
              bg="green.50" 
              color="green.600" 
              px={2} 
              py={1} 
              borderRadius="4px"
              flex={1}
              isTruncated
            >
              {formatValue(newVal)}
            </Code>
          </HStack>
        </VStack>
      </Box>
    )
  }

  // Déterminer quels champs afficher
  const fieldsToShow = fieldsChanged || Object.keys({ ...oldValues, ...newValues })
  const hasChanges = fieldsToShow.some(field => 
    oldValues[field] !== newValues[field]
  )

  if (!hasChanges) {
    return (
      <Box p={3} bg="#f0f9ff" borderRadius="8px" border="1px solid #0ea5e9">
        <HStack spacing={2}>
          <Icon as={Info} boxSize={4} color="#0369a1" />
          <Text fontSize="sm" color="#0369a1">
            Aucun changement détecté
          </Text>
        </HStack>
      </Box>
    )
  }

  return (
    <VStack spacing={3} align="stretch">
      <Text fontSize="xs" fontWeight="600" color="#374151">
        Détail des modifications ({fieldsToShow.filter(field => 
          oldValues[field] !== newValues[field]
        ).length})
      </Text>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {fieldsToShow.map(field => {
          const oldVal = oldValues[field]
          const newVal = newValues[field]
          
          // Ne montrer que les champs qui ont vraiment changé
          if (oldVal === newVal) return null
          
          return renderValueChange(field, oldVal, newVal)
        })}
      </SimpleGrid>
    </VStack>
  )
}