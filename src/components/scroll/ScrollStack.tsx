'use client'

import { Box, VStack } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface ScrollStackProps {
  children: ReactNode[]
  spacing?: number
}

export default function ScrollStack({ children, spacing = 100 }: ScrollStackProps) {
  return (
    <Box position="relative">
      <VStack spacing={spacing} align="stretch">
        {children.map((child, index) => (
          <Box key={index}>
            {child}
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
