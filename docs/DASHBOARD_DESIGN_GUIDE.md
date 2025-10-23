# 🎨 GUIDE DESIGN DASHBOARD - Niveau Entreprise

**Date** : 23 octobre 2025  
**Objectif** : Dashboard qui justifie 1200€/mois  
**Inspirations** : Vercel, Linear, Sentry, Retool, Stripe

---

## 🎯 PRINCIPES CLÉS (Meilleurs dashboards SaaS 2025)

### 1. **Hierarchy of Information** (comme Vercel)
```
Le plus important en haut, le plus visible
↓
Actions fréquentes accessibles en 1 clic
↓
Données détaillées en scroll
```

### 2. **Progressive Disclosure** (comme Linear)
```
Vue d'ensemble simple
↓ clic
Détails riches
↓ clic
Actions avancées
```

### 3. **Real-time Feel** (comme Sentry)
```
Données live (WebSocket)
Notifications push
Animations subtiles (loading states)
```

### 4. **Actionable Insights** (comme Retool)
```
Pas juste des chiffres
↓
Insight contextuel ("5 membres à risque")
↓
Action recommandée ("Contacter dans 48h")
↓
Bouton action direct ("Créer mission")
```

### 5. **Consistent Design System** (comme Stripe)
```
Palette réduite (3-4 couleurs max)
Spacing cohérent (8px grid)
Typographie claire (max 3 font sizes)
Composants réutilisables partout
```

---

## 🎨 PALETTE COULEURS (adaptée JARVIS)

### Couleurs primaires
```css
--primary: #2563eb;        /* Bleu JARVIS (tech, confiance) */
--primary-hover: #1d4ed8;
--primary-light: #dbeafe;

--secondary: #0f172a;      /* Slate foncé (pro, sérieux) */
--secondary-light: #f1f5f9;
```

### Couleurs sémantiques
```css
--success: #10b981;        /* Vert (metrics positives) */
--warning: #f59e0b;        /* Orange (alertes medium) */
--error: #ef4444;          /* Rouge (alertes critiques) */
--info: #06b6d4;           /* Cyan (info contextuelle) */
```

### Churn risk (spécifique gym)
```css
--churn-low: #10b981;      /* Vert */
--churn-medium: #f59e0b;   /* Orange */
--churn-high: #ef4444;     /* Rouge */
--churn-critical: #dc2626; /* Rouge foncé */
```

### Neutrals
```css
--gray-50: #f9fafb;        /* Background cards */
--gray-100: #f3f4f6;       /* Background hover */
--gray-200: #e5e7eb;       /* Borders */
--gray-400: #9ca3af;       /* Text secondary */
--gray-600: #4b5563;       /* Text primary */
--gray-900: #111827;       /* Headings */
```

---

## 🏗️ LAYOUT STRUCTURE

### Niveau 1 : Shell (constant)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] JARVIS        PowerGym Lyon ▼     [🔔] [⚙️] [👤 Brice]   │ ← 64px height
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌────────────────────────────────────────────┐  │
│  │          │  │                                            │  │
│  │          │  │                                            │  │
│  │ Sidebar  │  │        Main Content Area                   │  │
│  │ 240px    │  │        (fluid width)                       │  │
│  │          │  │                                            │  │
│  │          │  │                                            │  │
│  └──────────┘  └────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Header** (sticky top) :
- Logo + nom produit
- Sélecteur salle (dropdown)
- Notifications (badge count)
- Settings
- User menu

**Sidebar** (collapsible) :
- Navigation principale
- Icônes + labels
- Active state visible
- Groupes sections (si multi-rôles)

**Main Content** :
- Padding: 32px
- Max-width: 1400px (lisibilité)
- Grid 12 colonnes (responsive)

---

## 📊 DASHBOARD SALLE - VUE PRINCIPALE

### Layout détaillé

```
┌─────────────────────────────────────────────────────────────────┐
│ Header Section                                   [Actions Bar]   │ ← 80px
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │
│ │        │ │        │ │        │ │        │                    │
│ │ Metric │ │ Metric │ │ Metric │ │ Metric │  ← 4 cards         │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │    120px height    │
│ │        │ │        │ │        │ │        │                    │
│ └────────┘ └────────┘ └────────┘ └────────┘                    │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚨 Alertes Prioritaires (3 max)                             │ │
│ │                                                              │ │
│ │ [Alerte 1 - Urgent]                                        │ │
│ │ [Alerte 2 - Warning]                                       │ │
│ │ [Alerte 3 - Info]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌───────────────────────┐ ┌─────────────────────────────────┐  │
│ │                       │ │                                 │  │
│ │ Graphique Sessions    │ │  Quick Actions                  │  │
│ │ (7 derniers jours)    │ │                                 │  │
│ │                       │ │  [+ Inviter staff]              │  │
│ │                       │ │  [📊 Générer rapport]           │  │
│ │                       │ │  [🎯 Créer mission]             │  │
│ │                       │ │  [⚙️ Config JARVIS]              │  │
│ └───────────────────────┘ └─────────────────────────────────┘  │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Activité Récente (feed)                                     │ │
│ │                                                              │ │
│ │ • Marie D. a terminé une session (il y a 5min)             │ │
│ │ • Alerte créée: Churn risk détecté (il y a 12min)         │ │
│ │ • Paul M. a scanné son badge (il y a 18min)               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎴 COMPOSANTS DÉTAILLÉS

### 1. Metric Card (inspiré Vercel)

```tsx
<MetricCard>
  <div className="metric-header">
    <Icon /> <!-- 20px -->
    <Badge status="success/warning/error" /> <!-- optionnel -->
  </div>
  
  <div className="metric-value">
    245 <!-- 36px font, bold -->
  </div>
  
  <div className="metric-label">
    Membres actifs <!-- 14px, gray-600 -->
  </div>
  
  <div className="metric-trend">
    <TrendIcon /> <!-- arrow up/down -->
    <span>+5% vs mois dernier</span> <!-- 12px, success/error color -->
  </div>
</MetricCard>
```

**Styles** :
```css
.metric-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}
```

**States** :
- Hover : légère élévation + border colorée
- Loading : skeleton (shimmer effect)
- Error : border rouge + message

---

### 2. Alert Card (inspiré Sentry)

```tsx
<AlertCard priority="urgent" | "warning" | "info">
  <div className="alert-header">
    <Icon priority={priority} /> <!-- 24px -->
    <Badge>Urgent</Badge>
    <Time>Il y a 2h</Time>
  </div>
  
  <div className="alert-content">
    <h3>5 membres à risque de churn élevé</h3>
    <p>Détection automatique basée sur fréquentation</p>
  </div>
  
  <div className="alert-action">
    <Button variant="primary">Voir détails</Button>
    <Button variant="ghost">Créer mission</Button>
  </div>
</AlertCard>
```

**Couleurs selon priorité** :
```css
.alert-urgent {
  border-left: 4px solid var(--error);
  background: linear-gradient(90deg, 
    rgba(239, 68, 68, 0.05) 0%, 
    transparent 100%
  );
}

.alert-warning {
  border-left: 4px solid var(--warning);
  background: linear-gradient(90deg, 
    rgba(245, 158, 11, 0.05) 0%, 
    transparent 100%
  );
}
```

---

### 3. Member Card (liste adhérents)

```tsx
<MemberCard>
  <Avatar src={member.photo} fallback={initials} />
  
  <div className="member-info">
    <h4>Marie Dubois</h4>
    <p>Membre depuis 2 ans • Objectif: Perte de poids</p>
  </div>
  
  <div className="member-metrics">
    <Metric label="Visites" value="24/mois" />
    <Metric label="Dernière" value="Il y a 2j" />
  </div>
  
  <div className="member-status">
    <ChurnBadge risk="low" />
    <SatisfactionScore score={4.5} />
  </div>
  
  <Button>Voir profil</Button>
</MemberCard>
```

**Churn Badge** (très important pour votre use case) :
```tsx
<ChurnBadge risk="high">
  🔴 Risque élevé (87%)
</ChurnBadge>

<!-- Couleurs -->
low: green background, dark green text
medium: orange background, dark orange text
high: red background, white text
critical: dark red background, white text + pulse animation
```

---

### 4. Graph Card (recharts)

```tsx
<GraphCard>
  <div className="graph-header">
    <h3>Sessions JARVIS</h3>
    <Select options={['7j', '30j', '90j']} /> <!-- période -->
  </div>
  
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={sessionsData}>
      <Line 
        type="monotone" 
        dataKey="sessions" 
        stroke="var(--primary)"
        strokeWidth={2}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
    </LineChart>
  </ResponsiveContainer>
  
  <div className="graph-footer">
    <Stat label="Moyenne" value="42/jour" />
    <Stat label="Pic" value="68 (Lundi)" />
  </div>
</GraphCard>
```

**Style** : Graph doit respirer (padding généreux)

---

### 5. Quick Actions (important pour "proactivité")

```tsx
<QuickActionsPanel>
  <h3>Actions rapides</h3>
  
  <ActionButton icon={<UserPlus />} onClick={handleInvite}>
    Inviter un staff
  </ActionButton>
  
  <ActionButton icon={<FileText />} onClick={generateReport}>
    Générer rapport hebdo
  </ActionButton>
  
  <ActionButton icon={<Target />} onClick={createMission}>
    Créer une mission
  </ActionButton>
  
  <ActionButton icon={<Settings />} onClick={openSettings}>
    Configurer JARVIS
  </ActionButton>
</QuickActionsPanel>
```

**Style** : Boutons larges, icônes 20px, hover avec légère élévation

---

## 🎭 ANIMATIONS & MICRO-INTERACTIONS

### Principes (inspiré Linear)

1. **Subtil mais perceptible** : 150-250ms transitions
2. **Purpose-driven** : Chaque animation communique un état
3. **Pas de distraction** : Jamais d'animations inutiles

### Exemples

**Loading states** :
```tsx
// Skeleton shimmer (comme Linear)
<div className="skeleton">
  <div className="shimmer" />
</div>

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Success feedback** :
```tsx
// Checkmark animation (comme Stripe)
<CheckCircle className="success-icon animate-in" />

@keyframes animate-in {
  0% { 
    opacity: 0; 
    transform: scale(0.5); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1); 
  }
}
```

**Hover states** :
```css
/* Elevation subtile */
.card {
  transition: 
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

**Real-time updates** :
```tsx
// Nouvelle alerte apparaît
<Alert className="slide-in-top" />

@keyframes slide-in-top {
  0% { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### Layout adaptatif

**Desktop (>1024px)** :
```
Sidebar visible (240px)
4 metrics cards (grid 4 colonnes)
2 colonnes graphiques
```

**Tablet (768-1024px)** :
```
Sidebar collapsible
2 metrics cards (grid 2 colonnes)
1 colonne graphiques
```

**Mobile (<768px)** :
```
Sidebar → hamburger menu
1 metric card (stack vertical)
Graphiques full-width
Actions → bottom sheet
```

---

## 🎨 TYPOGRAPHIE

### Font Stack (comme Vercel)
```css
--font-sans: 
  'Inter', 
  -apple-system, 
  BlinkMacSystemFont, 
  'Segoe UI', 
  sans-serif;

--font-mono: 
  'JetBrains Mono', 
  'Fira Code', 
  monospace;
```

### Échelle
```css
--text-xs: 12px;   /* Timestamps, badges */
--text-sm: 14px;   /* Body text, labels */
--text-base: 16px; /* Default */
--text-lg: 18px;   /* Section titles */
--text-xl: 20px;   /* Card titles */
--text-2xl: 24px;  /* Page titles */
--text-3xl: 30px;  /* Hero metrics */
--text-4xl: 36px;  /* Big numbers */
```

### Weights
```css
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Labels, nav */
--font-semibold: 600; /* Headings, buttons */
--font-bold: 700;     /* Emphasis, metrics */
```

---

## 🔔 NOTIFICATIONS & FEEDBACK

### Toast notifications (comme Vercel)

```tsx
<Toast variant="success">
  <CheckCircle />
  <div>
    <strong>Mission créée</strong>
    <p>Marie D. sera contactée dans 48h</p>
  </div>
  <CloseButton />
</Toast>
```

**Positions** :
- Desktop : Top-right, stack vertical
- Mobile : Bottom, full-width

**Auto-dismiss** : 5s (success/info), 10s (warning), manual (error)

### Loading states

**Button loading** :
```tsx
<Button loading>
  <Spinner />
  Envoi en cours...
</Button>
```

**Page loading** :
```tsx
<PageLoader>
  <Spinner size="large" />
  <p>Chargement des données...</p>
</PageLoader>
```

### Empty states (important)

```tsx
<EmptyState>
  <Icon name="inbox" size={48} color="gray" />
  <h3>Aucune alerte pour le moment</h3>
  <p>Vous serez notifié dès qu'une alerte sera créée</p>
  <Button>Configurer les alertes</Button>
</EmptyState>
```

---

## 🎯 PAGES SECONDAIRES (cohérence)

### Page Members

```
Header : Titre + filtres + search + actions
┌─────────────────────────────────────────────┐
│ Membres (245)   [Filtres ▼] [🔍]  [+ Ajouter]│
├─────────────────────────────────────────────┤
│                                             │
│ [Tous] [Churn élevé] [Inactifs] [Nouveaux] │ ← Tabs
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ [Member Card]                           ││
│ ├─────────────────────────────────────────┤│
│ │ [Member Card]                           ││
│ ├─────────────────────────────────────────┤│
│ │ [Member Card]                           ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [Pagination: 1 2 3 ... 25]                 │
└─────────────────────────────────────────────┘
```

### Page Sessions

```
Header + Filtres (date, sentiment, membre)
┌─────────────────────────────────────────────┐
│ Sessions JARVIS   [Date ▼] [Sentiment ▼]    │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Session Card (expanded)                 ││
│ │                                         ││
│ │ Marie D. • Il y a 5min • 3min 24s      ││
│ │ Sentiment: 😊 Positif (85%)            ││
│ │                                         ││
│ │ Transcript:                             ││
│ │ [User] "Je veux perdre du poids"       ││
│ │ [JARVIS] "Super objectif Marie..."     ││
│ │                                         ││
│ │ Actions: [Voir détails] [Exporter]     ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [Load more]                                 │
└─────────────────────────────────────────────┘
```

---

## 🏆 EXEMPLES DE RÉFÉRENCE (à étudier)

### 1. **Vercel Dashboard**
- URL : vercel.com/dashboard
- **Ce qu'on copie** : Layout propre, metrics cards, animations subtiles
- **Pourquoi** : Standard industrie pour dashboards dev

### 2. **Linear**
- URL : linear.app
- **Ce qu'on copie** : Vitesse, keyboard shortcuts, progressive disclosure
- **Pourquoi** : UX la plus fluide du marché

### 3. **Sentry**
- URL : sentry.io
- **Ce qu'on copie** : Alertes prioritaires, real-time feed, graphiques
- **Pourquoi** : Excellent pour monitoring/alerts

### 4. **Stripe Dashboard**
- URL : dashboard.stripe.com
- **Ce qu'on copie** : Design system, empty states, tooltips
- **Pourquoi** : Référence pour design cohérent

### 5. **Retool**
- URL : retool.com
- **Ce qu'on copie** : Actionable insights, quick actions panel
- **Pourquoi** : Focus sur actions rapides

---

## 🛠️ STACK TECHNIQUE (recommandé)

### UI Framework
```bash
# Option A : Shadcn/ui (recommandé)
npx shadcn-ui@latest init

# Pros :
- Composants copiés dans votre code (full control)
- Tailwind-based (cohérence)
- Excellents exemples (dashboard templates)
- Gratuit

# Option B : Chakra UI (actuel)
# Garder si on ne veut pas tout casser
# Ajouter progressivement Shadcn pour nouvelles pages
```

### Charts
```bash
npm install recharts

# Alternative : tremor (meilleur pour dashboards analytics)
npm install @tremor/react
```

### Icons
```bash
npm install lucide-react

# Cohérent, 1000+ icônes, bien maintenu
```

### Animations
```bash
npm install framer-motion

# Déjà installé, excellent pour micro-interactions
```

---

## 📋 CHECKLIST DESIGN SYSTEM

### Composants à créer
- [ ] MetricCard (4 variants)
- [ ] AlertCard (3 priorities)
- [ ] MemberCard
- [ ] SessionCard
- [ ] GraphCard
- [ ] QuickActionButton
- [ ] EmptyState
- [ ] PageLoader
- [ ] Toast
- [ ] Badge (status, churn, etc.)

### Tokens à définir
- [ ] Colors (palette complète)
- [ ] Spacing (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
- [ ] Border radius (4, 8, 12, 16px)
- [ ] Shadows (sm, md, lg, xl)
- [ ] Transitions (150ms, 200ms, 300ms)

### Documentation
- [ ] Storybook setup (optionnel mais recommandé)
- [ ] Design tokens exportés (CSS variables)
- [ ] Component usage examples
- [ ] Do's and Don'ts

---

## 🎯 PRIORITÉS IMPLÉMENTATION

### Sprint 1 (Phase 2.1)
1. **Design system base** : Colors, typography, spacing
2. **Shell layout** : Header + Sidebar + Main
3. **MetricCard** : Composant réutilisable
4. **Page Overview** : Dashboard salle vue principale

### Sprint 2 (Phase 2.2)
5. **AlertCard** : Avec priorités
6. **GraphCard** : Recharts intégré
7. **Quick Actions** : Panel actions rapides
8. **Page Members** : Liste + filtres

### Sprint 3 (Phase 2.3)
9. **Page Sessions** : Liste conversations
10. **Page Analytics** : Graphiques avancés
11. **Page Alerts** : Table manager_alerts
12. **Polish** : Animations, empty states, loading

---

**FIN DU GUIDE DESIGN**

**Ce dashboard justifiera 1200€/mois** parce que :
1. **UX fluide** : Tout à portée de clic
2. **Insights actionnables** : Pas juste des chiffres
3. **Temps gagné** : Actions rapides, automatisations
4. **Décisions éclairées** : Data vraies, graphiques clairs
5. **Niveau entreprise** : Design cohérent, professionnel

**Prochaine étape** : Valider ce guide, puis je démarre Phase 1 (sécurité) pendant que vous validez les maquettes.

