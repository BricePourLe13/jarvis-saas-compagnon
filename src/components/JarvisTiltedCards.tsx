import React from 'react';
import { Box, VStack, Heading, Text, Button, HStack } from '@chakra-ui/react';
import TiltedCard from './TiltedCard';

const JarvisTiltedCards: React.FC = () => {
  return (
    <HStack spacing={8} justify="center" align="stretch" w="full" flexWrap={{ base: "wrap", md: "nowrap" }}>
      {/* JARVIS FITNESS CARD */}
      <Box flex={1} maxW="500px" minW="300px">
        <TiltedCard
          imageSrc="/api/placeholder/400/300"
          altText="JARVIS Fitness - Assistant IA pour salles de sport"
          captionText="Découvrir JARVIS Fitness"
          containerHeight="400px"
          containerWidth="100%"
          imageHeight="300px"
          imageWidth="100%"
          scaleOnHover={1.05}
          rotateAmplitude={12}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="rgba(0, 0, 0, 0.8)"
              backdropFilter="blur(20px)"
              p={6}
              borderBottomRadius="15px"
              color="white"
              pointerEvents="auto"
            >
              <VStack spacing={4} align="start">
                <Box
                  bg="rgba(59, 130, 246, 0.2)"
                  border="1px solid rgba(59, 130, 246, 0.4)"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  🏋️‍♂️ Disponible
                </Box>
                <VStack spacing={2} align="start">
                  <Heading size="md" color="white">
                    JARVIS Fitness
                  </Heading>
                  <Text fontSize="sm" color="gray.300" lineHeight="1.4">
                    Assistant IA conversationnel pour salles de sport. 
                    Engagement membre 24/7 avec reconnaissance vocale avancée.
                  </Text>
                </VStack>
                <Button
                  colorScheme="blue"
                  size="sm"
                  borderRadius="full"
                  _hover={{
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  transition="all 0.2s"
                >
                  Découvrir
                </Button>
              </VStack>
            </Box>
          }
        />
      </Box>

      {/* JARVIS MUSEUMS CARD */}
      <Box flex={1} maxW="500px" minW="300px">
        <TiltedCard
          imageSrc="/api/placeholder/400/300"
          altText="JARVIS Museums - Guide IA pour espaces culturels"
          captionText="JARVIS Museums - Bientôt disponible"
          containerHeight="400px"
          containerWidth="100%"
          imageHeight="300px"
          imageWidth="100%"
          scaleOnHover={1.05}
          rotateAmplitude={12}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="rgba(0, 0, 0, 0.8)"
              backdropFilter="blur(20px)"
              p={6}
              borderBottomRadius="15px"
              color="white"
              pointerEvents="auto"
            >
              <VStack spacing={4} align="start">
                <Box
                  bg="rgba(147, 51, 234, 0.2)"
                  border="1px solid rgba(147, 51, 234, 0.4)"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  🏛️ Bientôt
                </Box>
                <VStack spacing={2} align="start">
                  <Heading size="md" color="white">
                    JARVIS Museums
                  </Heading>
                  <Text fontSize="sm" color="gray.300" lineHeight="1.4">
                    Guide IA interactif pour espaces culturels. 
                    Expérience visiteur personnalisée et immersive.
                  </Text>
                </VStack>
                <Button
                  colorScheme="purple"
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  disabled
                  _disabled={{
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                >
                  Bientôt disponible
                </Button>
              </VStack>
            </Box>
          }
        />
      </Box>
    </HStack>
  );
};

export default JarvisTiltedCards;
