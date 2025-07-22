# 🤖 JARVIS SaaS - Architecture Complète

> **Vision** : Plateforme d'intelligence conversationnelle pour salles de sport avec gestion multi-tenant franchise → salle → kiosque.

## 🏗️ ARCHITECTURE GLOBALE

### 🎯 4 Niveaux d'Interface

```
1. 🔧 SUPER ADMIN (JARVIS HQ - Brice)
   ├── Gestion toutes franchises
   ├── Consommation API/coûts  
   ├── Monitoring technique global
   └── Configuration plateforme

2. 🏢 FRANCHISE DASHBOARD (Gérants Orange Bleue)
   ├── Vue consolidée toutes leurs salles
   ├── Insights cross-salles
   ├── Comparaisons performances
   └── Rapports franchise

3. 🏋️ GYM DASHBOARD (Gérant salle spécifique)
   ├── Analytics SA salle uniquement
   ├── Conversations JARVIS de sa salle
   ├── Gestion locale
   └── Rapports salle

4. 🤖 JARVIS KIOSK (Adhérents en salle)
   ├── Avatar JARVIS 2D/3D stylisé et animé
   ├── Interface vocale pure (OpenAI Realtime API)
   ├── Scan badge RFID + conversation
   └── Zéro navigation complexe - Full webapp
```

## 🗄️ MODÈLE DE DONNÉES

### 🏢 Franchise
```typescript
interface Franchise {
  id: string
  name: string                     // "Orange Bleue"
  brand_logo?: string             // Logo de la franchise
  
  // Contact & Business
  contact_email: string
  phone: string
  headquarters_address: string
  
  // Configuration JARVIS
  jarvis_config: {
    avatar_customization?: AvatarSettings
    brand_colors?: BrandColors
    welcome_message?: string
    features_enabled: string[]     // ['analytics', 'reports', 'ai_insights']
  }
  
  // Admin
  owner_id: string               // Gérant principal franchise
  status: 'active' | 'trial' | 'suspended'
  created_at: Date
}
```

### 🏋️ Gym (Salle équipée JARVIS)
```typescript
interface Gym {
  id: string
  franchise_id: string
  name: string                   // "Orange Bleue Paris 15ème"
  
  // Location
  address: string
  city: string
  postal_code: string
  
  // JARVIS Equipment & Kiosk Linking
  kiosk_config: {
    // Provisioning (Liaison Kiosk → Salle)
    provisioning_code: string       // "45B7K9" - Code unique 6-8 chiffres
    kiosk_url_slug: string         // "gym-45b7k9"
    installation_token: string     // JWT one-time
    provisioning_expires_at: Date  // Expiration du code (72h)
    
    // Status
    is_provisioned: boolean        // Kiosk activé ?
    provisioned_at?: Date
    last_heartbeat?: Date          // Dernière activité
    
    // Hardware
    rfid_reader_id?: string        // ID lecteur RFID
    screen_resolution?: string     // "1920x1080"
    browser_info?: BrowserInfo     // User agent, etc.
    
    // Configuration
    avatar_style: 'friendly' | 'professional' | 'energetic'
    welcome_message: string
    brand_colors: BrandColors
  }
  
  // Management
  manager_id?: string            // Gérant salle
  staff_ids: string[]           // Staff ayant accès
  
  // Business
  member_count?: number
  opening_hours: OpeningHours[]
  
  status: 'active' | 'maintenance' | 'offline'
  created_at: Date
}
```

### 🤖 JARVIS Sessions (Interactions adhérents)
```typescript
interface JarvisSession {
  id: string
  gym_id: string                 // ✅ Lien direct avec la salle
  
  // Member interaction
  member_badge_id?: string       // ID badge RFID scanné
  conversation_transcript: ConversationMessage[]
  
  // AI Analysis
  intent_detected: string[]      // ['question_hours', 'complaint', 'suggestion']
  sentiment_score: number        // -1 à 1
  satisfaction_rating?: number   // 1-5 si demandé
  
  // Technical
  session_duration: number       // En secondes
  kiosk_url_slug: string        // Confirmation du kiosk
  timestamp: Date
  processed_by_ai: boolean
}
```

### 👥 Users (Multi-rôles)
```typescript
interface User {
  id: string                     // UUID Supabase auth
  email: string
  full_name: string
  
  // Role & Access
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  
  // Scope (selon rôle)
  franchise_access?: string[]    // IDs franchises accessibles
  gym_access?: string[]         // IDs salles accessibles
  
  // Preferences
  dashboard_preferences?: UserPreferences
  notification_settings?: NotificationSettings
  
  is_active: boolean
  last_login?: Date
  created_at: Date
}
```

## 🔗 LIAISON KIOSK → SALLE

### 🎯 Stratégie "Provisioning Code" + URL Unique

#### 📋 1. Création Salle (Dashboard Admin)
```
[Super Admin crée salle] →

Système génère automatiquement:
├── 🔢 Code provisioning: "45B7K9"
├── 🌐 URL unique: jarvis.app/kiosk/gym-abc123def
├── 🔐 Token install: "jwt_secure_token_here"
└── ⏰ Expiration: 72h

Interface Admin affiche:
┌─────────────────────────────────────────┐
│ ✅ Salle "Orange Bleue Paris 15ème"    │
│     créée avec succès !                 │
│                                         │
│ 🖥️  INSTALLATION KIOSK:                 │
│                                         │
│ 📱 URL à configurer sur l'écran:       │
│     https://jarvis.app/kiosk/gym-45b7k9 │
│                                         │
│ 🔢 Code d'activation: 45B7K9           │
│     (Valide 72h)                        │
│                                         │
│ 📋 [Copier infos installation]         │
│ 📧 [Envoyer par email]                 │
└─────────────────────────────────────────┘
```

#### 🖥️ 2. Configuration Écran Physique
```
Technicien/Gérant va sur site avec:
├── URL: jarvis.app/kiosk/gym-45b7k9  
├── Code: 45B7K9
└── Lecteur RFID connecté

Steps:
1. Ouvre navigateur sur l'écran
2. Va sur l'URL fournie
3. Interface d'activation s'affiche
4. Saisit le code 45B7K9
5. Tests RFID automatiques
6. Kiosk activé et lié à la salle !
```

#### 🎭 3. Interface d'Activation Kiosk
```
┌─────────────────────────────────────────┐
│              🤖 JARVIS                  │
│                                         │
│        Configuration Kiosk             │
│                                         │
│    📍 Orange Bleue Paris 15ème         │
│                                         │
│    Entrez le code d'activation:         │
│    [_ _ _ _ _ _]                         │
│                                         │
│    🔌 Test lecteur RFID:               │
│    [🔍 Détection automatique...]       │
│                                         │
│    [Activer le Kiosk]                  │
└─────────────────────────────────────────┘
```

## 🎨 INTERFACES UTILISATEUR

### 1. 🔧 Super Admin Dashboard
```typescript
interface SuperAdminDashboard {
  // 📊 Vue Globale
  global_stats: {
    total_franchises: number
    total_gyms: number
    total_daily_conversations: number
    api_consumption: APIUsageMetrics
    monthly_revenue: number
  }
  
  // 🏢 Gestion Franchises
  franchise_management: {
    franchise_list: FranchiseCard[]
    pending_setups: PendingSetup[]
    support_tickets: SupportTicket[]
  }
  
  // 🛠️ Technique
  technical_monitoring: {
    kiosk_status: KioskStatus[]      // Tous les kiosques
    api_errors: APIError[]
    system_health: SystemMetrics
    ai_model_performance: AIMetrics
  }
}
```

**Navigation :**
```
Dashboard Super Admin
├── 🏢 Franchises
│   ├── [+ Nouvelle Franchise]
│   ├── Liste & recherche
│   └── Détails → Salles → Kiosques
├── 🔧 Technique
│   ├── Monitoring kiosques
│   ├── Logs API
│   └── Performance IA
└── 📊 Analytics Globales
    ├── Usage plateforme
    ├── Revenus
    └── Trends
```

### 2. 🏢 Franchise Dashboard (Orange Bleue)
```typescript
interface FranchiseDashboard {
  // 📈 Vue Consolidée
  franchise_overview: {
    total_gyms: number
    total_conversations_today: number
    average_satisfaction: number
    trending_topics: string[]
  }
  
  // 🏋️ Salles Performance
  gyms_performance: {
    gym_list: GymPerformanceCard[]
    best_performing: Gym
    needs_attention: Gym[]
    comparative_analytics: ComparisonMetrics
  }
  
  // 🧠 Insights Franchise
  franchise_insights: {
    cross_gym_patterns: Pattern[]
    member_migration: MemberFlow[]
    operational_recommendations: Recommendation[]
    satisfaction_trends: TrendData[]
  }
}
```

### 3. 🏋️ Gym Dashboard (Gérant salle)
```typescript
interface GymDashboard {
  // 📊 Ma Salle Uniquement
  gym_stats: {
    daily_conversations: number
    satisfaction_score: number
    peak_hours: TimeSlot[]
    member_sentiment: SentimentAnalysis
  }
  
  // 🗣️ Conversations Récentes
  recent_conversations: {
    conversation_list: ConversationSummary[]
    common_questions: QuestionFrequency[]
    complaints_urgent: Complaint[]
  }
  
  // 🎯 Actions Recommandées
  recommendations: {
    operational_actions: Action[]
    member_follow_ups: FollowUp[]
    facility_improvements: Improvement[]
  }
}
```

### 4. 🤖 JARVIS Kiosk (Interface adhérents)
```typescript
interface JarvisKiosk {
  // 🎭 Interface Vocale Pure
  avatar_interface: {
    jarvis_avatar: AnimatedAvatar    // Avatar 2D/3D stylisé et animé
    voice_input: VoiceCapture        // OpenAI Realtime API
    voice_output: TextToSpeech       // Réponses vocales
    visual_feedback: VisualCues      // Indications visuelles
  }
  
  // 🏷️ Identification
  badge_scanner: {
    badge_reader: RFIDScanner        // Lecteur RFID physique
    member_recognition: MemberLookup
    anonymous_mode: AnonymousAccess  // Si pas de badge
  }
  
  // 🤖 IA Conversationnelle
  ai_engine: {
    intent_recognition: IntentNLU
    response_generation: ResponseAI
    context_memory: SessionContext
    escalation_rules: EscalationLogic
  }
}
```

**Interface Kiosk Finale :**
```
URL: jarvis.app/kiosk/gym-45b7k9

┌─────────────────────────────────────────┐
│                                         │
│    🟠 [LOGO ORANGE BLEUE] 🤖            │
│                                         │
│           [JARVIS AVATAR]               │
│         Couleurs Orange Bleue           │
│                                         │
│    "Bonjour ! Bienvenue chez           │
│     Orange Bleue Paris 15ème !"        │
│                                         │
│    👋 Scannez votre badge ou            │
│       posez votre question              │
│                                         │
│    [🎤 Je vous écoute...]              │
│                                         │
│    🏋️ Horaires: 6h-22h (Lun-Ven)       │
│    📍 123 Rue de la Paix, Paris 15     │
└─────────────────────────────────────────┘
```

## 🔄 FLUX DE DONNÉES & INTERACTIONS

### 🤖 Kiosk → Dashboards
```
Adhérent scanne badge → JARVIS conversation
         ↓
Session enregistrée avec:
├── Transcript conversation
├── Intent détecté
├── Sentiment analysé  
├── Satisfaction (si demandée)
└── Métadonnées (heure, durée, etc.)
         ↓
📊 Données apparaissent en temps réel:
├── Dashboard Salle (sa salle)
├── Dashboard Franchise (consolidé)
└── Super Admin (global)
```

### ⚙️ Configuration Cascade
```
Super Admin crée franchise
         ↓
Franchise Owner peut:
├── Personnaliser avatar JARVIS
├── Configurer messages d'accueil
├── Ajouter ses salles
└── Inviter gérants salles
         ↓
Gym Manager peut:
├── Voir conversations SA salle
├── Configurer paramètres locaux
├── Gérer son équipe
└── Accéder analytics salle
```

## 🛠️ IMPLEMENTATION ROADMAP

### Phase 1 : Infrastructure (3-4 semaines) ✅ EN COURS
1. **Modèle données** complet multi-tenant
2. **Auth & permissions** granulaires  
3. **API endpoints** pour tous niveaux
4. **Super Admin** interface basique

### Phase 2 : Dashboards Business (4-5 semaines)
1. **Franchise Dashboard** avec multi-salles
2. **Gym Dashboard** avec analytics
3. **Real-time updates** entre interfaces
4. **Configuration** cascade

### Phase 3 : Kiosk Interface (3-4 semaines)
1. **Avatar JARVIS** interface 2D/3D
2. **Voice Input/Output** OpenAI Realtime API
3. **Badge scanning** RFID integration
4. **AI conversation** engine

### Phase 4 : Intelligence & Polish (4-6 semaines)
1. **Analytics avancées** cross-salles
2. **IA insights** et recommandations
3. **Monitoring technique** complet
4. **Optimisations performance**

## 🔐 SÉCURITÉ & ISOLATION

### ✅ Avantages Architecture
- **Isolation complète** : Chaque kiosk ne voit que SA salle
- **Codes temporaires** : Expiration automatique 72h
- **URLs uniques** : Pas de confusion possible
- **Token one-time** : Pas de réutilisation
- **Monitoring centralisé** : Status tous les kiosques
- **Personnalisation franchise** : Branding selon contrat

### 🛡️ Row Level Security (RLS)
```sql
-- Franchise Level Security
CREATE POLICY "franchise_owners_see_their_data" 
ON gyms FOR ALL 
USING (
  franchise_id IN (
    SELECT franchise_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('franchise_owner', 'franchise_admin')
  )
);

-- Gym Level Security  
CREATE POLICY "gym_managers_see_their_gym"
ON jarvis_sessions FOR ALL
USING (
  gym_id IN (
    SELECT gym_id
    FROM user_roles  
    WHERE user_id = auth.uid()
    AND role IN ('gym_manager', 'gym_staff')
  )
);
```

## 📋 PROCHAINES ÉTAPES

1. **✅ Maintenant** : Création de franchises (Super Admin)
2. Système multi-tenant avec RLS
3. Interface franchise dashboard
4. Gestion des salles
5. Interface kiosk basique
6. Intégration OpenAI Realtime
7. RFID integration
8. Analytics avancées

---

**Architecture validée** ✅  
**Documentation complète** ✅  
**Prêt pour développement** 🚀

*Développée par JARVIS Group - Architecture B2B SaaS Multi-Tenant* 