"use client"
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Divider
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ContextualNav } from './ContextualNav'
import { PrimaryButton } from './PrimaryButton'

const MotionBox = motion(Box)

interface BreadcrumbItem {
  label: string
  href: string
}

interface UnifiedLayoutProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  primaryAction?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  currentLevel: 'global' | 'franchise' | 'gym'
  franchiseId?: string
  franchiseName?: string
  gymId?: string
  gymName?: string
  children: React.ReactNode
}

export function UnifiedLayout({
  title,
  breadcrumbs = [],
  primaryAction,
  currentLevel,
  franchiseId,
  franchiseName,
  gymId,
  gymName,
  children
}: UnifiedLayoutProps) {
  const router = useRouter()

  return (
    <Box 
      minH="100vh" 
      bg="gray.50"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      <Flex>
        {/* Sidebar Navigation */}
        <Box
          w="280px"
          minH="100vh"
          bg="white"
          borderRight="1px solid"
          borderColor="gray.200"
          p={6}
          position="fixed"
          left={0}
          top={0}
          zIndex={10}
        >
          <VStack spacing={8} align="stretch" h="full">
            {/* Logo */}
            <Box>
              <Text fontSize="xl" fontWeight="600" color="black">
                JARVIS Admin
              </Text>
              <Text fontSize="sm" color="gray.500">
                SaaS Platform
              </Text>
            </Box>
            
            <Divider />
            
            {/* Contextual Navigation */}
            <ContextualNav
              currentLevel={currentLevel}
              franchiseId={franchiseId}
              franchiseName={franchiseName}
              gymId={gymId}
              gymName={gymName}
            />
          </VStack>
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          ml="280px"
          p={8}
        >
          <Container maxW="6xl">
            <VStack spacing={8} align="stretch">
              {/* Header */}
              <MotionBox
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VStack spacing={4} align="stretch">
                  {/* Breadcrumbs */}
                  {breadcrumbs.length > 0 && (
                    <Breadcrumb 
                      spacing={2} 
                      separator={<ChevronRight size={16} color="var(--chakra-colors-gray-400)" />}
                      fontSize="sm"
                    >
                       {breadcrumbs.map((crumb, index) => (
                        <BreadcrumbItem key={`${crumb.href}:${crumb.label}`} isCurrentPage={index === breadcrumbs.length - 1}>
                          <BreadcrumbLink
                            onClick={() => router.push(crumb.href)}
                            color={index === breadcrumbs.length - 1 ? "black" : "gray.500"}
                            fontWeight={index === breadcrumbs.length - 1 ? "500" : "400"}
                            cursor="pointer"
                            _hover={{ color: "black" }}
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      ))}
                    </Breadcrumb>
                  )}

                  {/* Title and Primary Action */}
                  <HStack justify="space-between" align="center">
                    <Text 
                      fontSize="2xl" 
                      fontWeight="600" 
                      color="black"
                      letterSpacing="-0.5px"
                    >
                      {title}
                    </Text>
                    
                    {primaryAction && (
                      <PrimaryButton
                        onClick={primaryAction.onClick}
                        isLoading={primaryAction.loading}
                        loadingText="Chargement..."
                      >
                        {primaryAction.label}
                      </PrimaryButton>
                    )}
                  </HStack>
                </VStack>
              </MotionBox>

              {/* Content */}
              <MotionBox
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {children}
              </MotionBox>
            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  )
}