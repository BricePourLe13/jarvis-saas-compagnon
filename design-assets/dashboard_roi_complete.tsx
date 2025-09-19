              {/* Dashboard ROI Interactif */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Box
                  w="full"
                  maxW="1200px"
                  p={8}
                  borderRadius="3xl"
                  bg="rgba(15, 23, 42, 0.95)"
                  backdropFilter="blur(20px)"
                  border="1px solid rgba(59, 130, 246, 0.2)"
                  position="relative"
                  overflow="hidden"
                  pointerEvents="auto"
                  boxShadow="0 25px 50px rgba(0, 0, 0, 0.3)"
                >
                  {/* Métriques Principales */}
                  <HStack spacing={6} justify="space-between" mb={8}>
                    {[
                      { label: "Chiffre d'affaires", value: "€127,500", change: "+23%", color: "#22c55e" },
                      { label: "Membres actifs", value: "1,247", change: "+67%", color: "#3b82f6" },
                      { label: "Taux de rétention", value: "94.2%", change: "+12%", color: "#f59e0b" }
                    ].map((metric, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                        viewport={{ once: true }}
                        style={{ flex: 1 }}
                      >
                        <Box
                          p={6}
                          borderRadius="xl"
                          bg="rgba(0, 0, 0, 0.4)"
                          border={`1px solid ${metric.color}30`}
                          textAlign="center"
                          _hover={{
                            borderColor: `${metric.color}60`,
                            transform: "translateY(-2px)",
                            boxShadow: `0 10px 25px ${metric.color}20`
                          }}
                          transition="all 0.3s ease"
                          position="relative"
                        >
                          <Text fontSize="xs" color="gray.400" mb={2} textTransform="uppercase" letterSpacing="wider">
                            {metric.label}
                          </Text>
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.8, delay: 1.0 + index * 0.1, type: "spring", bounce: 0.4 }}
                            viewport={{ once: true }}
                          >
                            <Text fontSize="2xl" fontWeight="black" color="white" mb={1}>
                              {metric.value}
                            </Text>
                          </motion.div>
                          <Text fontSize="sm" color={metric.color} fontWeight="bold">
                            {metric.change}
                          </Text>
                          
                          {/* Effet de brillance */}
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            borderRadius="xl"
                            bg={`linear-gradient(135deg, transparent, ${metric.color}10, transparent)`}
                            pointerEvents="none"
                          />
                        </Box>
                      </motion.div>
                    ))}
                  </HStack>

                  {/* Graphique de croissance simulé */}
                  <Box
                    p={6}
                    borderRadius="2xl"
                    bg="rgba(0, 0, 0, 0.3)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    position="relative"
                    h="200px"
                    mb={8}
                  >
                    <Text fontSize="sm" color="gray.400" mb={4} fontWeight="medium">
                      📈 Projection de revenus (12 mois)
                    </Text>
                    
                    {/* Simulation de graphique avec SVG */}
                    <Box position="relative" h="full">
                      <svg width="100%" height="100%" viewBox="0 0 400 120">
                        <defs>
                          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        
                        {/* Ligne de croissance */}
                        <motion.path
                          d="M 20 100 Q 100 80 200 60 T 380 20"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ duration: 2, delay: 1.2 }}
                          viewport={{ once: true }}
                        />
                        
                        {/* Zone sous la courbe */}
                        <motion.path
                          d="M 20 100 Q 100 80 200 60 T 380 20 L 380 120 L 20 120 Z"
                          fill="url(#revenueGradient)"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 1.8 }}
                          viewport={{ once: true }}
                        />
                        
                        {/* Points de données */}
                        {[20, 100, 200, 300, 380].map((x, i) => (
                          <motion.circle
                            key={i}
                            cx={x}
                            cy={100 - i * 20}
                            r="5"
                            fill="#3b82f6"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
                            viewport={{ once: true }}
                          />
                        ))}
                      </svg>
                    </Box>
                  </Box>

                  {/* CTA Buttons */}
                  <HStack spacing={4} justify="center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        bg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                        color="white"
                        px={10}
                        py={6}
                        borderRadius="xl"
                        fontWeight="bold"
                        fontSize="lg"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 15px 35px rgba(59, 130, 246, 0.4)"
                        }}
                        transition="all 0.3s ease"
                      >
                        📊 Simuler mon ROI
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        borderColor="gray.600"
                        color="gray.300"
                        size="lg"
                        px={10}
                        py={6}
                        borderRadius="xl"
                        fontSize="lg"
                        _hover={{
                          borderColor: "gray.400",
                          color: "white",
                          bg: "rgba(255, 255, 255, 0.05)"
                        }}
                        transition="all 0.3s ease"
                      >
                        📞 Parler à un expert
                      </Button>
                    </motion.div>
                  </HStack>
                </Box>
              </motion.div>
            </VStack>
          </motion.div>
        </Container>
      </Box>

      {/* 7. SECTION CONTACT */}
      <Box id="contact" minH="100vh" display="flex" alignItems="center" position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '160px' }} mt={20} py={20}>
        <Container maxW="8xl" px={8} pointerEvents="none">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            style={{ pointerEvents: "none" }}
          >
            <VStack spacing={12} textAlign="center" pointerEvents="none">
              <VStack spacing={6} pointerEvents="none">
                <Heading
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  fontWeight="black"
                  color="white"
                  pointerEvents="none"
                  textAlign="center"
                  lineHeight="1.1"
                >
                  Prêt à révolutionner votre salle ?
                </Heading>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300"
                  maxW="600px"
                  pointerEvents="none"
                  lineHeight="1.6"
                >
                  Rejoignez les salles qui transforment déjà l'expérience de leurs membres avec JARVIS
                </Text>
              </VStack>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                style={{ pointerEvents: "auto" }}
              >
                <VStack spacing={6}>
                  <HStack spacing={4}>
                    <Button
                      size="xl"
                      bg="linear-gradient(135deg, #8b5cf6, #22c55e)"
                      color="white"
                      px={12}
                      py={8}
                      borderRadius="2xl"
                      fontWeight="black"
                      fontSize="xl"
                      _hover={{
                        transform: "translateY(-3px)",
                        boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)"
                      }}
                      transition="all 0.3s ease"
                    >
                      🚀 Parler à JARVIS
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="gray.600"
                      color="gray.300"
                      size="xl"
                      px={12}
                      py={8}
                      borderRadius="2xl"
                      _hover={{
                        borderColor: "gray.400",
                        color: "white"
                      }}
                    >
                      📞 Être rappelé
                    </Button>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    🛡️ Garantie satisfaction 30 jours • Installation sous 48h • Support 24/7
                  </Text>
                </VStack>
              </motion.div>
            </VStack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}


