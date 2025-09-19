"use client"

import { Box, VStack, Text, HStack, IconButton } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { VscHome, VscArchive, VscAccount, VscMail, VscCreditCard } from 'react-icons/vsc'
import { useState } from 'react'

interface NavItem {
  id: string
  icon: React.ReactElement
  label: string
  onClick: () => void
}

interface MobileNavigationProps {
  items: NavItem[]
  activeItem?: string
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ items, activeItem = 'hero' }) => {
  const [active, setActive] = useState(activeItem)

  const handleItemClick = (item: NavItem) => {
    setActive(item.id)
    item.onClick()
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="rgba(15, 23, 42, 0.95)"
      backdropFilter="blur(20px)"
      borderTop="1px solid rgba(255, 255, 255, 0.1)"
      boxShadow="0 -4px 20px rgba(0, 0, 0, 0.3)"
      px={2}
      py={2}
      // Safe area pour iPhone
      paddingBottom="env(safe-area-inset-bottom)"
    >
      <HStack justify="space-around" align="center" spacing={0}>
        {items.map((item, index) => {
          const isActive = active === item.id
          
          return (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              <VStack
                spacing={1}
                minW="60px"
                py={2}
                cursor="pointer"
                onClick={() => handleItemClick(item)}
                position="relative"
              >
                {/* Indicateur actif */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '32px',
                      height: '3px',
                      background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                      borderRadius: '2px'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icône */}
                <Box
                  color={isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'}
                  fontSize="20px"
                  transition="all 0.2s"
                  transform={isActive ? 'scale(1.1)' : 'scale(1)'}
                >
                  {item.icon}
                </Box>

                {/* Label */}
                <Text
                  fontSize="xs"
                  color={isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'}
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  textAlign="center"
                  lineHeight="1"
                  transition="all 0.2s"
                >
                  {item.label}
                </Text>
              </VStack>
            </motion.div>
          )
        })}
      </HStack>
    </Box>
  )
}

export default MobileNavigation
