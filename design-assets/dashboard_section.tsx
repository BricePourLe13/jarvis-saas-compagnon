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
                    {/* Métriques Principales */}
                    <HStack spacing={6} justify="space-between" mb={6}>
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
                            <Text fontSize="xl" fontWeight="black" color="white">
                              {metric.value}
                            </Text>
                            <Text fontSize="xs" color={metric.color} fontWeight="bold">
                              {metric.change}
                            </Text>
                          </Box>
                        </motion.div>
                      ))}
                    </HStack>

                    {/* CTA Buttons */}
                    <HStack spacing={4} justify="center">
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


