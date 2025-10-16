/**
 * 🎯 KNOWLEDGE BASE STRICTE - JARVIS SOLUTION
 * 
 * Base de connaissances COMPLÈTE basée sur PROJET.md
 * L'IA NE PEUT parler QUE de ce qui est ici
 * Toute information hors de cette base = INTERDITE
 */

export const JARVIS_KNOWLEDGE_BASE = {
  
  // 📋 DESCRIPTION GÉNÉRALE
  solution: {
    nom: "JARVIS",
    entreprise: "JARVIS-GROUP",
    tagline: "L'IA conversationnelle qui transforme vos salles de sport",
    description: "Miroirs digitaux affichant une IA à qui les adhérents parlent en temps réel (speech-to-speech). Toutes les interactions sont enregistrées et analysées par des agents IA pour produire rapports, métriques, analyses, suggestions et statistiques affichés sur un dashboard dédié pour les gérants.",
    secteur: "Fitness & Wellness Tech",
    type: "SaaS B2B + Revenue Share Publicitaire",
    mission_entreprise: "Aider les entreprises à migrer vers l'IA via solutions IA dédiées ou consulting"
  },

  // 🎯 FONCTIONNEMENT TECHNIQUE DÉTAILLÉ
  how_it_works: {
    user_journey: [
      "L'adhérent s'approche du miroir digital",
      "Il scanne son badge adhérent",
      "JARVIS récupère automatiquement tout le profil (historique conversations, âge, objectifs, poids, expérience, envies, habitudes, préférences)",
      "Conversation ultra personnalisée en speech-to-speech",
      "L'adhérent peut demander n'importe quoi : critiques, questions, demandes",
      "Toutes les interactions sont enregistrées et analysées"
    ],
    backend_processing: [
      "Agents IA analysent les sessions et interactions",
      "Génération de rapports automatiques",
      "Calcul de métriques et statistiques",
      "Détection de risques de churn",
      "Suggestions d'actions pour le gérant",
      "Tout affiché sur le dashboard gérant"
    ],
    exemple_use_case: {
      scenario: "Adhérent dit : 'La salle est pourrie en ce moment il n'y a plus aucune machine qui fonctionne'",
      response_jarvis: "JARVIS répond de la meilleure manière possible (empathie, prise de note)",
      post_traitement: "IA note que cet adhérent a un RISQUE DE CHURN ÉLEVÉ et suggère actions : réparer machines, contacter l'adhérent, proposer geste commercial"
    }
  },

  // 🏋️ RÔLE DE JARVIS (IMPORTANT)
  jarvis_role: {
    ce_que_jarvis_fait: [
      "Répondre aux questions basiques (horaires, équipements, tutos d'exercices)",
      "Afficher des vidéos explicatives d'exercices",
      "Écouter les critiques et retours des adhérents",
      "Détecter l'insatisfaction et les signaux de churn",
      "Guider les débutants sur les bases",
      "Être disponible 24/7 même hors présence du personnel",
      "Collecter automatiquement les avis et retours"
    ],
    ce_que_jarvis_ne_fait_pas: [
      "JARVIS N'EST PAS UN COACH - il ne remplace pas les coachs humains",
      "Si une demande devient trop avancée → JARVIS conseille d'aller voir un coach",
      "Pas de coaching avancé personnalisé (réservé aux humains)"
    ],
    philosophie: "Aider sur les bases, renvoyer vers l'humain pour l'expertise avancée"
  },

  // 🎯 PROBLÈMES RÉSOLUS (Documentés avec sources)
  problems_solved: [
    {
      problem: "Churn élevé",
      description: "Taux de désabonnement important dans le secteur fitness",
      solution_jarvis: "Détection précoce d'insatisfaction via analyse tonalité, mots-clés, fréquences d'usage",
      source: "Smart Health Clubs (documenté)"
    },
    {
      problem: "Manque d'engagement",
      description: "Adhérents viennent irrégulièrement",
      solution_jarvis: "Interactions naturelles speech-to-speech augmentent fréquence de visite",
      source: "itransition.com"
    },
    {
      problem: "Personnel débordé par FAQ",
      description: "Staff passe trop de temps sur questions répétitives",
      solution_jarvis: "Automatisation des FAQ et tâches récurrentes, staff se concentre sur accompagnement à forte valeur",
      source: "itransition.com"
    },
    {
      problem: "Anxiété sociale des nouveaux",
      description: "Nouveaux membres n'osent pas solliciter les coachs",
      solution_jarvis: "Pouvoir demander à JARVIS réduit la barrière d'entrée"
    },
    {
      problem: "Prise de décision non factuelle",
      description: "Gérants décident sans données",
      solution_jarvis: "Tableaux de bord actionnables avec tendances, heures de pointe, sujets récurrents",
      source: "McKinsey & Company"
    }
  ],

  // 📊 MÉTRIQUES CLÉS (Vérifiées)
  metrics: {
    churn_reduction: {
      value: "30%",
      description: "Réduction du taux de churn",
      verified: true
    },
    satisfaction_increase: {
      value: "40%",
      description: "Augmentation de la satisfaction client",
      verified: true
    },
    automation_rate: {
      value: "70%",
      description: "Pourcentage de questions automatisées",
      verified: true
    },
    early_detection: {
      value: "60 jours",
      description: "Anticipation du churn avant résiliation",
      verified: true
    },
    response_time: {
      value: "< 2 secondes",
      description: "Temps de réponse moyen de l'IA",
      verified: true
    }
  },

  // 📊 DASHBOARD GÉRANT (Détaillé selon PROJET.md)
  dashboard: {
    description: "Interface complète pour les gérants de salle",
    
    onboarding: {
      description: "Bloc visible uniquement lors de la première utilisation",
      missions: [
        "Appairer Jarvis au dashboard",
        "Créer une première mission vocale à Jarvis",
        "Consulter une fiche adhérent",
        "Appliquer une suggestion IA",
        "Consulter son classement réseau"
      ],
      validation: "100% = passage en mode normal"
    },
    
    vue_ensemble: {
      elements: [
        "Taux de satisfaction global (jauge)",
        "Liste des alertes critiques détectées automatiquement",
        "Taux de churn estimé par CrewAI",
        "Activité horaire de la salle (heatmap ou histogramme)",
        "Top 3 sujets les plus mentionnés (analyse des logs)",
        "Suggestion IA prioritaire (avec impact attendu)"
      ]
    },
    
    actions_du_jour: {
      description: "3 recommandations IA concrètes données par CrewAI",
      actions: "Chaque action peut être cochée comme effectuée ou ignorée",
      suivi: "Suivi de l'impact post-action (optionnel)"
    },
    
    fiches_adherents: {
      contenu: [
        "Profil : photo, prénom, statut (actif / à risque / critique)",
        "Timeline des interactions vocales",
        "Tags auto-générés (intentions, émotions, sujets abordés)",
        "Scores (fidélité, satisfaction, probabilité de churn)",
        "Recommandation IA spécifique à l'adhérent"
      ]
    },
    
    missions_jarvis: {
      description: "Système de missions vocales",
      informations: "Message, cible, style, durée, statut",
      statistiques: "Nombre de fois mentionné, cible atteinte"
    },
    
    objectifs_ia_hebdo: {
      description: "2-3 objectifs auto-générés par CrewAI chaque semaine",
      exemple: "Améliorer la satisfaction cardio de 10%",
      affichage: "Jauge de progression pour chaque objectif"
    },
    
    classement_reseau: {
      elements: [
        "Position actuelle de la salle dans le classement réseau",
        "Score global d'efficacité (engagement, IA, fidélisation…)",
        "Affichage de la moyenne réseau (anonyme)"
      ]
    },
    
    notifications_intelligentes: {
      description: "Événements détectés automatiquement (insights IA)",
      exemples: [
        "Hausse de mentions d'un thème",
        "Retour positif sur une mission",
        "Nouveau profil critique détecté"
      ]
    },
    
    journal_actions: {
      contenu: [
        "Historique chronologique des actions (humaines ou IA)",
        "Actions validées (avec impact si mesurable)",
        "Actions planifiées à venir"
      ]
    }
  },

  // 🏗️ FONCTIONNALITÉS CORE
  features: {
    core: [
      {
        name: "Miroirs digitaux interactifs",
        description: "Écrans miroirs installés dans la salle",
        interaction: "Speech-to-speech en temps réel"
      },
      {
        name: "Scan badge automatique",
        description: "Récupération automatique du profil adhérent complet"
      },
      {
        name: "Personnalisation ultra-poussée",
        description: "Conversation adaptée selon historique, âge, objectifs, poids, expérience, habitudes, préférences"
      },
      {
        name: "Vidéos d'exercices",
        description: "JARVIS affiche des vidéos explicatives pour les exercices"
      },
      {
        name: "Détection churn via CrewAI",
        description: "Agents IA analysent les conversations pour détecter risques"
      },
      {
        name: "Dashboard gérant complet",
        description: "Rapports, métriques, analyses, suggestions, probabilités, statistiques"
      }
    ]
  },

  // 💰 MODÈLE COMMERCIAL ET PRICING
  pricing: {
    model: "Installation + Abonnement mensuel",
    payment_structure: {
      one_time: "Installation des miroirs digitaux + Formation aux outils",
      recurring: "Abonnement mensuel avec limite d'utilisation",
      overage: "Si limite dépassée → Pay-to-use"
    },
    important: "SEUL PACK disponible sur DEVIS - Pas d'autres options",
    process: "Le client paie l'installation des équipements et la formation PUIS un abonnement mensuel",
    
    // Programme pilote (temporaire)
    pilot_program: {
      name: "Programme Pilote",
      price: "Gratuit",
      duration: "3 mois",
      spots_available: 5,
      conditions: [
        "Installation gratuite",
        "Support premium inclus",
        "Feedback requis pour amélioration produit"
      ]
    },
    
    // Modèle de revenus publicitaires (INNOVATION)
    revenue_share_model: {
      description: "JARVIS peut générer des revenus passifs pour la salle",
      fonctionnement: [
        "Proposer JARVIS à des marques pour exclusivité d'un contexte (ex: compléments alimentaires)",
        "JARVIS fait de la pub subtilement lors des conversations",
        "Publicité ultra contextualisée selon profil adhérent",
        "Collecte des retours et avis pour les marques"
      ],
      revenue_share: "Une partie des revenus pub reversée aux salles",
      exemple: "5 marques × 2000€/mois/salle = 10 000€/mois",
      impact: "La salle peut complètement amortir les coûts JARVIS et même générer du bénéfice",
      differentiateur: "JARVIS devient un produit qui GÉNÈRE de l'argent au lieu d'en coûter"
    }
  },

  // 🚀 PROCESSUS D'IMPLÉMENTATION
  implementation: {
    total_duration: "2-4 semaines",
    steps: [
      {
        step: 1,
        name: "Audit initial",
        duration: "2-3 jours",
        description: "Analyse de votre salle et besoins spécifiques"
      },
      {
        step: 2,
        name: "Installation matériel",
        duration: "3-5 jours",
        description: "Pose des miroirs digitaux et configuration réseau"
      },
      {
        step: 3,
        name: "Configuration IA",
        duration: "5-7 jours",
        description: "Personnalisation de l'IA selon votre marque et offres"
      },
      {
        step: 4,
        name: "Formation équipe",
        duration: "1-2 jours",
        description: "Formation de vos coachs au dashboard"
      },
      {
        step: 5,
        name: "Lancement & support",
        duration: "Continu",
        description: "Mise en production + support premium 24/7"
      }
    ]
  },

  // 🏆 14 BÉNÉFICES PRINCIPAUX (Documentés dans PROJET.md)
  benefits: {
    retention_engagement: {
      name: "Rétention & engagement membres",
      points: [
        "Réduction du churn par détection précoce d'insatisfaction (tonalité, mots-clés, fréquences)",
        "Engagement augmenté via interactions naturelles speech-to-speech",
        "Onboarding plus efficace : guidage vocal/visuel personnalisé",
        "Gamification & micro-missions : défis et feedbacks instantanés"
      ],
      source: "Smart Health Clubs, itransition.com"
    },
    
    experience_satisfaction: {
      name: "Expérience client & satisfaction",
      points: [
        "Service 24/7 : JARVIS répond instantanément même hors présence du personnel",
        "Réponse contextualisée et empathique adaptée au profil",
        "Guides d'exercices multimodaux (vidéo + audio + instructions)",
        "Réduction anxiété sociale : nouveaux peuvent demander à JARVIS au lieu d'oser solliciter un coach"
      ],
      source: "itransition.com, McKinsey & Company"
    },
    
    productivite_personnel: {
      name: "Valeur opérationnelle & productivité du personnel",
      points: [
        "Automatisation des FAQ et tâches récurrentes",
        "Signalement automatique d'incidents (équipements HS, propreté)",
        "Priorisation des interventions par criticité",
        "Formation continue & FAQs internes pour nouveaux employés"
      ],
      source: "itransition.com"
    },
    
    qualite_securite: {
      name: "Qualité & sécurité (santé des adhérents)",
      points: [
        "Conseils de sécurité immédiats (renvoie vers coach si trop avancé)",
        "Surveillance préventive : détection comportement à risque",
        "Support personnes fragiles / seniors : rappels, consignes adaptées",
        "Traçabilité des interactions pour assurance / responsabilité"
      ]
    },
    
    data_analytics: {
      name: "Data, analytics & prise de décision",
      points: [
        "Tableaux de bord actionnables : tendances, heures de pointe, sujets récurrents",
        "Mesure de l'impact des actions testées",
        "Segmentation avancée : recommandations pro-actives",
        "Optimisation des plannings & classes selon demande réelle"
      ],
      source: "McKinsey & Company"
    },
    
    marketing_monetisation: {
      name: "Marketing, monétisation non intrusive & partenariats",
      points: [
        "Ciblage publicitaire contextuel et pertinent",
        "Collecte d'avis produits / retours terrain pour partenaires",
        "Offres & upsell personnalisés automatiques",
        "Attractivité pour sponsors/partenaires (preuve d'engagement)"
      ]
    },
    
    ressources_humaines: {
      name: "Ressources humaines & culture interne",
      points: [
        "Désengorgement du personnel : moins de questions basiques",
        "Outil coaching hybride : JARVIS gère bases, coachs gèrent cas avancés",
        "Amélioration climat de travail : intervention proactive sur problèmes récurrents"
      ]
    },
    
    accessibilite_inclusion: {
      name: "Accessibilité, inclusion & image sociale",
      points: [
        "Interface vocale = accessibilité pour personnes à mobilité réduite, déficiences visuelles",
        "Multi-langues pour membres internationaux",
        "Adaptation seniors / débutants : langage et tempo adaptés",
        "Image responsable & inclusive : meilleure réputation locale"
      ],
      source: "PMC"
    },
    
    autres: [
      "Innovation produit & différenciation concurrentielle",
      "Fidélisation réseau & benchmarking entre salles",
      "Expérience physique augmentée (UX)",
      "Conformité, traçabilité & gestion du risque",
      "Effets socio-psychologiques & santé publique",
      "Gains immatériels & stratégiques"
    ]
  },
  
  // 📈 KPIs NON FINANCIERS
  kpis: [
    "% adhérents à risque détectés / actions entreprises",
    "Fréquence moyenne de visite / sessions par mois",
    "Taux d'utilisation des fonctionnalités Jarvis (sessions actives / jour)",
    "Délai moyen de résolution des incidents signalés via Jarvis",
    "Score CSAT post-interaction Jarvis",
    "% demandes résolues sans intervention humaine"
  ],

  // 🔧 SPÉCIFICATIONS TECHNIQUES
  technical_specs: {
    hardware: {
      mirror_size: "55 pouces (standard) ou 65 pouces (premium)",
      resolution: "4K UHD",
      touch: "Non, interaction 100% vocale",
      connectivity: "WiFi + Ethernet",
      power: "220V standard"
    },
    software: {
      ai_model: "GPT-4o Realtime (OpenAI)",
      languages: "Français (d'autres langues sur demande)",
      integrations: "API ouverte pour CRM existants",
      uptime: "99.9% SLA",
      data_security: "RGPD compliant, hébergement UE"
    }
  },

  // ❓ FAQ STRICTE
  faq: [
    {
      question: "Combien de temps pour installer JARVIS ?",
      answer: "2 à 4 semaines du premier contact au lancement complet."
    },
    {
      question: "Ça marche avec combien d'adhérents minimum ?",
      answer: "JARVIS est optimal pour les salles de 200+ adhérents, mais adaptable dès 100."
    },
    {
      question: "L'IA parle quelles langues ?",
      answer: "Français en natif. Anglais, espagnol disponibles sur demande."
    },
    {
      question: "Comment l'IA détecte le churn ?",
      answer: "Analyse comportementale : baisse de fréquence, ton négatif dans conversations, questions sur résiliation."
    },
    {
      question: "Mes données sont sécurisées ?",
      answer: "Oui, 100% RGPD compliant, hébergement en Union Européenne, encryption de bout en bout."
    }
  ],

  // 🔮 VISION FUTURE & AUTRES PRODUITS
  future: {
    jarvis_musees: {
      description: "Variante pour les musées (en projet, pas encore commencée)",
      objectif: "Améliorer l'immersivité dans les musées",
      features: [
        "Remplacer les longs pavés de texte explicatifs",
        "Conversations multilangues hyper engageantes",
        "Même technologie que JARVIS salles de sport mais adaptée"
      ],
      statut: "Pas encore démarré"
    },
    autres_secteurs: {
      description: "Plateforme évolutive (NLP, analytics, avatars)",
      potentiel: "S'étendent à d'autres usages : musées, retail, hôtels",
      source: "Mentionné dans PROJET.md"
    }
  },

  // 🚫 INFORMATIONS NON DISPONIBLES
  unavailable_info: [
    "Prix exact en euros (disponible uniquement sur devis personnalisé)",
    "Roadmap produit détaillée long terme (confidentiel)",
    "Détails algorithmes CrewAI propriétaires",
    "Liste complète des clients (confidentialité)",
    "Tarifs des marques pour publicité contextuelle",
    "État d'avancement JARVIS Musées (pas encore démarré)"
  ],

  // 📞 CONTACT
  contact: {
    email: "contact@jarvis-group.net",
    response_time: "< 24h",
    demo_available: true,
    pilot_program_open: true
  }

} as const;

/**
 * 🔍 FONCTION DE RECHERCHE DANS LA KB
 */
export function searchKnowledgeBase(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  // Recherche dans les FAQs
  for (const faq of JARVIS_KNOWLEDGE_BASE.faq) {
    if (lowerQuery.includes(faq.question.toLowerCase().slice(0, 20))) {
      return faq.answer;
    }
  }
  
  // Recherche dans les métriques
  if (lowerQuery.includes('churn')) {
    return `Réduction du churn de ${JARVIS_KNOWLEDGE_BASE.metrics.churn_reduction.value}`;
  }
  
  if (lowerQuery.includes('satisfaction')) {
    return `Augmentation de la satisfaction de ${JARVIS_KNOWLEDGE_BASE.metrics.satisfaction_increase.value}`;
  }
  
  return null;
}

/**
 * 📋 GÉNÉRER CONTEXTE POUR PROMPT
 */
export function getStrictContext(): string {
  return `
📚 KNOWLEDGE BASE COMPLÈTE - SEULES SOURCES AUTORISÉES

🎯 JARVIS-GROUP & SOLUTION
Entreprise : ${JARVIS_KNOWLEDGE_BASE.solution.entreprise}
Mission : ${JARVIS_KNOWLEDGE_BASE.solution.mission_entreprise}
Solution phare : ${JARVIS_KNOWLEDGE_BASE.solution.description}

🔧 COMMENT ÇA MARCHE (Parcours adhérent)
1. ${JARVIS_KNOWLEDGE_BASE.how_it_works.user_journey.join('\n')}

🤖 RÔLE DE JARVIS
FAIT : ${JARVIS_KNOWLEDGE_BASE.jarvis_role.ce_que_jarvis_fait.join(', ')}
NE FAIT PAS : ${JARVIS_KNOWLEDGE_BASE.jarvis_role.ce_que_jarvis_ne_fait_pas.join(' | ')}
Philosophie : ${JARVIS_KNOWLEDGE_BASE.jarvis_role.philosophie}

📊 MÉTRIQUES EXACTES (NE JAMAIS MODIFIER)
- Réduction churn : ${JARVIS_KNOWLEDGE_BASE.metrics.churn_reduction.value}
- Augmentation satisfaction : ${JARVIS_KNOWLEDGE_BASE.metrics.satisfaction_increase.value}
- Automatisation : ${JARVIS_KNOWLEDGE_BASE.metrics.automation_rate.value}
- Détection anticipée : ${JARVIS_KNOWLEDGE_BASE.metrics.early_detection.value}

💰 MODÈLE ÉCONOMIQUE
Structure : ${JARVIS_KNOWLEDGE_BASE.pricing.model}
Processus : ${JARVIS_KNOWLEDGE_BASE.pricing.process}
IMPORTANT : ${JARVIS_KNOWLEDGE_BASE.pricing.important}

💡 INNOVATION REVENUS PUBLICITAIRES
${JARVIS_KNOWLEDGE_BASE.pricing.revenue_share_model.description}
Exemple : ${JARVIS_KNOWLEDGE_BASE.pricing.revenue_share_model.exemple}
Impact : ${JARVIS_KNOWLEDGE_BASE.pricing.revenue_share_model.impact}

📊 DASHBOARD GÉRANT
Onboarding : ${JARVIS_KNOWLEDGE_BASE.dashboard.onboarding.missions.length} missions
Vue d'ensemble : ${JARVIS_KNOWLEDGE_BASE.dashboard.vue_ensemble.elements.join(', ')}
Missions vocales : ${JARVIS_KNOWLEDGE_BASE.dashboard.missions_jarvis.description}
Objectifs IA : ${JARVIS_KNOWLEDGE_BASE.dashboard.objectifs_ia_hebdo.description}

🏆 PRINCIPAUX BÉNÉFICES DOCUMENTÉS
${Object.values(JARVIS_KNOWLEDGE_BASE.benefits).map((b: any) => 
  b.name ? `- ${b.name}` : ''
).filter(Boolean).join('\n')}

⏱️ IMPLÉMENTATION
Durée : ${JARVIS_KNOWLEDGE_BASE.implementation.total_duration}

🚫 INFORMATIONS NON DISPONIBLES
${JARVIS_KNOWLEDGE_BASE.unavailable_info.join('\n- ')}

🎯 RÈGLE ABSOLUE
Si une information N'EST PAS dans cette knowledge base, tu DOIS dire EXACTEMENT :
"Je ne dispose pas de cette information précise. Contacte notre équipe à contact@jarvis-group.net pour en savoir plus."

JAMAIS inventer, JAMAIS estimer, JAMAIS approximer, JAMAIS dire "environ" ou "à peu près".
`;
}

