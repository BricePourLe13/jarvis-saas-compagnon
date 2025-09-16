'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  id?: string
  py?: number
  minH?: string
}

export default function Section({ 
  children, 
  id,
  py = 20,
  minH
}: SectionProps) {
  return (
    <Box 
      id={id}
      py={py}
      minH={minH}
      position="relative"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ 
          once: true, 
          margin: "-200px",
          amount: 0.1
        }}
      >
        {children}
      </motion.div>
    </Box>
  )
}
