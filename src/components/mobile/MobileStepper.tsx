"use client"

import { Box, VStack, HStack, Text, Circle } from '@chakra-ui/react'
import { motion } from 'framer-motion'

interface StepItem {
  id: string
  number: number
  title: string
  description: string
  emoji: string
}

interface MobileStepperProps {
  steps: StepItem[]
}

const MobileStepper: React.FC<MobileStepperProps> = ({ steps }) => {
  return (
    <VStack spacing={6} w="full" px={4}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: index * 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          style={{ width: '100%' }}
        >
          <HStack align="flex-start" spacing={4} w="full">
            {/* Step Number Circle */}
            <Box position="relative">
              <Circle
                size="50px"
                bg="linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"
                color="white"
                fontWeight="bold"
                fontSize="lg"
                boxShadow="0 4px 15px rgba(59, 130, 246, 0.3)"
              >
                {step.number}
              </Circle>
              
              {/* Connecting Line (except for last item) */}
              {index < steps.length - 1 && (
                <Box
                  position="absolute"
                  top="50px"
                  left="50%"
                  transform="translateX(-50%)"
                  w="2px"
                  h="40px"
                  bg="linear-gradient(180deg, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.1) 100%)"
                />
              )}
            </Box>

            {/* Step Content */}
            <VStack align="flex-start" flex={1} spacing={2}>
              <HStack spacing={2} align="center">
                <Text fontSize="2xl">{step.emoji}</Text>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {step.title}
                </Text>
              </HStack>
              
              <Text 
                fontSize="md" 
                color="rgba(255,255,255,0.8)" 
                lineHeight="1.5"
                pl={10} // Align with emoji
              >
                {step.description}
              </Text>
            </VStack>
          </HStack>
        </motion.div>
      ))}
    </VStack>
  )
}

export default MobileStepper


