"use client"

import { Box, VStack, Heading, Text, Button, Container } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Avatar3D from '@/components/kiosk/Avatar3D'

const MobileHero = () => {
  return (
    <Container maxW="full" px={4} py={12} minH="100vh" display="flex" alignItems="center">
      <VStack spacing={8} textAlign="center" w="full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Avatar3D 
            status="idle" 
            size={200} 
            followMouse={false}
            eyeScale={1.2}
          />
        </motion.div>

        <VStack spacing={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Heading
              fontSize="2xl"
              color="white"
              fontWeight="black"
              letterSpacing="0.1em"
              fontFamily="system-ui, -apple-system, sans-serif"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #ffffff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              JARVIS
            </Heading>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Text fontSize="lg" color="rgba(255,255,255,0.9)" lineHeight="1.6">
              L'IA qui révolutionne l'expérience salle de sport
            </Text>
          </motion.div>
        </VStack>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Button
            size="lg"
            width="full"
            maxW="280px"
            bg="linear-gradient(45deg, #FF8C00, #FFD700)"
            color="white"
            fontWeight="bold"
            boxShadow="0 5px 20px rgba(255, 215, 0, 0.4)"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "0 8px 30px rgba(255, 215, 0, 0.6)"
            }}
            transition="all 0.3s ease"
          >
            Parler à JARVIS
          </Button>
        </motion.div>
      </VStack>
    </Container>
  )
}

export default MobileHero