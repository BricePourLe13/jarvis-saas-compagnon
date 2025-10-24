/**
 * 🏗️ SENTRY MAIN LAYOUT - ARCHITECTURE PROFESSIONNELLE
 * Layout principal avec sidebar fixe, navigation contextuelle
 */

'use client'

import {
  Box,
  Flex,
  useColorModeValue
} from '@chakra-ui/react'
import { ReactNode } from 'react'
import SentrySidebar from '../navigation/SentrySidebar'
import BreadcrumbNav from '../navigation/BreadcrumbNav'

interface SentryMainLayoutProps {
  children: ReactNode
  currentPath: string[]
  gymId?: string
  franchiseId?: string
}

export default function SentryMainLayout({ 
  children, 
  currentPath, 
  gymId, 
  franchiseId 
}: SentryMainLayoutProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  
  return (
    <Flex h="100vh" bg={bgColor} suppressHydrationWarning>
      {/* Sidebar Fixe */}
      <SentrySidebar 
        currentPath={currentPath}
        gymId={gymId}
        franchiseId={franchiseId}
      />
      
      {/* Contenu Principal */}
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Breadcrumbs */}
        <BreadcrumbNav path={currentPath} />
        
        {/* Zone de Contenu */}
        <Box 
          flex={1} 
          overflow="auto"
          bg="white"
          borderTopLeftRadius="lg"
          shadow="sm"
          suppressHydrationWarning
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
