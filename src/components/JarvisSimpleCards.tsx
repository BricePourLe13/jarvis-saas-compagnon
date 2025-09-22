import React from 'react';
import { Box, VStack, Heading, Text, Button, HStack, Badge } from '@chakra-ui/react';

const JarvisSimpleCards: React.FC = () => {
  return (
    <HStack 
      spacing={8} 
      justify="center" 
      align="stretch" 
      w="full" 
      flexWrap={{ base: "wrap", md: "nowrap" }}
      pointerEvents="none"
    >
      {/* JARVIS FITNESS CARD */}
      <Box 
        flex={1} 
        maxW="500px" 
        minW="300px"
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        p={8}
        position="relative"
        overflow="hidden"
        pointerEvents="auto"
        _hover={{
          borderColor: "rgba(59, 130, 246, 0.4)",
          transform: "translateY(-8px)",
          boxShadow: "0 20px 40px rgba(59, 130, 246, 0.1)"
        }}
        transition="all 0.3s ease"
        cursor="pointer"
      >
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="100px"
          h="100px"
          opacity={0.1}
          fontSize="4xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          🏋️‍♂️
        </Box>

        <VStack spacing={6} align="start" h="full" pointerEvents="none">
          {/* Badge */}
          <Badge
            colorScheme="blue"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="medium"
            pointerEvents="none"
          >
            🏋️‍♂️ Disponible
          </Badge>

          {/* Content */}
          <VStack spacing={4} align="start" flex={1} pointerEvents="none">
            <Heading size="xl" color="white" pointerEvents="none">
              JARVIS Fitness
            </Heading>
            <Text color="gray.300" lineHeight="1.6" pointerEvents="none">
              Assistant IA conversationnel pour salles de sport. 
              Engagement membre 24/7 avec reconnaissance vocale avancée.
            </Text>
          </VStack>

          {/* Button */}
          <Button
            colorScheme="blue"
            size="md"
            borderRadius="full"
            pointerEvents="auto"
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

      {/* JARVIS MUSEUMS CARD */}
      <Box 
        flex={1} 
        maxW="500px" 
        minW="300px"
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        p={8}
        position="relative"
        overflow="hidden"
        pointerEvents="auto"
        _hover={{
          borderColor: "rgba(147, 51, 234, 0.4)",
          transform: "translateY(-8px)",
          boxShadow: "0 20px 40px rgba(147, 51, 234, 0.1)"
        }}
        transition="all 0.3s ease"
        cursor="pointer"
      >
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="100px"
          h="100px"
          opacity={0.1}
          fontSize="4xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          🏛️
        </Box>

        <VStack spacing={6} align="start" h="full" pointerEvents="none">
          {/* Badge */}
          <Badge
            colorScheme="purple"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="medium"
            pointerEvents="none"
          >
            🏛️ Bientôt
          </Badge>

          {/* Content */}
          <VStack spacing={4} align="start" flex={1} pointerEvents="none">
            <Heading size="xl" color="white" pointerEvents="none">
              JARVIS Museums
            </Heading>
            <Text color="gray.300" lineHeight="1.6" pointerEvents="none">
              Guide IA interactif pour espaces culturels. 
              Expérience visiteur personnalisée et immersive.
            </Text>
          </VStack>

          {/* Button */}
          <Button
            colorScheme="purple"
            variant="outline"
            size="md"
            borderRadius="full"
            disabled
            pointerEvents="auto"
            _disabled={{
              opacity: 0.6,
              cursor: 'not-allowed'
            }}
          >
            Bientôt disponible
          </Button>
        </VStack>
      </Box>
    </HStack>
  );
};

export default JarvisSimpleCards;


