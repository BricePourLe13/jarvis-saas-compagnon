'use client'

import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  HStack, 
  Button, 
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
  Icon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FaBars, FaRocket } from 'react-icons/fa'
import { vitrineTheme } from './VitrineDesignSystem'
import JarvisLogoSphere from './JarvisLogoSphere'

export default function NavigationHeader() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const navItems = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#contact' }
  ]

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    onClose()
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor={vitrineTheme.colors.gray[200]}
      shadow="sm"
    >
      <Container maxW="7xl" px={6}>
        <Flex justify="space-between" align="center" h="70px">
          
                 {/* Logo */}
                 <HStack spacing={3} cursor="pointer" onClick={() => scrollToSection('#hero')}>
                   <Box 
                     _hover={{
                       transform: 'scale(1.05)',
                       transition: 'transform 0.2s ease'
                     }}
                   >
                     <JarvisLogoSphere size={40} animated={false} />
                   </Box>
                   <Heading size="md" color={vitrineTheme.colors.gray[800]} fontWeight="800">
                     JARVIS Group
                   </Heading>
                 </HStack>

          {/* Navigation Desktop */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                fontWeight="500"
                color={vitrineTheme.colors.gray[600]}
                _hover={{
                  color: vitrineTheme.colors.primary[600],
                  bg: vitrineTheme.colors.primary[50]
                }}
                onClick={() => scrollToSection(item.href)}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          {/* CTA Buttons */}
          <HStack spacing={3}>
            <Button
              variant="ghost"
              size="sm"
              color={vitrineTheme.colors.gray[600]}
              onClick={() => router.push('/login')}
              display={{ base: 'none', sm: 'flex' }}
            >
              Connexion
            </Button>
            <Button
              colorScheme="blue"
              size="sm"
              borderRadius="lg"
              fontWeight="600"
              onClick={() => router.push('/login')}
              rightIcon={<FaRocket />}
            >
              Commencer
            </Button>
            
            {/* Menu Mobile */}
            <IconButton
              aria-label="Menu"
              icon={<FaBars />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
            />
          </HStack>
        </Flex>
      </Container>

      {/* Drawer Mobile */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  w="full"
                  justifyContent="start"
                  onClick={() => scrollToSection(item.href)}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                colorScheme="blue"
                w="full"
                onClick={() => router.push('/login')}
              >
                Se connecter
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
