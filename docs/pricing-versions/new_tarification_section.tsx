      {/* 6. SECTION TARIFICATION - VERSION A: FINANCIAL DASHBOARD SIMULATOR */}
      <Box id="tarifs" minH="100vh" display="flex" alignItems="center" position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '160px' }} mt={20} py={20}>
        <Container maxW="8xl" px={8} pointerEvents="none">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            style={{ pointerEvents: "none" }}
          >
            <VStack spacing={16} textAlign="center" pointerEvents="none">
              {/* Titre avec effet de données financières */}
              <VStack spacing={6} pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.0, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Heading
                    fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                    fontWeight="black"
                    pointerEvents="none"
                    textAlign="center"
                    lineHeight="1.1"
                    color="white"
                  >
                    Simulateur ROI
                  </Heading>
                </motion.div>

                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300"
                  maxW="600px"
                  pointerEvents="none"
                  lineHeight="1.6"
                >
                  Calculez votre retour sur investissement en temps réel
                </Text>
              </VStack>

              {/* Dashboard Interactif */}
              <Box w="full" maxW="1200px" pointerEvents="auto">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Box
                    p={8}
                    borderRadius="3xl"
                    bg="rgba(15, 23, 42, 0.95)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(59, 130, 246, 0.2)"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Grid Dashboard */}
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
                      
                      {/* Gauche - Graphiques et Métriques */}
                      <VStack spacing={6} align="stretch">
                        
                        {/* Métriques Principales Animées */}
                        <HStack spacing={6} justify="space-between">
                          {[
                            { label: "Chiffre d'affaires", value: "€127,500", change: "+23%", color: "#22c55e" },
                            { label: "Membres actifs", value: "1,247", change: "+67%", color: "#3b82f6" },
                            { label: "Taux de rétention", value: "94.2%", change: "+12%", color: "#f59e0b" }
                          ].map((metric, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                              viewport={{ once: true }}
                              style={{ flex: 1 }}
                            >
                              <Box
                                p={4}
                                borderRadius="xl"
                                bg="rgba(0, 0, 0, 0.4)"
                                border={`1px solid ${metric.color}30`}
                                textAlign="center"
                                _hover={{
                                  borderColor: `${metric.color}60`,
                                  transform: "translateY(-2px)"
                                }}
                                transition="all 0.3s ease"
                              >
                                <Text fontSize="xs" color="gray.400" mb={1}>
                                  {metric.label}
                                </Text>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  transition={{ duration: 0.8, delay: 0.8 + index * 0.1, type: "spring", bounce: 0.4 }}
                                  viewport={{ once: true }}
                                >
                                  <Text fontSize="xl" fontWeight="black" color="white">
                                    {metric.value}
                                  </Text>
                                </motion.div>
                                <Text fontSize="xs" color={metric.color} fontWeight="bold">
                                  {metric.change}
                                </Text>
                              </Box>
                            </motion.div>
                          ))}
                        </HStack>

                        {/* Graphique de Croissance Simulé */}
                        <Box
                          p={6}
                          borderRadius="2xl"
                          bg="rgba(0, 0, 0, 0.3)"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                          position="relative"
                          h="200px"
                        >
                          <Text fontSize="sm" color="gray.400" mb={4}>
                            📈 Projection de revenus (12 mois)
                          </Text>
                          
                          {/* Simulation de graphique avec SVG */}
                          <Box position="relative" h="full">
                            <svg width="100%" height="100%" viewBox="0 0 400 120">
                              <defs>
                                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
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
                                transition={{ duration: 2, delay: 1 }}
                                viewport={{ once: true }}
                              />
                              
                              {/* Zone sous la courbe */}
                              <motion.path
                                d="M 20 100 Q 100 80 200 60 T 380 20 L 380 120 L 20 120 Z"
                                fill="url(#revenueGradient)"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 1, delay: 1.5 }}
                                viewport={{ once: true }}
                              />
                              
                              {/* Points de données */}
                              {[20, 100, 200, 300, 380].map((x, i) => (
                                <motion.circle
                                  key={i}
                                  cx={x}
                                  cy={100 - i * 20}
                                  r="4"
                                  fill="#3b82f6"
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  transition={{ duration: 0.3, delay: 1.2 + i * 0.1 }}
                                  viewport={{ once: true }}
                                />
                              ))}
                            </svg>
                          </Box>
                        </Box>
                      </VStack>

                      {/* Droite - Timeline Interactive */}
                      <VStack spacing={4} align="stretch">
                        <Text fontSize="lg" fontWeight="bold" color="white" textAlign="center">
                          🚀 Parcours d'implémentation
                        </Text>
                        
                        {[
                          { phase: "J1-7", title: "Installation", status: "completed", color: "#22c55e" },
                          { phase: "J8-14", title: "Formation", status: "current", color: "#3b82f6" },
                          { phase: "J15+", title: "Optimisation", status: "pending", color: "#6b7280" }
                        ].map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                            viewport={{ once: true }}
                          >
                            <Box
                              p={4}
                              borderRadius="xl"
                              bg={step.status === 'current' ? `${step.color}20` : "rgba(0, 0, 0, 0.3)"}
                              border={`2px solid ${step.color}40`}
                              position="relative"
                              _hover={{
                                borderColor: `${step.color}80`,
                                transform: "translateX(-4px)"
                              }}
                              transition="all 0.3s ease"
                            >
                              <HStack spacing={3}>
                                <Box
                                  w="12px"
                                  h="12px"
                                  borderRadius="50%"
                                  bg={step.color}
                                  boxShadow={`0 0 10px ${step.color}`}
                                />
                                <VStack align="flex-start" spacing={1} flex="1">
                                  <Text fontSize="xs" color={step.color} fontWeight="bold">
                                    {step.phase}
                                  </Text>
                                  <Text fontSize="sm" color="white" fontWeight="medium">
                                    {step.title}
                                  </Text>
                                </VStack>
                                {step.status === 'completed' && (
                                  <Text fontSize="lg" color={step.color}>✓</Text>
                                )}
                                {step.status === 'current' && (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Text fontSize="lg" color={step.color}>⟳</Text>
                                  </motion.div>
                                )}
                              </HStack>
                            </Box>
                          </motion.div>
                        ))}
                      </VStack>
                    </Grid>

                    {/* CTA Intégré au Dashboard */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.5 }}
                      viewport={{ once: true }}
                    >
                      <HStack spacing={4} justify="center" mt={8}>
                        <Button
                          size="lg"
                          bg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                          color="white"
                          px={8}
                          py={6}
                          borderRadius="xl"
                          fontWeight="bold"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)"
                          }}
                          transition="all 0.3s ease"
                        >
                          📊 Simuler mon ROI
                        </Button>
                        <Button
                          variant="outline"
                          borderColor="gray.600"
                          color="gray.300"
                          size="lg"
                          px={8}
                          py={6}
                          borderRadius="xl"
                          _hover={{
                            borderColor: "gray.400",
                            color: "white"
                          }}
                        >
                          📞 Parler à un expert
                        </Button>
                      </HStack>
                    </motion.div>
                  </Box>
                </motion.div>
              </Box>
            </VStack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}