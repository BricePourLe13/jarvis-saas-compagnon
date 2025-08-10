"use client"
import { Button, ButtonProps } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionButton = motion(Button)

interface PrimaryButtonProps extends Omit<ButtonProps, 'variant' | 'colorScheme'> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function PrimaryButton({ 
  variant = 'primary', 
  children, 
  ...props 
}: PrimaryButtonProps) {
  
  const getButtonStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'black',
          color: 'white',
          _hover: { bg: 'gray.900' },
          _active: { bg: 'gray.800' }
        }
      case 'secondary':
        return {
          bg: 'gray.100',
          color: 'gray.700',
          _hover: { bg: 'gray.200' },
          _active: { bg: 'gray.300' }
        }
      case 'ghost':
        return {
          bg: 'transparent',
          color: 'gray.600',
          _hover: { bg: 'gray.50', color: 'black' },
          _active: { bg: 'gray.100' }
        }
      default:
        return {}
    }
  }

  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      borderRadius="8px"
      fontWeight="500"
      fontSize="sm"
      px={6}
      py={3}
      h="auto"
      transition="all 0.2s ease"
      {...getButtonStyles(variant)}
      {...props}
    >
      {children}
    </MotionButton>
  )
}