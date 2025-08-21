'use client'

/**
 * 🔧 PAGE DE RÉPARATION BASE DE DONNÉES
 * 
 * Interface simple pour déclencher les réparations
 */

import { useState } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Icon
} from '@chakra-ui/react'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

interface RepairResult {
  name: string
  status: 'ok' | 'fixed' | 'warning' | 'error'
  message: string
}

interface RepairSummary {
  total: number
  fixed: number
  warnings: number
  errors: number
  ok: number
}

export default function DatabaseRepairPage() {
  const [isRepairing, setIsRepairing] = useState(false)
  const [results, setResults] = useState<RepairResult[]>([])
  const [summary, setSummary] = useState<RepairSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return CheckCircle
      case 'fixed': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return XCircle
      default: return Info
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'green'
      case 'fixed': return 'blue'
      case 'warning': return 'yellow'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const runRepairs = async () => {
    setIsRepairing(true)
    setError(null)
    setResults([])
    setSummary(null)

    try {
      const response = await fetch('/api/admin/repair-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setResults(result.data.repairs)
        setSummary(result.data.summary)
      } else {
        setError(result.error?.message || 'Erreur inconnue')
      }
    } catch (err: any) {
      // Log supprimé pour production
      setError(err.message || 'Erreur lors des réparations')
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
        
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>🔧 Réparation Base de Données</Heading>
          <Text color="gray.600">
            Cette page permet de diagnostiquer et réparer automatiquement les problèmes 
            de base de données identifiés lors de l'audit.
          </Text>
        </Box>

        {/* Actions */}
        <Box>
          <Button
            colorScheme="purple"
            size="lg"
            onClick={runRepairs}
            isLoading={isRepairing}
            loadingText="Réparation en cours..."
            leftIcon={isRepairing ? undefined : <Icon as={CheckCircle} />}
          >
            Démarrer les Réparations
          </Button>
        </Box>

        {/* Progress */}
        {isRepairing && (
          <Box>
            <Text mb={2}>Exécution des réparations...</Text>
            <Progress size="lg" isIndeterminate colorScheme="purple" />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Summary */}
        {summary && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>📊 Résumé</Heading>
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {summary.ok + summary.fixed}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Réussites</Text>
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                    {summary.warnings}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Avertissements</Text>
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {summary.errors}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Erreurs</Text>
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {summary.total}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Total</Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>📋 Détails des Réparations</Heading>
            <VStack spacing={3} align="stretch">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardBody>
                    <Box display="flex" alignItems="center" gap={3}>
                      <Icon 
                        as={getStatusIcon(result.status)} 
                        color={`${getStatusColor(result.status)}.500`}
                        boxSize={5}
                      />
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Text fontWeight="bold">{result.name}</Text>
                          <Badge colorScheme={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </Box>
                        <Text fontSize="sm" color="gray.600">
                          {result.message}
                        </Text>
                      </Box>
                    </Box>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        )}

        {/* Info */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Réparations automatiques incluses :</Text>
            <Text fontSize="sm">
              • Assignment des managers aux gyms<br/>
              • Vérification des relations entre tables<br/>
              • Nettoyage des sessions fantômes<br/>
              • Validation de la structure des données
            </Text>
          </Box>
        </Alert>

      </VStack>
    </Box>
  )
}
