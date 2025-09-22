"use client"

import { Box, HStack, VStack, Text, IconButton } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

interface CarouselItem {
  id: string
  emoji: string
  title: string
  description: string
  color: string
}

interface MobileCarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  autoPlayDelay?: number
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({ 
  items, 
  autoPlay = true, 
  autoPlayDelay = 4000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoPlayDelay)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayDelay, items.length])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <Box position="relative" w="full" h="300px">
      {/* Carousel Container */}
      <Box
        position="relative"
        w="full"
        h="full"
        overflow="hidden"
        borderRadius="2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              w="full"
              h="full"
              bg={`linear-gradient(135deg, ${items[currentIndex].color}15 0%, ${items[currentIndex].color}25 100%)`}
              backdropFilter="blur(10px)"
              border={`1px solid ${items[currentIndex].color}40`}
              borderRadius="2xl"
              p={6}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <VStack spacing={4} textAlign="center">
                <Text fontSize="4xl">{items[currentIndex].emoji}</Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {items[currentIndex].title}
                </Text>
                <Text fontSize="md" color="rgba(255,255,255,0.8)" lineHeight="1.5">
                  {items[currentIndex].description}
                </Text>
              </VStack>
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Navigation Arrows */}
      <IconButton
        aria-label="Previous slide"
        icon={<ChevronLeftIcon />}
        position="absolute"
        left={2}
        top="50%"
        transform="translateY(-50%)"
        bg="rgba(0,0,0,0.5)"
        color="white"
        size="sm"
        borderRadius="full"
        _hover={{ bg: "rgba(0,0,0,0.7)" }}
        onClick={goToPrev}
        zIndex={2}
      />
      
      <IconButton
        aria-label="Next slide"
        icon={<ChevronRightIcon />}
        position="absolute"
        right={2}
        top="50%"
        transform="translateY(-50%)"
        bg="rgba(0,0,0,0.5)"
        color="white"
        size="sm"
        borderRadius="full"
        _hover={{ bg: "rgba(0,0,0,0.7)" }}
        onClick={goToNext}
        zIndex={2}
      />

      {/* Dots Indicator */}
      <HStack
        position="absolute"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        spacing={2}
        zIndex={2}
      >
        {items.map((_, index) => (
          <Box
            key={index}
            w={currentIndex === index ? "24px" : "8px"}
            h="8px"
            bg={currentIndex === index ? "white" : "rgba(255,255,255,0.4)"}
            borderRadius="full"
            cursor="pointer"
            transition="all 0.3s"
            onClick={() => goToSlide(index)}
          />
        ))}
      </HStack>
    </Box>
  )
}

export default MobileCarousel


