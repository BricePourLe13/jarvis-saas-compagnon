/**
 * ⚙️ SETTINGS PAGE
 * Paramètres utilisateur et système
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
  Button,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import {
  Settings,
  User,
  Bell,
  Lock,
  Database
} from 'lucide-react'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'

export default function SettingsPage() {
  return (
    <SentryDashboardLayout
      title="Paramètres"
      subtitle="Configuration de votre compte et préférences"
      showFilters={false}
    >
      <Box p={6}>
        <Card>
          <CardBody>
            <Tabs>
              <TabList>
                <Tab>
                  <HStack>
                    <User size={16} />
                    <Text>Profil</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <Bell size={16} />
                    <Text>Notifications</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <Lock size={16} />
                    <Text>Sécurité</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <Database size={16} />
                    <Text>Système</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>Section en développement</AlertTitle>
                      <AlertDescription>
                        Les paramètres de profil seront disponibles prochainement.
                      </AlertDescription>
                    </Alert>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" flex="1">
                        Notifications par email
                      </FormLabel>
                      <Switch defaultChecked />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" flex="1">
                        Alertes critiques
                      </FormLabel>
                      <Switch defaultChecked />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" flex="1">
                        Rapports hebdomadaires
                      </FormLabel>
                      <Switch />
                    </FormControl>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>Section en développement</AlertTitle>
                      <AlertDescription>
                        Les paramètres de sécurité seront disponibles prochainement.
                      </AlertDescription>
                    </Alert>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <FormControl>
                      <FormLabel>Thème</FormLabel>
                      <Select defaultValue="light">
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="auto">Automatique</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Langue</FormLabel>
                      <Select defaultValue="fr">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Box>
    </SentryDashboardLayout>
  )
}


