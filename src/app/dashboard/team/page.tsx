/**
 * 👥 TEAM PAGE (SIMPLIFIED)
 * Gestion de l'équipe - Version simplifiée pour éviter conflits avec /admin/team
 */

'use client'

import {
  Box,
  VStack,
  Text,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button
} from '@chakra-ui/react'
import { Users, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'

export default function TeamPage() {
  const router = useRouter()

  return (
    <SentryDashboardLayout
      title="Équipe"
      subtitle="Gestion des membres de l'équipe"
      showFilters={false}
    >
      <Box p={6}>
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={2} flex="1">
                  <AlertTitle>Page Team</AlertTitle>
                  <AlertDescription>
                    Pour une gestion complète de l'équipe, veuillez utiliser la page d'administration.
                  </AlertDescription>
                  <SafeLink href="/dashboard/team">
                    <Button
                      colorScheme="blue"
                      size="sm"
                      rightIcon={<ArrowRight size={16} />}
                      mt={2}
                    >
                      Aller à la page Admin Team
                    </Button>
                  </SafeLink>
                </VStack>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </SentryDashboardLayout>
  )
}


