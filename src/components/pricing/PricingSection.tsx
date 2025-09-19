"use client";

import { Box, Container, VStack, Heading, Text, Button, HStack, Icon, Badge, SimpleGrid } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaRocket, FaCrown, FaIndustry } from 'react-icons/fa';
import { useState } from 'react';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const pricingCards = [
  {
    id: 'installation',
    title: 'Installation',
    subtitle: 'Mise en place complète',
    price: 'Sur devis',
    period: 'Coût unique',
    originalPrice: null,
    features: [
      'Installation équipements JARVIS',
      'Configuration personnalisée',
      'Formation personnel (8h)',
      'Intégration systèmes existants',
      'Base de connaissances adaptée',
      'Support technique initial',
    ],
    buttonText: 'Demander un devis',
    icon: FaRocket,
    color: 'blue',
    isPopular: false,
    delay: 0,
  },
  {
    id: 'abonnement',
    title: 'Abonnement',
    subtitle: 'Service mensuel personnalisé',
    price: 'Sur devis',
    period: '/mois',
    originalPrice: null,
    features: [
      'Maintenance équipements',
      'Mises à jour logicielles',
      'Support technique 24/7',
      'Monitoring performances',
      'Évolutions personnalisées',
      'Analytics & rapports',
      'Formation continue',
      'Assistance à distance',
    ],
    buttonText: 'Obtenir un tarif',
    icon: FaCrown,
    color: 'purple',
    isPopular: false,
    delay: 0.2,
  },
  {
    id: 'consulting',
    title: 'Consulting',
    subtitle: 'Accompagnement stratégique',
    price: 'Sur devis',
    period: 'À la demande',
    originalPrice: null,
    features: [
      'Audit besoins spécifiques',
      'Stratégie transformation IA',
      'Développements sur-mesure',
      'Gestion projet dédiée',
      'Formation équipes avancée',
      'Optimisation continue',
      'Intégrations tierces',
      'Conseil en innovation',
    ],
    buttonText: 'Planifier un échange',
    icon: FaIndustry,
    color: 'green',
    isPopular: false,
    delay: 0.4,
  },
];

export default function PricingSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <Container id="tarifs" maxW="6xl" px={8} py={20} mt={16} style={{ scrollMarginTop: '200px' }} className="section-container">
      <VStack spacing={20} align="center">
        {/* Header avec animation */}
        <MotionVStack
          spacing={6}
          textAlign="center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <MotionBox
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Heading 
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }} 
              color="white" 
              fontWeight="900"
              letterSpacing="-0.02em"
            >
              Votre{" "}
              <Text 
                as="span" 
                bgGradient="linear(to-r, #667eea, #764ba2)" 
                bgClip="text"
                display="inline-block"
              >
                Parcours
              </Text>{" "}
              JARVIS
            </Heading>
          </MotionBox>
          
          <Text 
            fontSize={{ base: "lg", md: "xl" }} 
            color="gray.400" 
            maxW="700px"
            lineHeight="1.7"
          >
            Un parcours complet pour transformer votre salle de sport avec l'IA. 
            De l'installation à l'accompagnement quotidien, tout est personnalisé selon vos besoins.
          </Text>

          {/* Badge promo animé */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Badge
              px={4}
              py={2}
              borderRadius="full"
              bg="linear-gradient(135deg, #667eea, #764ba2)"
              color="white"
              fontSize="sm"
              fontWeight="bold"
              boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"
            >
              🚀 Devis gratuit & personnalisé sous 24h
            </Badge>
          </MotionBox>
        </MotionVStack>

        {/* Cards Grid */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} w="full" maxW="1200px">
          <AnimatePresence>
            {pricingCards.map((card, index) => (
              <MotionBox
                key={card.id}
                initial={{ opacity: 0, y: 30, rotateY: 0 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  rotateY: 0,
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: card.delay,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.01,
                  transition: { duration: 0.3 }
                }}
                onHoverStart={() => setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
                style={{ perspective: '1000px' }}
              >
                <Box
                  position="relative"
                  h="full"
                  minH="600px"
                  bg="rgba(15, 15, 15, 0.8)"
                  border="1px solid"
                  borderColor={
                    card.isPopular 
                      ? "purple.500" 
                      : hoveredCard === card.id 
                        ? "gray.600" 
                        : "gray.700"
                  }
                  borderRadius="3xl"
                  p={8}
                  backdropFilter="blur(20px)"
                  overflow="hidden"
                  boxShadow={
                    card.isPopular
                      ? "0 20px 50px rgba(139, 92, 246, 0.3)"
                      : hoveredCard === card.id
                        ? "0 20px 40px rgba(0, 0, 0, 0.4)"
                        : "0 10px 30px rgba(0, 0, 0, 0.2)"
                  }
                  transition="all 0.3s ease"
                  _before={card.isPopular ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05))',
                    borderRadius: '3xl',
                    zIndex: 0
                  } : {}}
                >

                  <VStack spacing={6} align="stretch" h="full" position="relative" zIndex={1}>
                    {/* Header avec icon et numéro */}
                    <VStack spacing={4} align="center">
                      <MotionBox
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: card.delay + 0.1 }}
                        position="relative"
                      >
                        {/* Numéro d'étape */}
                        <Box
                          position="absolute"
                          top="-8px"
                          right="-8px"
                          bg="white"
                          color="black"
                          borderRadius="full"
                          w="24px"
                          h="24px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="sm"
                          fontWeight="bold"
                          zIndex={2}
                        >
                          {index + 1}
                        </Box>
                        
                        <Box
                          p={4}
                          borderRadius="2xl"
                          bg={`${card.color}.500`}
                          color="white"
                          boxShadow={`0 4px 15px rgba(139, 92, 246, 0.3)`}
                        >
                          <Icon as={card.icon} boxSize={8} />
                        </Box>
                      </MotionBox>
                      
                      <VStack spacing={2} textAlign="center">
                        <Heading fontSize="2xl" color="white" fontWeight="bold">
                          {card.title}
                        </Heading>
                        <Text fontSize="md" color="gray.400">
                          {card.subtitle}
                        </Text>
                      </VStack>
                    </VStack>

                    {/* Prix avec animation */}
                    <VStack spacing={2} textAlign="center">
                      <HStack justify="center" align="baseline" spacing={2}>
                        {card.originalPrice && (
                          <Text
                            fontSize="xl"
                            color="gray.500"
                            textDecoration="line-through"
                          >
                            {card.originalPrice}
                          </Text>
                        )}
                        <MotionBox
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: card.delay + 0.2 }}
                        >
                          <Text
                            fontSize={{ base: "3xl", md: "4xl" }}
                            fontWeight="900"
                            color="white"
                            lineHeight="1"
                          >
                            {card.price}
                          </Text>
                        </MotionBox>
                      </HStack>
                      <Text fontSize="md" color="gray.400">
                        {card.period}
                      </Text>
                    </VStack>

                    {/* Features animées */}
                    <VStack spacing={3} align="stretch" flex="1">
                      {card.features.map((feature, featureIndex) => (
                        <MotionBox
                          key={featureIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: card.delay + 0.3 + (featureIndex * 0.1) 
                          }}
                          viewport={{ once: true }}
                        >
                          <HStack spacing={3} align="center">
                            <Icon 
                              as={FaCheckCircle} 
                              color="green.400" 
                              boxSize={4}
                              filter="drop-shadow(0 0 4px rgba(72, 187, 120, 0.6))"
                            />
                            <Text 
                              fontSize="sm" 
                              color="gray.300"
                              lineHeight="1.5"
                            >
                              {feature}
                            </Text>
                          </HStack>
                        </MotionBox>
                      ))}
                    </VStack>

                    {/* Button animé */}
                    <MotionBox
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: card.delay + 0.5 }}
                      viewport={{ once: true }}
                    >
                      <Button
                        size="lg"
                        w="full"
                        py={6}
                        borderRadius="xl"
                        fontWeight="bold"
                        fontSize="md"
                        bg={
                          card.isPopular
                            ? "linear-gradient(135deg, #8b5cf6, #a855f7)"
                            : "linear-gradient(135deg, #374151, #4b5563)"
                        }
                        color="white"
                        border="1px solid"
                        borderColor={
                          card.isPopular ? "purple.400" : "gray.600"
                        }
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: card.isPopular
                            ? "0 10px 25px rgba(139, 92, 246, 0.4)"
                            : "0 10px 25px rgba(0, 0, 0, 0.3)",
                          bg: card.isPopular
                            ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                            : "linear-gradient(135deg, #4b5563, #6b7280)",
                        }}
                        transition="all 0.3s ease"
                      >
                        {card.buttonText}
                      </Button>
                    </MotionBox>
                  </VStack>

                  {/* Effet de glow animé */}
                  {hoveredCard === card.id && (
                    <MotionBox
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      position="absolute"
                      top="-2px"
                      left="-2px"
                      right="-2px"
                      bottom="-2px"
                      borderRadius="3xl"
                      bg="linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))"
                      zIndex={-1}
                      filter="blur(8px)"
                    />
                  )}
                </Box>
              </MotionBox>
            ))}
          </AnimatePresence>
        </SimpleGrid>

        {/* Footer CTA */}
        <MotionVStack
          spacing={4}
          textAlign="center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Text fontSize="lg" color="gray.400" maxW="600px">
            💡 <strong>Solution 100% personnalisée</strong> - Adaptée à votre salle et vos membres
          </Text>
          <Text fontSize="sm" color="gray.500">
            Installation sur site • Formation équipes • Maintenance continue • Support dédié
          </Text>
        </MotionVStack>
      </VStack>
    </Container>
  );
}
