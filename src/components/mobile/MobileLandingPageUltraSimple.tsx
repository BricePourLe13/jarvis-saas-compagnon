"use client"

import { Box, VStack, Heading, Text, Button } from '@chakra-ui/react'

const MobileLandingPageUltraSimple = () => {
  return (
    <Box 
      minH="100vh"
      position="relative"
      // BACKGROUND INLINE GARANTI - JAMAIS BLANC
      background="linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #312e81 60%, #0f172a 100%)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
          radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, rgba(79, 70, 229, 0.25) 0%, transparent 55%)
        `,
        animation: 'backgroundPulse 8s ease-in-out infinite'
      }}
    >
      {/* STYLE INLINE POUR ANIMATION */}
      <style jsx>{`
        @keyframes backgroundPulse {
          0%, 100% {
            background: 
              radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
              radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(79, 70, 229, 0.25) 0%, transparent 55%);
          }
          33% {
            background: 
              radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
              radial-gradient(circle at 20% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(79, 70, 229, 0.3) 0%, transparent 50%);
          }
          66% {
            background: 
              radial-gradient(circle at 50% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 40%, rgba(147, 51, 234, 0.35) 0%, transparent 55%),
              radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.4) 0%, transparent 60%);
          }
        }
      `}</style>

      {/* CONTENU SIMPLE */}
      <VStack 
        spacing={8} 
        justify="center" 
        align="center" 
        minH="100vh" 
        px={8}
        position="relative"
        zIndex={1}
      >
        {/* SPHÈRE JARVIS SIMPLE */}
        <Box
          w="200px"
          h="200px"
          borderRadius="50%"
          background="radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.4))"
          boxShadow="0 0 50px rgba(59, 130, 246, 0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '60px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '10px'
          }}
        />

        {/* TITRE */}
        <VStack spacing={4} textAlign="center">
          <Heading 
            fontSize="3xl" 
            color="white" 
            fontWeight="black"
            textShadow="0 0 20px rgba(59, 130, 246, 0.5)"
          >
            JARVIS
          </Heading>
          <Text 
            fontSize="lg" 
            color="rgba(255,255,255,0.9)" 
            textAlign="center" 
            maxW="300px"
            lineHeight="1.6"
          >
            L'IA qui révolutionne l'expérience salle de sport
          </Text>
        </VStack>

        {/* BOUTON CTA */}
        <Button
          size="lg"
          px={8}
          py={6}
          bg="linear-gradient(135deg, #f59e0b, #d97706)"
          color="white"
          borderRadius="full"
          fontWeight="bold"
          fontSize="lg"
          boxShadow="0 10px 25px rgba(245, 158, 11, 0.4)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 15px 35px rgba(245, 158, 11, 0.6)'
          }}
          transition="all 0.3s ease"
        >
          Parler à JARVIS
        </Button>

        {/* TEXTE DE CONFIANCE */}
        <Text 
          fontSize="sm" 
          color="rgba(255,255,255,0.6)" 
          textAlign="center"
        >
          🚀 Révolutionnez votre salle de sport avec l'IA
        </Text>
      </VStack>
    </Box>
  )
}

export default MobileLandingPageUltraSimple


