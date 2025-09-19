            <VStack spacing={16} textAlign="center" pointerEvents="none">
              {/* Titre avec effet glassmorphism */}
              <VStack spacing={6} pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, y: -30, rotateX: 90 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 1.0, delay: 0.2, type: "spring", bounce: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Box
                    position="relative"
                    p={8}
                    borderRadius="3xl"
                    bg="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    boxShadow="0 25px 50px rgba(0, 0, 0, 0.2)"
                  >
                    <Heading
                      fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                      fontWeight="black"
                      pointerEvents="none"
                      textAlign="center"
                      lineHeight="1.1"
                      color="white"
                      style={{
                        textShadow: "0 0 30px rgba(255, 255, 255, 0.3)"
                      }}
                    >
                      Investissement Premium
                    </Heading>
                    
                    {/* Effet de réfraction */}
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      borderRadius="3xl"
                      bg="linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)"
                      pointerEvents="none"
                    />
                  </Box>
                </motion.div>

                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="rgba(255, 255, 255, 0.7)"
                  maxW="600px"
                  pointerEvents="none"
                  lineHeight="1.6"
                >
                  Une expérience d'investissement transparente et élégante
                </Text>
              </VStack>

              {/* Cards flottantes en glassmorphism */}
              <Box w="full" maxW="1200px" position="relative" pointerEvents="none">
                
                {/* Particules de fond */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${10 + i * 8}%`,
                      top: `${5 + (i % 4) * 25}%`,
                      width: `${8 + i * 2}px`,
                      height: `${8 + i * 2}px`,
                      borderRadius: "50%",
                      background: `rgba(255, 255, 255, ${0.1 + (i % 3) * 0.05})`,
                      backdropFilter: "blur(10px)",
                      zIndex: 0
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 4 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}

                {/* Timeline glassmorphism */}
                <VStack spacing={12} position="relative" zIndex={10} pointerEvents="auto">
                  
                  {/* Ligne de connexion glass */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 2, delay: 0.5 }}
                    viewport={{ once: true }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "10%",
                      bottom: "10%",
                      width: "2px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(255,255,255,0.3))",
                      borderRadius: "1px",
                      transformOrigin: "top",
                      transform: "translateX(-50%)"
                    }}
                  />

                  {[
                    {
                      phase: "Phase 1",
                      title: "Installation Premium",
                      price: "Sur devis personnalisé",
                      icon: "🚀",
                      details: [
                        "Audit technique approfondi",
                        "Installation matérielle premium",
                        "Configuration IA personnalisée",
                        "Tests de performance"
                      ],
                      position: "left",
                      delay: 0.6
                    },
                    {
                      phase: "Phase 2",
                      title: "Formation Excellence",
                      price: "Inclus dans l'offre",
                      icon: "🎓",
                      details: [
                        "Formation équipe complète",
                        "Sessions pratiques individuelles",
                        "Documentation personnalisée",
                        "Support dédié 30 jours"
                      ],
                      position: "right",
                      delay: 0.8
                    },
                    {
                      phase: "Phase 3",
                      title: "Optimisation Continue",
                      price: "Abonnement mensuel",
                      icon: "💎",
                      details: [
                        "IA conversationnelle 24/7",
                        "Analytics temps réel",
                        "Mises à jour automatiques",
                        "Support premium illimité"
                      ],
                      position: "left",
                      delay: 1.0
                    }
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ 
                        opacity: 0, 
                        x: step.position === 'left' ? -100 : 100,
                        rotateY: step.position === 'left' ? -30 : 30
                      }}
                      whileInView={{ 
                        opacity: 1, 
                        x: 0,
                        rotateY: 0
                      }}
                      transition={{ 
                        duration: 0.8, 
                        delay: step.delay,
                        type: "spring",
                        bounce: 0.3
                      }}
                      viewport={{ once: true }}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: step.position === 'left' ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          rotateY: step.position === 'left' ? 5 : -5,
                          z: 20
                        }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{
                          maxWidth: "500px",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        <Box
                          p={8}
                          borderRadius="3xl"
                          bg="rgba(255, 255, 255, 0.08)"
                          backdropFilter="blur(25px)"
                          border="1px solid rgba(255, 255, 255, 0.15)"
                          boxShadow="0 25px 50px rgba(0, 0, 0, 0.1)"
                          position="relative"
                          overflow="hidden"
                          _hover={{
                            bg: "rgba(255, 255, 255, 0.12)",
                            borderColor: "rgba(255, 255, 255, 0.25)"
                          }}
                          transition="all 0.3s ease"
                        >
                          {/* Effet de brillance au hover */}
                          <motion.div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: "-100%",
                              width: "100%",
                              height: "100%",
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                              zIndex: 1
                            }}
                            whileHover={{
                              left: "100%"
                            }}
                            transition={{ duration: 0.6 }}
                          />

                          <HStack spacing={6} align="flex-start" position="relative" zIndex={2}>
                            
                            {/* Icône avec effet glass */}
                            <motion.div
                              animate={{ 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                duration: 4, 
                                repeat: Infinity,
                                delay: index * 0.5
                              }}
                            >
                              <Box
                                w="80px"
                                h="80px"
                                borderRadius="2xl"
                                bg="rgba(255, 255, 255, 0.1)"
                                backdropFilter="blur(15px)"
                                border="1px solid rgba(255, 255, 255, 0.2)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontSize="2xl"
                                boxShadow="0 15px 30px rgba(0, 0, 0, 0.1)"
                                flexShrink={0}
                              >
                                <Text fontSize="2xl">{step.icon}</Text>
                              </Box>
                            </motion.div>

                            {/* Contenu */}
                            <VStack align="flex-start" spacing={4} flex="1">
                              <VStack align="flex-start" spacing={2}>
                                <Text 
                                  fontSize="sm" 
                                  color="rgba(255, 255, 255, 0.6)" 
                                  fontWeight="bold"
                                  textTransform="uppercase"
                                  letterSpacing="wider"
                                >
                                  {step.phase}
                                </Text>
                                <Heading 
                                  fontSize="xl" 
                                  color="white" 
                                  fontWeight="black"
                                  textShadow="0 0 10px rgba(255, 255, 255, 0.3)"
                                >
                                  {step.title}
                                </Heading>
                                <Text 
                                  fontSize="md" 
                                  color="rgba(255, 255, 255, 0.8)" 
                                  fontWeight="medium"
                                >
                                  {step.price}
                                </Text>
                              </VStack>

                              {/* Liste des fonctionnalités */}
                              <VStack align="flex-start" spacing={2} w="full">
                                {step.details.map((detail, detailIndex) => (
                                  <motion.div
                                    key={detailIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ 
                                      duration: 0.4, 
                                      delay: step.delay + 0.2 + detailIndex * 0.1 
                                    }}
                                    viewport={{ once: true }}
                                  >
                                    <HStack spacing={3}>
                                      <Box
                                        w="6px"
                                        h="6px"
                                        borderRadius="50%"
                                        bg="rgba(255, 255, 255, 0.4)"
                                        boxShadow="0 0 10px rgba(255, 255, 255, 0.6)"
                                      />
                                      <Text 
                                        fontSize="sm" 
                                        color="rgba(255, 255, 255, 0.7)"
                                        lineHeight="1.5"
                                      >
                                        {detail}
                                      </Text>
                                    </HStack>
                                  </motion.div>
                                ))}
                              </VStack>
                            </VStack>
                          </HStack>
                        </Box>
                      </motion.div>
                    </motion.div>
                  ))}
                </VStack>
              </Box>

              {/* ROI Section glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                viewport={{ once: true }}
              >
                <Box
                  p={10}
                  borderRadius="3xl"
                  bg="rgba(255, 255, 255, 0.06)"
                  backdropFilter="blur(30px)"
                  border="1px solid rgba(255, 255, 255, 0.12)"
                  boxShadow="0 30px 60px rgba(0, 0, 0, 0.15)"
                  maxW="600px"
                  position="relative"
                  overflow="hidden"
                >
                  {/* Effet de particules en arrière-plan */}
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1), transparent 50%)"
                    }}
                    animate={{
                      background: [
                        "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1), transparent 50%)",
                        "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15), transparent 50%)",
                        "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1), transparent 50%)"
                      ]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  <VStack spacing={8} position="relative" zIndex={2}>
                    <Text 
                      fontSize="2xl" 
                      fontWeight="black" 
                      color="white"
                      textShadow="0 0 20px rgba(255, 255, 255, 0.3)"
                    >
                      💎 Retour sur Investissement Premium
                    </Text>
                    
                    <HStack spacing={8} justify="center" flexWrap="wrap">
                      {[
                        { value: "+67%", label: "Rétention membres", color: "rgba(34, 197, 94, 0.8)" },
                        { value: "-52%", label: "Coûts opérationnels", color: "rgba(249, 115, 22, 0.8)" },
                        { value: "3-6 mois", label: "Amortissement", color: "rgba(139, 92, 246, 0.8)" }
                      ].map((metric, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            duration: 0.6, 
                            delay: 1.4 + index * 0.2,
                            type: "spring",
                            bounce: 0.5
                          }}
                          viewport={{ once: true }}
                        >
                          <VStack spacing={3}>
                            <Box
                              p={4}
                              borderRadius="2xl"
                              bg="rgba(255, 255, 255, 0.08)"
                              backdropFilter="blur(15px)"
                              border="1px solid rgba(255, 255, 255, 0.15)"
                              minW="120px"
                            >
                              <Text 
                                fontSize="2xl" 
                                fontWeight="black" 
                                color={metric.color}
                                textShadow={`0 0 15px ${metric.color}`}
                              >
                                {metric.value}
                              </Text>
                            </Box>
                            <Text 
                              fontSize="sm" 
                              color="rgba(255, 255, 255, 0.6)"
                              textAlign="center"
                              maxW="100px"
                            >
                              {metric.label}
                            </Text>
                          </VStack>
                        </motion.div>
                      ))}
                    </HStack>
                  </VStack>
                </Box>
              </motion.div>

              {/* CTA glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                viewport={{ once: true }}
                style={{ pointerEvents: "auto" }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    rotateX: 5
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Button
                    size="xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    color="white"
                    px={12}
                    py={8}
                    borderRadius="2xl"
                    fontWeight="black"
                    fontSize="xl"
                    boxShadow="0 25px 50px rgba(0, 0, 0, 0.2)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.15)",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 35px 70px rgba(0, 0, 0, 0.3)"
                    }}
                    transition="all 0.3s ease"
                    position="relative"
                    overflow="hidden"
                  >
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                      }}
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    <Text zIndex={2} position="relative">
                      ✨ Découvrir l'offre Premium
                    </Text>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Garantie glassmorphism */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                viewport={{ once: true }}
              >
                <Box
                  p={4}
                  borderRadius="xl"
                  bg="rgba(255, 255, 255, 0.04)"
                  backdropFilter="blur(15px)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                >
                  <Text 
                    fontSize="sm" 
                    color="rgba(255, 255, 255, 0.6)" 
                    textAlign="center"
                  >
                    🛡️ Garantie satisfaction premium 60 jours
                  </Text>
                </Box>
              </motion.div>
            </VStack>


