/**
 * 🚨 ISSUE DETAIL PAGE
 * Détails d'une issue spécifique
 */

'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'

export default function IssueDetailPage() {
  const router = useRouter()
  const params = useParams()
  const issueId = params.id as string

  return (
    <SentryDashboardLayout
      title={`Issue #${issueId}`}
      subtitle="Détails de l'alerte"
      showFilters={false}
    >
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          <Button
            leftIcon={<ArrowLeft size={16} />}
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            onClick={() => router.push('/dashboard/issues')}
          >
            Retour aux issues
          </Button>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Page en construction</AlertTitle>
            <AlertDescription>
              Les détails de l'issue #{issueId} seront affichés ici prochainement.
            </AlertDescription>
          </Alert>
        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}

