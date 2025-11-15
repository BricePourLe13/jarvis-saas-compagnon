/**
 * Custom Tools - Templates
 * Templates pré-configurés pour créer rapidement des tools courants
 */

import type { ToolTemplate } from '@/types/custom-tools'

/**
 * Templates disponibles
 */
export const TOOL_TEMPLATES: ToolTemplate[] = [
  // ============================================
  // BOOKING / RÉSERVATIONS
  // ============================================
  {
    id: 'reserve_class',
    name: 'reserve_class',
    display_name: 'Réserver un cours',
    description: 'Permet aux adhérents de réserver une place dans un cours collectif',
    category: 'booking',
    icon: '📅',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.votre-planning.fr/reservations',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{gym.api_key}}',
        'Content-Type': 'application/json'
      },
      body_template: {
        member_email: '{{member.email}}',
        class_name: '{{args.class_name}}',
        date: '{{args.date}}',
        time: '{{args.time}}'
      },
      response_mapping: {
        booking_id: '$.data.id',
        confirmation: '$.message'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'class_name',
        type: 'string',
        description: 'Nom du cours (ex: yoga, pilates, spinning)',
        required: true
      },
      {
        name: 'date',
        type: 'string',
        description: 'Date du cours (format YYYY-MM-DD)',
        required: true,
        pattern: '^\\d{4}-\\d{2}-\\d{2}$'
      },
      {
        name: 'time',
        type: 'string',
        description: 'Heure du cours (format HH:MM)',
        required: true,
        pattern: '^\\d{2}:\\d{2}$'
      }
    ],
    use_cases: [
      'Réserver cours collectifs',
      'Gérer planning gym',
      'Automatiser réservations'
    ]
  },
  
  // ============================================
  // INFO / HORAIRES
  // ============================================
  {
    id: 'get_gym_hours',
    name: 'get_gym_hours',
    display_name: 'Consulter horaires',
    description: 'Retourne les horaires d\'ouverture de la salle de sport',
    category: 'info',
    icon: '🕐',
    type: 'mcp_supabase',
    config: {
      query_template: 'SELECT opening_hours FROM gyms WHERE id = \'{{gym.id}}\'',
      max_rows: 1
    },
    parameters: [],
    use_cases: [
      'Informer adhérents',
      'Horaires spéciaux',
      'Fermetures exceptionnelles'
    ]
  },
  
  {
    id: 'get_class_schedule',
    name: 'get_class_schedule',
    display_name: 'Planning des cours',
    description: 'Affiche le planning des cours collectifs du jour',
    category: 'info',
    icon: '📋',
    type: 'mcp_supabase',
    config: {
      query_template: `
        SELECT 
          class_name, 
          start_time, 
          end_time, 
          instructor, 
          available_spots 
        FROM gym_classes 
        WHERE gym_id = '{{gym.id}}' 
        AND date = '{{args.date}}'
        ORDER BY start_time
      `,
      max_rows: 50
    },
    parameters: [
      {
        name: 'date',
        type: 'string',
        description: 'Date souhaitée (format YYYY-MM-DD). Par défaut aujourd\'hui.',
        required: false
      }
    ],
    use_cases: [
      'Consulter planning',
      'Choisir cours',
      'Voir disponibilités'
    ]
  },
  
  // ============================================
  // ACTION / COMMANDES
  // ============================================
  {
    id: 'order_shake',
    name: 'order_shake',
    display_name: 'Commander shake',
    description: 'Permet de commander un shake protéiné au bar de la salle',
    category: 'action',
    icon: '🥤',
    type: 'webhook',
    config: {
      url: 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/',
      method: 'POST',
      payload_template: {
        member_name: '{{member.first_name}} {{member.last_name}}',
        member_badge: '{{member.badge_id}}',
        shake_type: '{{args.shake_type}}',
        size: '{{args.size}}',
        gym_name: '{{gym.name}}',
        timestamp: '{{session.timestamp}}'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'shake_type',
        type: 'string',
        description: 'Type de shake',
        required: true,
        enum: ['whey', 'vegan', 'caseine', 'banane', 'chocolat', 'vanille']
      },
      {
        name: 'size',
        type: 'string',
        description: 'Taille',
        required: true,
        enum: ['petit', 'moyen', 'grand']
      }
    ],
    use_cases: [
      'Commander boissons',
      'Pré-paiement shake',
      'Service bar automatisé'
    ]
  },
  
  {
    id: 'activate_sauna',
    name: 'activate_sauna',
    display_name: 'Activer sauna privé',
    description: 'Démarre le sauna privé pour le membre (30 minutes)',
    category: 'action',
    icon: '🧖',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.domotique-gym.fr/sauna/activate',
      method: 'POST',
      headers: {
        'X-API-Key': '{{gym.api_key}}'
      },
      body_template: {
        member_id: '{{member.id}}',
        duration_minutes: 30,
        temperature: '{{args.temperature}}'
      },
      response_mapping: {
        status: '$.status',
        estimated_ready_time: '$.ready_in_minutes'
      },
      timeout_ms: 5000
    },
    parameters: [
      {
        name: 'temperature',
        type: 'number',
        description: 'Température souhaitée (en °C)',
        required: false,
        min: 60,
        max: 90,
        default: 75
      }
    ],
    use_cases: [
      'Spas intégrés',
      'Salles premium',
      'Services automatisés'
    ]
  },
  
  // ============================================
  // ANALYTICS / STATS
  // ============================================
  {
    id: 'get_member_stats',
    name: 'get_member_stats',
    display_name: 'Mes statistiques',
    description: 'Affiche les statistiques d\'entraînement du membre (présences, progression)',
    category: 'analytics',
    icon: '📊',
    type: 'mcp_supabase',
    config: {
      query_template: `
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT DATE(visit_date)) as unique_days,
          MAX(visit_date) as last_visit
        FROM member_visits 
        WHERE member_id = '{{member.id}}'
        AND visit_date >= NOW() - INTERVAL '{{args.period}} days'
      `,
      max_rows: 1
    },
    parameters: [
      {
        name: 'period',
        type: 'number',
        description: 'Période en jours (7, 30, 90, 365)',
        required: false,
        enum: ['7', '30', '90', '365'],
        default: 30
      }
    ],
    use_cases: [
      'Suivi progression',
      'Motivation adhérent',
      'Objectifs personnels'
    ]
  },
  
  // ============================================
  // COMMUNICATION
  // ============================================
  {
    id: 'send_feedback',
    name: 'send_feedback',
    display_name: 'Envoyer feedback',
    description: 'Permet au membre d\'envoyer un feedback ou une réclamation',
    category: 'communication',
    icon: '💬',
    type: 'webhook',
    config: {
      url: 'https://api.votre-crm.fr/feedback',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{gym.api_key}}'
      },
      payload_template: {
        member_id: '{{member.id}}',
        member_email: '{{member.email}}',
        gym_id: '{{gym.id}}',
        feedback_type: '{{args.type}}',
        message: '{{args.message}}',
        rating: '{{args.rating}}',
        timestamp: '{{session.timestamp}}'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: 'Type de feedback',
        required: true,
        enum: ['suggestion', 'reclamation', 'felicitation', 'question']
      },
      {
        name: 'message',
        type: 'string',
        description: 'Message du membre',
        required: true
      },
      {
        name: 'rating',
        type: 'number',
        description: 'Note sur 5',
        required: false,
        min: 1,
        max: 5
      }
    ],
    use_cases: [
      'Satisfaction client',
      'Amélioration continue',
      'Support adhérent'
    ]
  },
  
  // ============================================
  // E-COMMERCE
  // ============================================
  {
    id: 'order_supplement',
    name: 'order_supplement',
    display_name: 'Commander complément',
    description: 'Commander un complément alimentaire via boutique en ligne',
    category: 'action',
    icon: '💊',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.shopify.com/YOUR_STORE/orders',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': '{{gym.api_key}}',
        'Content-Type': 'application/json'
      },
      body_template: {
        customer: {
          email: '{{member.email}}',
          first_name: '{{member.first_name}}',
          last_name: '{{member.last_name}}'
        },
        line_items: [
          {
            product_id: '{{args.product_id}}',
            quantity: '{{args.quantity}}'
          }
        ],
        note: 'Commande via JARVIS'
      },
      response_mapping: {
        order_id: '$.order.id',
        total: '$.order.total_price'
      },
      timeout_ms: 15000
    },
    parameters: [
      {
        name: 'product_id',
        type: 'string',
        description: 'ID du produit Shopify',
        required: true
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Quantité',
        required: true,
        min: 1,
        max: 10,
        default: 1
      }
    ],
    use_cases: [
      'Boutique en ligne',
      'Compléments alimentaires',
      'Merchandising'
    ]
  }
]

/**
 * Récupère un template par ID
 */
export function getTemplateById(id: string): ToolTemplate | undefined {
  return TOOL_TEMPLATES.find(t => t.id === id)
}

/**
 * Récupère templates par catégorie
 */
export function getTemplatesByCategory(category: string): ToolTemplate[] {
  return TOOL_TEMPLATES.filter(t => t.category === category)
}

/**
 * Récupère toutes les catégories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(TOOL_TEMPLATES.map(t => t.category)))
}

/**
 * Applique un template à un custom tool
 */
export function applyTemplate(
  template: ToolTemplate,
  gymId: string,
  customization?: {
    name?: string
    display_name?: string
    description?: string
  }
) {
  return {
    gym_id: gymId,
    name: customization?.name || template.name,
    display_name: customization?.display_name || template.display_name,
    description: customization?.description || template.description,
    category: template.category,
    icon: template.icon,
    type: template.type,
    status: 'draft' as const,
    config: template.config,
    parameters: template.parameters,
    auth_type: 'none' as const,
    auth_config: { type: 'none' as const },
    rate_limit_per_member_per_day: 10,
    rate_limit_per_gym_per_hour: 100,
    test_cases: []
  }
}



 * Custom Tools - Templates
 * Templates pré-configurés pour créer rapidement des tools courants
 */

import type { ToolTemplate } from '@/types/custom-tools'

/**
 * Templates disponibles
 */
export const TOOL_TEMPLATES: ToolTemplate[] = [
  // ============================================
  // BOOKING / RÉSERVATIONS
  // ============================================
  {
    id: 'reserve_class',
    name: 'reserve_class',
    display_name: 'Réserver un cours',
    description: 'Permet aux adhérents de réserver une place dans un cours collectif',
    category: 'booking',
    icon: '📅',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.votre-planning.fr/reservations',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{gym.api_key}}',
        'Content-Type': 'application/json'
      },
      body_template: {
        member_email: '{{member.email}}',
        class_name: '{{args.class_name}}',
        date: '{{args.date}}',
        time: '{{args.time}}'
      },
      response_mapping: {
        booking_id: '$.data.id',
        confirmation: '$.message'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'class_name',
        type: 'string',
        description: 'Nom du cours (ex: yoga, pilates, spinning)',
        required: true
      },
      {
        name: 'date',
        type: 'string',
        description: 'Date du cours (format YYYY-MM-DD)',
        required: true,
        pattern: '^\\d{4}-\\d{2}-\\d{2}$'
      },
      {
        name: 'time',
        type: 'string',
        description: 'Heure du cours (format HH:MM)',
        required: true,
        pattern: '^\\d{2}:\\d{2}$'
      }
    ],
    use_cases: [
      'Réserver cours collectifs',
      'Gérer planning gym',
      'Automatiser réservations'
    ]
  },
  
  // ============================================
  // INFO / HORAIRES
  // ============================================
  {
    id: 'get_gym_hours',
    name: 'get_gym_hours',
    display_name: 'Consulter horaires',
    description: 'Retourne les horaires d\'ouverture de la salle de sport',
    category: 'info',
    icon: '🕐',
    type: 'mcp_supabase',
    config: {
      query_template: 'SELECT opening_hours FROM gyms WHERE id = \'{{gym.id}}\'',
      max_rows: 1
    },
    parameters: [],
    use_cases: [
      'Informer adhérents',
      'Horaires spéciaux',
      'Fermetures exceptionnelles'
    ]
  },
  
  {
    id: 'get_class_schedule',
    name: 'get_class_schedule',
    display_name: 'Planning des cours',
    description: 'Affiche le planning des cours collectifs du jour',
    category: 'info',
    icon: '📋',
    type: 'mcp_supabase',
    config: {
      query_template: `
        SELECT 
          class_name, 
          start_time, 
          end_time, 
          instructor, 
          available_spots 
        FROM gym_classes 
        WHERE gym_id = '{{gym.id}}' 
        AND date = '{{args.date}}'
        ORDER BY start_time
      `,
      max_rows: 50
    },
    parameters: [
      {
        name: 'date',
        type: 'string',
        description: 'Date souhaitée (format YYYY-MM-DD). Par défaut aujourd\'hui.',
        required: false
      }
    ],
    use_cases: [
      'Consulter planning',
      'Choisir cours',
      'Voir disponibilités'
    ]
  },
  
  // ============================================
  // ACTION / COMMANDES
  // ============================================
  {
    id: 'order_shake',
    name: 'order_shake',
    display_name: 'Commander shake',
    description: 'Permet de commander un shake protéiné au bar de la salle',
    category: 'action',
    icon: '🥤',
    type: 'webhook',
    config: {
      url: 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/',
      method: 'POST',
      payload_template: {
        member_name: '{{member.first_name}} {{member.last_name}}',
        member_badge: '{{member.badge_id}}',
        shake_type: '{{args.shake_type}}',
        size: '{{args.size}}',
        gym_name: '{{gym.name}}',
        timestamp: '{{session.timestamp}}'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'shake_type',
        type: 'string',
        description: 'Type de shake',
        required: true,
        enum: ['whey', 'vegan', 'caseine', 'banane', 'chocolat', 'vanille']
      },
      {
        name: 'size',
        type: 'string',
        description: 'Taille',
        required: true,
        enum: ['petit', 'moyen', 'grand']
      }
    ],
    use_cases: [
      'Commander boissons',
      'Pré-paiement shake',
      'Service bar automatisé'
    ]
  },
  
  {
    id: 'activate_sauna',
    name: 'activate_sauna',
    display_name: 'Activer sauna privé',
    description: 'Démarre le sauna privé pour le membre (30 minutes)',
    category: 'action',
    icon: '🧖',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.domotique-gym.fr/sauna/activate',
      method: 'POST',
      headers: {
        'X-API-Key': '{{gym.api_key}}'
      },
      body_template: {
        member_id: '{{member.id}}',
        duration_minutes: 30,
        temperature: '{{args.temperature}}'
      },
      response_mapping: {
        status: '$.status',
        estimated_ready_time: '$.ready_in_minutes'
      },
      timeout_ms: 5000
    },
    parameters: [
      {
        name: 'temperature',
        type: 'number',
        description: 'Température souhaitée (en °C)',
        required: false,
        min: 60,
        max: 90,
        default: 75
      }
    ],
    use_cases: [
      'Spas intégrés',
      'Salles premium',
      'Services automatisés'
    ]
  },
  
  // ============================================
  // ANALYTICS / STATS
  // ============================================
  {
    id: 'get_member_stats',
    name: 'get_member_stats',
    display_name: 'Mes statistiques',
    description: 'Affiche les statistiques d\'entraînement du membre (présences, progression)',
    category: 'analytics',
    icon: '📊',
    type: 'mcp_supabase',
    config: {
      query_template: `
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT DATE(visit_date)) as unique_days,
          MAX(visit_date) as last_visit
        FROM member_visits 
        WHERE member_id = '{{member.id}}'
        AND visit_date >= NOW() - INTERVAL '{{args.period}} days'
      `,
      max_rows: 1
    },
    parameters: [
      {
        name: 'period',
        type: 'number',
        description: 'Période en jours (7, 30, 90, 365)',
        required: false,
        enum: ['7', '30', '90', '365'],
        default: 30
      }
    ],
    use_cases: [
      'Suivi progression',
      'Motivation adhérent',
      'Objectifs personnels'
    ]
  },
  
  // ============================================
  // COMMUNICATION
  // ============================================
  {
    id: 'send_feedback',
    name: 'send_feedback',
    display_name: 'Envoyer feedback',
    description: 'Permet au membre d\'envoyer un feedback ou une réclamation',
    category: 'communication',
    icon: '💬',
    type: 'webhook',
    config: {
      url: 'https://api.votre-crm.fr/feedback',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{gym.api_key}}'
      },
      payload_template: {
        member_id: '{{member.id}}',
        member_email: '{{member.email}}',
        gym_id: '{{gym.id}}',
        feedback_type: '{{args.type}}',
        message: '{{args.message}}',
        rating: '{{args.rating}}',
        timestamp: '{{session.timestamp}}'
      },
      timeout_ms: 10000
    },
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: 'Type de feedback',
        required: true,
        enum: ['suggestion', 'reclamation', 'felicitation', 'question']
      },
      {
        name: 'message',
        type: 'string',
        description: 'Message du membre',
        required: true
      },
      {
        name: 'rating',
        type: 'number',
        description: 'Note sur 5',
        required: false,
        min: 1,
        max: 5
      }
    ],
    use_cases: [
      'Satisfaction client',
      'Amélioration continue',
      'Support adhérent'
    ]
  },
  
  // ============================================
  // E-COMMERCE
  // ============================================
  {
    id: 'order_supplement',
    name: 'order_supplement',
    display_name: 'Commander complément',
    description: 'Commander un complément alimentaire via boutique en ligne',
    category: 'action',
    icon: '💊',
    type: 'api_rest',
    config: {
      endpoint: 'https://api.shopify.com/YOUR_STORE/orders',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': '{{gym.api_key}}',
        'Content-Type': 'application/json'
      },
      body_template: {
        customer: {
          email: '{{member.email}}',
          first_name: '{{member.first_name}}',
          last_name: '{{member.last_name}}'
        },
        line_items: [
          {
            product_id: '{{args.product_id}}',
            quantity: '{{args.quantity}}'
          }
        ],
        note: 'Commande via JARVIS'
      },
      response_mapping: {
        order_id: '$.order.id',
        total: '$.order.total_price'
      },
      timeout_ms: 15000
    },
    parameters: [
      {
        name: 'product_id',
        type: 'string',
        description: 'ID du produit Shopify',
        required: true
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Quantité',
        required: true,
        min: 1,
        max: 10,
        default: 1
      }
    ],
    use_cases: [
      'Boutique en ligne',
      'Compléments alimentaires',
      'Merchandising'
    ]
  }
]

/**
 * Récupère un template par ID
 */
export function getTemplateById(id: string): ToolTemplate | undefined {
  return TOOL_TEMPLATES.find(t => t.id === id)
}

/**
 * Récupère templates par catégorie
 */
export function getTemplatesByCategory(category: string): ToolTemplate[] {
  return TOOL_TEMPLATES.filter(t => t.category === category)
}

/**
 * Récupère toutes les catégories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(TOOL_TEMPLATES.map(t => t.category)))
}

/**
 * Applique un template à un custom tool
 */
export function applyTemplate(
  template: ToolTemplate,
  gymId: string,
  customization?: {
    name?: string
    display_name?: string
    description?: string
  }
) {
  return {
    gym_id: gymId,
    name: customization?.name || template.name,
    display_name: customization?.display_name || template.display_name,
    description: customization?.description || template.description,
    category: template.category,
    icon: template.icon,
    type: template.type,
    status: 'draft' as const,
    config: template.config,
    parameters: template.parameters,
    auth_type: 'none' as const,
    auth_config: { type: 'none' as const },
    rate_limit_per_member_per_day: 10,
    rate_limit_per_gym_per_hour: 100,
    test_cases: []
  }
}



