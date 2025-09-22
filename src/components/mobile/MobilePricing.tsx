"use client"

import { Box, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingCard {
  id: string
  title: string
  emoji: string
  description: string
  features: PricingFeature[]
  isPopular?: boolean
  ctaText: string
  gradient: string
}

interface MobilePricingProps {
  cards: PricingCard[]
}

const MobilePricing: React.FC<MobilePricingProps> = ({ cards }) => {
  const [activeCard, setActiveCard] = useState(0)

  return (
    <VStack spacing={8} w="full" px={4}>
      {/* Cards Container */}
      <Box w="full" position="relative">
        {/* Swipeable Cards */}
        <Box
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none'
          }}
        >
          <HStack spacing={4} pb={4} px={2}>
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0.7, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Box
                  minW="280px"
                  maxW="300px"
                  h="500px"
                  bg={card.gradient}
                  borderRadius="3xl"
                  p={6}
                  position="relative"
                  border="2px solid rgba(255, 255, 255, 0.1)"
                  boxShadow="0 20px 40px rgba(0, 0, 0, 0.3)"
                  backdropFilter="blur(20px)"
                  cursor="pointer"
                  onClick={() => setActiveCard(index)}
                  transform={activeCard === index ? 'scale(1.02)' : 'scale(1)'}
                  transition="all 0.3s"
                >
                  {/* Popular Badge */}
                  {card.isPopular && (
                    <Badge
                      position="absolute"
                      top={4}
                      right={4}
                      bg="rgba(34, 197, 94, 0.9)"
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      ⭐ POPULAIRE
                    </Badge>
                  )}

                  <VStack spacing={6} h="full" justify="space-between">
                    {/* Header */}
                    <VStack spacing={4} textAlign="center">
                      <Text fontSize="4xl">{card.emoji}</Text>
                      <VStack spacing={2}>
                        <Text fontSize="xl" fontWeight="black" color="white">
                          {card.title}
                        </Text>
                        <Text fontSize="sm" color="rgba(255,255,255,0.8)" textAlign="center">
                          {card.description}
                        </Text>
                      </VStack>
                    </VStack>

                    {/* Features */}
                    <VStack spacing={3} flex={1} justify="center">
                      {card.features.map((feature, i) => (
                        <HStack key={i} spacing={3} w="full" align="flex-start">
                          <Text color={feature.included ? "#22C55E" : "#EF4444"} fontSize="sm">
                            {feature.included ? "✓" : "✗"}
                          </Text>
                          <Text 
                            fontSize="sm" 
                            color={feature.included ? "white" : "rgba(255,255,255,0.5)"}
                            lineHeight="1.4"
                          >
                            {feature.text}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    {/* CTA */}
                    <Button
                      w="full"
                      h="48px"
                      bg={card.isPopular ? 
                        "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" : 
                        "rgba(255, 255, 255, 0.1)"
                      }
                      color="white"
                      fontWeight="bold"
                      borderRadius="xl"
                      border={card.isPopular ? "none" : "1px solid rgba(255, 255, 255, 0.2)"}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: card.isPopular ? 
                          '0 8px 25px rgba(34, 197, 94, 0.4)' : 
                          '0 8px 25px rgba(255, 255, 255, 0.1)'
                      }}
                      _active={{
                        transform: 'translateY(0px)'
                      }}
                      transition="all 0.2s"
                    >
                      {card.ctaText}
                    </Button>
                  </VStack>
                </Box>
              </motion.div>
            ))}
          </HStack>
        </Box>

        {/* Scroll Indicator */}
        <HStack justify="center" spacing={2} mt={4}>
          {cards.map((_, index) => (
            <Box
              key={index}
              w={activeCard === index ? "24px" : "8px"}
              h="8px"
              bg={activeCard === index ? "white" : "rgba(255,255,255,0.3)"}
              borderRadius="full"
              cursor="pointer"
              transition="all 0.3s"
              onClick={() => setActiveCard(index)}
            />
          ))}
        </HStack>
      </Box>
    </VStack>
  )
}

export default MobilePricing


