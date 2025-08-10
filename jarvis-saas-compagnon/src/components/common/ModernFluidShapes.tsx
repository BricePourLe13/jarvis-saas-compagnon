'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ModernFluidShapes() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Box position="absolute" inset={0} overflow="hidden">
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '70%',
          height: '80%',
          background:
            'linear-gradient(135deg, rgba(156, 163, 175, 0.6) 0%, rgba(209, 213, 219, 0.4) 50%, rgba(229, 231, 235, 0.3) 100%)',
          borderRadius: '50% 30% 60% 40%',
          filter: 'blur(1px)'
        }}
        animate={{
          borderRadius: [
            '50% 30% 60% 40%',
            '40% 60% 30% 50%',
            '60% 40% 50% 30%',
            '50% 30% 60% 40%'
          ],
          rotate: [0, 10, -5, 0],
          scale: [1, 1.05, 0.98, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '60%',
          height: '70%',
          background:
            'linear-gradient(225deg, rgba(107, 114, 128, 0.4) 0%, rgba(156, 163, 175, 0.3) 60%, rgba(209, 213, 219, 0.2) 100%)',
          borderRadius: '40% 50% 30% 60%',
          filter: 'blur(2px)'
        }}
        animate={{
          borderRadius: [
            '40% 50% 30% 60%',
            '60% 30% 50% 40%',
            '30% 60% 40% 50%',
            '40% 50% 30% 60%'
          ],
          rotate: [0, -15, 8, 0],
          scale: [1, 0.95, 1.03, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '20%',
          width: '50%',
          height: '60%',
          background:
            'linear-gradient(45deg, rgba(229, 231, 235, 0.5) 0%, rgba(243, 244, 246, 0.3) 100%)',
          borderRadius: '60% 40% 50% 30%',
          filter: 'blur(1.5px)'
        }}
        animate={{
          borderRadius: [
            '60% 40% 50% 30%',
            '30% 50% 40% 60%',
            '50% 30% 60% 40%',
            '60% 40% 50% 30%'
          ],
          rotate: [0, 12, -8, 0],
          scale: [1, 1.08, 0.94, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: `${15 + (i % 8) * 10}%`,
            top: `${20 + (i % 5) * 15}%`,
            width: `${4 + (i % 3)}px`,
            height: `${4 + (i % 3)}px`,
            backgroundColor: '#d1d5db',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(209, 213, 219, 0.6)'
          }}
          animate={{ y: [0, -50, 0], opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.7, ease: 'easeInOut' }}
        />
      ))}

      <Box
        position="absolute"
        inset={0}
        background="radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(248, 249, 250, 0.3) 70%, rgba(248, 249, 250, 0.6) 100%)"
        pointerEvents="none"
      />
    </Box>
  )
}

