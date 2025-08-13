'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { jarvisTheme } from '@/theme/jarvisTheme'

export function ChakraProviders({ children }) {
  return (
    <ChakraProvider theme={jarvisTheme}>
      {children}
    </ChakraProvider>
  )
}
