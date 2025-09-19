"use client"

import { useState, useEffect, lazy, Suspense } from 'react'
import { Box, Spinner, VStack, Text } from '@chakra-ui/react'
import { useResponsive } from '@/hooks/useResponsive'

// Lazy loading des composants selon l'appareil
const DesktopLandingPage = lazy(() => import('@/components/landing/DesktopLandingPage'))
const MobileLandingPage = lazy(() => import('@/components/landing/MobileLandingPage'))

// Composant de chargement optimisé
const LoadingFallback = ({ isMobile }: { isMobile: boolean }) => (
  <Box
    minH="100vh"
    bg="black"
    display="flex"
    alignItems="center"
    justifyContent="center"
    position="relative"
    overflow="hidden"
  >
    {/* Background gradient simple pendant le chargement */}
    <Box
      position="absolute"
      inset={0}
      background={
        isMobile 
          ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 30%, #1f1f1f 60%, #0a0a0a 100%)"
          : "linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #312e81 60%, #0f172a 100%)"
      }
      zIndex={0}
    />
    
    <VStack spacing={4} position="relative" zIndex={1}>
      <Spinner
        thickness="3px"
        speed="0.8s"
        emptyColor="gray.700"
        color="blue.400"
        size="xl"
      />
      <Text color="gray.400" fontSize="sm">
        Chargement de JARVIS...
      </Text>
    </VStack>
  </Box>
)

export default function LandingClientPage() {
  const { showMobileVersion } = useResponsive()
  const [isClient, setIsClient] = useState(false)

  // Hydratation côté client pour éviter les erreurs SSR
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Pendant l'hydratation, afficher un loading
  if (!isClient) {
    return <LoadingFallback isMobile={false} />
  }

  return (
    <Suspense fallback={<LoadingFallback isMobile={showMobileVersion} />}>
      {showMobileVersion ? (
        <MobileLandingPage />
      ) : (
        <DesktopLandingPage />
      )}
    </Suspense>
  )
}
