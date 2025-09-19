      {/* 6. SECTION TARIFICATION INNOVANTE - DESIGN TIMELINE */}
      <Container id="tarifs" maxW="8xl" px={8} py={20} mt={24} position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ pointerEvents: "none" }}
        >
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            {/* Titre avec effet néon */}
            <VStack spacing={6} pointerEvents="none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Heading
                  fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                  fontWeight="black"
                  pointerEvents="none"
                  textAlign="center"
                  lineHeight="1.1"
                  position="relative"
                >
                  <motion.div
                    animate={{
                      textShadow: [
                        "0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4)",
                        "0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)",
                        "0 0 25px rgba(249, 115, 22, 0.8), 0 0 50px rgba(249, 115, 22, 0.4)",
                        "0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4)"
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      background: "linear-gradient(45deg, #8b5cf6, #22c55e, #f97316, #8b5cf6)",
                      backgroundSize: "300% 300%",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
                    Investissement
                  </motion.div>
                </Heading>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300"
                  maxW="600px"
                  pointerEvents="none"
                  lineHeight="1.6"
                >
                  Un parcours d'investissement transparent qui transforme votre salle en 30 jours
                </Text>
              </motion.div>
            </VStack>

            {/* Timeline interactive */}
            <Box w="full" maxW="1000px" position="relative" pointerEvents="none">
              {/* Ligne de timeline */}
              <Box
                position="absolute"
                top="50%"
                left="10%"
                right="10%"
                height="4px"
                bg="linear-gradient(90deg, #8b5cf6, #22c55e, #f97316)"
                borderRadius="full"
                transform="translateY(-50%)"
                zIndex={1}
              />

              {/* Points de timeline */}
              <Flex justify="space-between" align="center" px="10%" position="relative" zIndex={2}>
                {[
                  {
                    phase: "Jour 1",
                    title: "Installation",
                    price: "Sur devis",
                    color: "#8b5cf6",
                    icon: "🚀",
                    details: ["Audit de votre salle", "Installation matérielle", "Configuration IA"]
                  },
                  {
                    phase: "Jour 7",
                    title: "Formation",
                    price: "Inclus",
                    color: "#22c55e",
                    icon: "🎓",
                    details: ["Formation équipe", "Tests utilisateurs", "Mise en service"]
                  },
                  {
                    phase: "Jour 30+",
                    title: "Abonnement",
                    price: "Mensuel",
                    color: "#f97316",
                    icon: "💎",
                    details: ["IA conversationnelle", "Dashboard analytics", "Support premium"]
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.3,
                      type: "spring",
                      bounce: 0.4
                    }}
                    viewport={{ once: true }}
                  >
                    <VStack spacing={6} align="center" maxW="280px" pointerEvents="auto">
                      {/* Point de timeline */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Box
                          w="80px"
                          h="80px"
                          borderRadius="50%"
                          bg={step.color}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                          boxShadow={`0 0 30px ${step.color}60`}
                          border="4px solid rgba(255, 255, 255, 0.1)"
                          position="relative"
                          overflow="hidden"
                        >
                          {/* Effet de brillance */}
                          <motion.div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: `linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
                              borderRadius: "50%"
                            }}
                            animate={{
                              rotate: [0, 360]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          <Text fontSize="2xl" zIndex={2}>
                            {step.icon}
                          </Text>
                        </Box>
                      </motion.div>

                      {/* Carte d'information */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Box
                          p={6}
                          borderRadius="2xl"
                          bg="rgba(0, 0, 0, 0.7)"
                          backdropFilter="blur(20px)"
                          border={`2px solid ${step.color}40`}
                          boxShadow={`0 10px 40px ${step.color}20`}
                          _hover={{
                            borderColor: `${step.color}80`,
                            boxShadow: `0 20px 60px ${step.color}40`
                          }}
                          transition="all 0.3s ease"
                          minH="200px"
                        >
                          <VStack spacing={4} textAlign="center">
                            <Text fontSize="sm" color={step.color} fontWeight="bold" textTransform="uppercase">
                              {step.phase}
                            </Text>
                            
                            <Heading fontSize="xl" color="white" fontWeight="black">
                              {step.title}
                            </Heading>
                            
                            <Text fontSize="lg" color={step.color} fontWeight="bold">
                              {step.price}
                            </Text>
                            
                            <VStack spacing={2} w="full">
                              {step.details.map((detail, detailIndex) => (
                                <Text key={detailIndex} fontSize="sm" color="gray.400" textAlign="center">
                                  {detail}
                                </Text>
                              ))}
                            </VStack>
                          </VStack>
                        </Box>
                      </motion.div>
                    </VStack>
                  </motion.div>
                ))}
              </Flex>
            </Box>

            {/* ROI Calculator Visual */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <Box
                p={8}
                borderRadius="3xl"
                bg="rgba(0, 0, 0, 0.8)"
                backdropFilter="blur(30px)"
                border="2px solid rgba(139, 92, 246, 0.3)"
                maxW="600px"
                position="relative"
                overflow="hidden"
              >
                {/* Effet de particules animées */}
                <motion.div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1), transparent 70%)"
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                <VStack spacing={6} position="relative" zIndex={2}>
                  <Text fontSize="2xl" fontWeight="black" color="white">
                    💰 Retour sur Investissement
                  </Text>
                  
                  <HStack spacing={8} justify="center">
                    <VStack spacing={2}>
                      <Text fontSize="3xl" fontWeight="black" color="#22c55e">
                        +67%
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Rétention membres
                      </Text>
                    </VStack>
                    
                    <Box w="2px" h="60px" bg="rgba(255, 255, 255, 0.2)" />
                    
                    <VStack spacing={2}>
                      <Text fontSize="3xl" fontWeight="black" color="#f97316">
                        -52%
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Coûts opérationnels
                      </Text>
                    </VStack>
                    
                    <Box w="2px" h="60px" bg="rgba(255, 255, 255, 0.2)" />
                    
                    <VStack spacing={2}>
                      <Text fontSize="3xl" fontWeight="black" color="#8b5cf6">
                        3-6 mois
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Amortissement
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>
            </motion.div>

            {/* CTA Final */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              viewport={{ once: true }}
              style={{ pointerEvents: "auto" }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="xl"
                  bg="linear-gradient(135deg, #8b5cf6 0%, #22c55e 50%, #f97316 100%)"
                  color="white"
                  px={12}
                  py={8}
                  borderRadius="full"
                  fontWeight="black"
                  fontSize="xl"
                  pointerEvents="auto"
                  _hover={{
                    transform: "translateY(-6px)",
                    boxShadow: "0 25px 50px rgba(139, 92, 246, 0.4)"
                  }}
                  transition="all 0.3s ease"
                  position="relative"
                  overflow="hidden"
                >
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                    }}
                    animate={{
                      x: ["-100%", "100%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <Text zIndex={2} position="relative">
                    ✨ Obtenir un devis personnalisé
                  </Text>
                </Button>
              </motion.div>
            </motion.div>
          </VStack>
        </motion.div>
      </Container>


