'use client'

import { 
  Box, 
  Container, 
  Grid, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Button, 
  Icon, 
  Divider,
  Link,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaTwitter, FaLinkedin, FaGithub, FaEnvelope, FaPhone, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa'
import { vitrineTheme } from './VitrineDesignSystem'
import JarvisAvatar from '@/components/common/JarvisAvatar'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Solutions",
      links: [
        { label: "JARVIS Fitness", href: "#solutions" },
        { label: "JARVIS Museums", href: "#solutions" },
        { label: "API & Intégrations", href: "#api" },
        { label: "Personnalisation", href: "#custom" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "Guides", href: "#guides" },
        { label: "Support", href: "#support" },
        { label: "Status", href: "#status" }
      ]
    },
    {
      title: "Entreprise",
      links: [
        { label: "À propos", href: "#about" },
        { label: "Carrières", href: "#careers" },
        { label: "Partenaires", href: "#partners" },
        { label: "Presse", href: "#press" }
      ]
    },
    {
      title: "Légal",
      links: [
        { label: "Confidentialité", href: "#privacy" },
        { label: "Conditions", href: "#terms" },
        { label: "Cookies", href: "#cookies" },
        { label: "RGPD", href: "#gdpr" }
      ]
    }
  ]

  return (
    <Box bg="transparent" color={vitrineTheme.colors.gray[800]} id="contact">
      <Container maxW="7xl" px={6}>
        
        {/* Newsletter Section */}
        <Box py={16} borderBottom="1px solid" borderColor={vitrineTheme.colors.gray[700]}>
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={12} alignItems="center">
            <VStack align={{ base: "center", lg: "start" }} spacing={4} textAlign={{ base: "center", lg: "left" }}>
              <Heading size="lg" color={vitrineTheme.colors.gray[800]}>
                Restez informé des dernières innovations
              </Heading>
              <Text color={vitrineTheme.colors.gray[400]} fontSize="lg">
                Recevez nos actualités, guides techniques et annonces produits directement dans votre boîte mail.
              </Text>
            </VStack>
            
            <VStack spacing={4} w="full">
              <InputGroup size="lg">
                <Input
                  placeholder="votre@email.com"
                  bg={vitrineTheme.colors.gray[800]}
                  border="1px solid"
                  borderColor={vitrineTheme.colors.gray[600]}
                  color="white"
                  _placeholder={{ color: vitrineTheme.colors.gray[500] }}
                  _focus={{
                    borderColor: vitrineTheme.colors.primary[500],
                    boxShadow: `0 0 0 1px ${vitrineTheme.colors.primary[500]}`
                  }}
                />
                <InputRightElement>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    rightIcon={<FaArrowRight />}
                    mr={2}
                  >
                    S'abonner
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Text fontSize="sm" color={vitrineTheme.colors.gray[500]}>
                Pas de spam. Désabonnement en un clic.
              </Text>
            </VStack>
          </Grid>
        </Box>

        {/* Main Footer Content */}
        <Box py={16}>
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr 1fr" }} gap={12}>
            
            {/* Company Info */}
            <VStack align="start" spacing={6}>
              <HStack spacing={3}>
                <Box w="40px" h="40px">
                  <JarvisAvatar 
                    size={40}
                    showText={false}
                    status="idle"
                    variant="minimal"
                  />
                </Box>
                <Heading size="md" color="white" fontWeight="800">
                  JARVIS Group
                </Heading>
              </HStack>
              
              <Text color={vitrineTheme.colors.gray[400]} lineHeight="1.6">
                Nous développons des solutions d'intelligence artificielle conversationnelle 
                pour révolutionner l'expérience client dans les espaces physiques.
              </Text>
              
              <VStack align="start" spacing={3}>
                <HStack spacing={3}>
                  <Icon as={FaMapMarkerAlt} color={vitrineTheme.colors.primary[500]} />
                  <Text fontSize="sm" color={vitrineTheme.colors.gray[400]}>
                    Paris, France
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <Icon as={FaEnvelope} color={vitrineTheme.colors.primary[500]} />
                  <Text fontSize="sm" color={vitrineTheme.colors.gray[400]}>
                    contact@jarvis-group.com
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <Icon as={FaPhone} color={vitrineTheme.colors.primary[500]} />
                  <Text fontSize="sm" color={vitrineTheme.colors.gray[400]}>
                    +33 1 23 45 67 89
                  </Text>
                </HStack>
              </VStack>

              {/* Social Links */}
              <HStack spacing={4}>
                {[
                  { icon: FaTwitter, href: "#twitter" },
                  { icon: FaLinkedin, href: "#linkedin" },
                  { icon: FaGithub, href: "#github" }
                ].map((social, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={social.href} isExternal>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={vitrineTheme.colors.gray[800]}
                        color={vitrineTheme.colors.gray[400]}
                        _hover={{
                          bg: vitrineTheme.colors.primary[500],
                          color: "white"
                        }}
                        transition="all 0.2s"
                      >
                        <Icon as={social.icon} boxSize={4} />
                      </Box>
                    </Link>
                  </motion.div>
                ))}
              </HStack>
            </VStack>

            {/* Footer Links */}
            {footerSections.map((section) => (
              <VStack key={section.title} align="start" spacing={4}>
                <Heading size="sm" color="white" fontWeight="600">
                  {section.title}
                </Heading>
                <VStack align="start" spacing={3}>
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      color={vitrineTheme.colors.gray[400]}
                      fontSize="sm"
                      _hover={{
                        color: vitrineTheme.colors.primary[400],
                        textDecoration: "none"
                      }}
                      transition="color 0.2s"
                    >
                      {link.label}
                    </Link>
                  ))}
                </VStack>
              </VStack>
            ))}
          </Grid>
        </Box>

        {/* Bottom Bar */}
        <Divider borderColor={vitrineTheme.colors.gray[700]} />
        <Box py={8}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} alignItems="center">
            <Text fontSize="sm" color={vitrineTheme.colors.gray[500]} textAlign={{ base: "center", md: "left" }}>
              © {currentYear} JARVIS Group. Tous droits réservés.
            </Text>
            <HStack spacing={6} justify={{ base: "center", md: "end" }}>
              <Text fontSize="sm" color={vitrineTheme.colors.gray[500]}>
                Fait avec ❤️ en France
              </Text>
              <HStack spacing={4}>
                <Link href="#privacy" fontSize="sm" color={vitrineTheme.colors.gray[500]} _hover={{ color: vitrineTheme.colors.primary[400] }}>
                  Confidentialité
                </Link>
                <Link href="#terms" fontSize="sm" color={vitrineTheme.colors.gray[500]} _hover={{ color: vitrineTheme.colors.primary[400] }}>
                  CGU
                </Link>
              </HStack>
            </HStack>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}
