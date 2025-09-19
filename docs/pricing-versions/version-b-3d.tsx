            <VStack spacing={20} textAlign="center" pointerEvents="none">
              {/* Titre avec effet 3D */}
              <VStack spacing={6} pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, rotateX: -90 }}
                  whileInView={{ opacity: 1, rotateX: 0 }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Heading
                    fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                    fontWeight="black"
                    pointerEvents="none"
                    textAlign="center"
                    lineHeight="1.1"
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 10px 20px rgba(102, 126, 234, 0.3)"
                    }}
                  >
                    Parcours Investissement
                  </Heading>
                </motion.div>

                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300"
                  maxW="600px"
                  pointerEvents="none"
                  lineHeight="1.6"
                >
                  Explorez votre transformation digitale en 3D
                </Text>
              </VStack>

              {/* Environnement 3D Simulé */}
              <Box w="full" maxW="1200px" h="600px" position="relative" pointerEvents="auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.0, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Box
                    w="full"
                    h="full"
                    borderRadius="3xl"
                    bg="linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(102, 126, 234, 0.2)"
                    position="relative"
                    overflow="hidden"
                    style={{
                      perspective: "1000px"
                    }}
                  >
                    {/* Grille 3D de fond */}
                    <Box
                      position="absolute"
                      inset={0}
                      opacity={0.1}
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(102, 126, 234, 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(102, 126, 234, 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: "50px 50px",
                        transform: "rotateX(60deg) translateZ(-100px)"
                      }}
                    />

                    {/* Chemin 3D avec stations */}
                    <Box position="relative" h="full" display="flex" alignItems="center" justifyContent="center">
                      
                      {/* Station 1 - Installation */}
                      <motion.div
                        initial={{ opacity: 0, rotateY: -45, z: -100 }}
                        whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          left: "15%",
                          top: "20%",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        <motion.div
                          whileHover={{ 
                            rotateY: 15,
                            scale: 1.1,
                            z: 50
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <Box
                            w="200px"
                            h="250px"
                            borderRadius="2xl"
                            bg="linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))"
                            border="2px solid rgba(139, 92, 246, 0.5)"
                            p={6}
                            position="relative"
                            boxShadow="0 25px 50px rgba(139, 92, 246, 0.3)"
                            style={{
                              transform: "rotateX(10deg) rotateY(-10deg)"
                            }}
                          >
                            {/* Face avant */}
                            <VStack spacing={4} h="full" justify="center" textAlign="center">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              >
                                <Text fontSize="4xl">🚀</Text>
                              </motion.div>
                              <Text fontSize="lg" fontWeight="black" color="white">
                                Installation
                              </Text>
                              <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                                Jour 1-7
                              </Text>
                              <VStack spacing={2}>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Audit technique
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Déploiement matériel
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Configuration IA
                                </Text>
                              </VStack>
                            </VStack>

                            {/* Effet de profondeur */}
                            <Box
                              position="absolute"
                              top="10px"
                              left="10px"
                              right="-10px"
                              bottom="-10px"
                              borderRadius="2xl"
                              bg="rgba(139, 92, 246, 0.2)"
                              zIndex={-1}
                              style={{
                                transform: "translateZ(-20px)"
                              }}
                            />
                          </Box>
                        </motion.div>
                      </motion.div>

                      {/* Connexion 3D */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 1.0 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          left: "30%",
                          top: "35%",
                          width: "20%",
                          height: "4px",
                          background: "linear-gradient(90deg, #8b5cf6, #22c55e)",
                          borderRadius: "2px",
                          transformOrigin: "left",
                          transform: "rotateX(10deg) rotateZ(-10deg)"
                        }}
                      />

                      {/* Station 2 - Formation */}
                      <motion.div
                        initial={{ opacity: 0, rotateY: 45, z: -100 }}
                        whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          left: "40%",
                          top: "30%",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        <motion.div
                          whileHover={{ 
                            rotateY: -15,
                            scale: 1.1,
                            z: 50
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <Box
                            w="200px"
                            h="250px"
                            borderRadius="2xl"
                            bg="linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))"
                            border="2px solid rgba(34, 197, 94, 0.5)"
                            p={6}
                            position="relative"
                            boxShadow="0 25px 50px rgba(34, 197, 94, 0.3)"
                            style={{
                              transform: "rotateX(-5deg) rotateY(10deg)"
                            }}
                          >
                            <VStack spacing={4} h="full" justify="center" textAlign="center">
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 10, -10, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <Text fontSize="4xl">🎓</Text>
                              </motion.div>
                              <Text fontSize="lg" fontWeight="black" color="white">
                                Formation
                              </Text>
                              <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                                Jour 8-14
                              </Text>
                              <VStack spacing={2}>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Formation équipe
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Tests utilisateurs
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Mise en service
                                </Text>
                              </VStack>
                            </VStack>

                            <Box
                              position="absolute"
                              top="10px"
                              left="10px"
                              right="-10px"
                              bottom="-10px"
                              borderRadius="2xl"
                              bg="rgba(34, 197, 94, 0.2)"
                              zIndex={-1}
                              style={{
                                transform: "translateZ(-20px)"
                              }}
                            />
                          </Box>
                        </motion.div>
                      </motion.div>

                      {/* Connexion 3D */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          left: "55%",
                          top: "45%",
                          width: "20%",
                          height: "4px",
                          background: "linear-gradient(90deg, #22c55e, #f59e0b)",
                          borderRadius: "2px",
                          transformOrigin: "left",
                          transform: "rotateX(-10deg) rotateZ(10deg)"
                        }}
                      />

                      {/* Station 3 - Optimisation */}
                      <motion.div
                        initial={{ opacity: 0, rotateY: -45, z: -100 }}
                        whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                        transition={{ duration: 0.8, delay: 1.0 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          right: "15%",
                          top: "40%",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        <motion.div
                          whileHover={{ 
                            rotateY: 15,
                            scale: 1.1,
                            z: 50
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <Box
                            w="200px"
                            h="250px"
                            borderRadius="2xl"
                            bg="linear-gradient(135deg, rgba(249, 115, 22, 0.9), rgba(234, 88, 12, 0.9))"
                            border="2px solid rgba(249, 115, 22, 0.5)"
                            p={6}
                            position="relative"
                            boxShadow="0 25px 50px rgba(249, 115, 22, 0.3)"
                            style={{
                              transform: "rotateX(5deg) rotateY(-15deg)"
                            }}
                          >
                            <VStack spacing={4} h="full" justify="center" textAlign="center">
                              <motion.div
                                animate={{ 
                                  y: [0, -10, 0],
                                  rotateZ: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Text fontSize="4xl">💎</Text>
                              </motion.div>
                              <Text fontSize="lg" fontWeight="black" color="white">
                                Optimisation
                              </Text>
                              <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                                Jour 15+
                              </Text>
                              <VStack spacing={2}>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • IA 24/7 active
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Analytics avancés
                                </Text>
                                <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                                  • Support premium
                                </Text>
                              </VStack>
                            </VStack>

                            <Box
                              position="absolute"
                              top="10px"
                              left="10px"
                              right="-10px"
                              bottom="-10px"
                              borderRadius="2xl"
                              bg="rgba(249, 115, 22, 0.2)"
                              zIndex={-1}
                              style={{
                                transform: "translateZ(-20px)"
                              }}
                            />
                          </Box>
                        </motion.div>
                      </motion.div>

                      {/* Particules flottantes 3D */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          style={{
                            position: "absolute",
                            left: `${20 + i * 10}%`,
                            top: `${10 + (i % 3) * 20}%`,
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: `rgba(${102 + i * 20}, ${126 + i * 15}, 234, 0.6)`,
                            boxShadow: `0 0 10px rgba(${102 + i * 20}, ${126 + i * 15}, 234, 0.8)`
                          }}
                          animate={{
                            y: [0, -20, 0],
                            rotateZ: [0, 360],
                            scale: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </Box>

                    {/* CTA Flottant */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.5 }}
                      viewport={{ once: true }}
                      style={{
                        position: "absolute",
                        bottom: "30px",
                        left: "50%",
                        transform: "translateX(-50%)"
                      }}
                    >
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          rotateX: 10,
                          z: 20
                        }}
                        whileTap={{ scale: 0.95 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <Button
                          size="xl"
                          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          color="white"
                          px={12}
                          py={8}
                          borderRadius="2xl"
                          fontWeight="black"
                          fontSize="xl"
                          boxShadow="0 20px 40px rgba(102, 126, 234, 0.4)"
                          _hover={{
                            boxShadow: "0 30px 60px rgba(102, 126, 234, 0.6)"
                          }}
                          transition="all 0.3s ease"
                        >
                          🚀 Explorer le parcours
                        </Button>
                      </motion.div>
                    </motion.div>
                  </Box>
                </motion.div>
              </Box>
            </VStack>


