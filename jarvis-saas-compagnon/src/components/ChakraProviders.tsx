'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

interface ChakraProvidersProps {
  children: React.ReactNode
}

export function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      {children}
    </ChakraProvider>
  )
}
