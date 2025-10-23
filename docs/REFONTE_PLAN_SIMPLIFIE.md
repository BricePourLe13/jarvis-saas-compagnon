# 🚀 PLAN DE REFONTE SIMPLIFIÉ - KIOSKS UNIQUEMENT

**Date** : 23 octobre 2025  
**Version** : 1.0 - Simplifié  
**Scope** : Miroirs digitaux (kiosks) UNIQUEMENT - Mobile beaucoup plus tard

---

## 🎯 OBJECTIF : RENDRE LE SYSTÈME PROPRE, SÛR ET PRO

**Périmètre** :
- ✅ Dashboards gérants (refonte complète)
- ✅ Système kiosks (améliorer, pas refondre)
- ✅ Sécurité (isolation stricte par salle)
- ✅ Métriques réelles (fini Math.random())
- ❌ Mobile (pas maintenant)

**Résultat attendu** :
- Dashboard niveau entreprise
- Un gérant voit **UNIQUEMENT** sa salle
- Système kiosk stable et documenté
- Métriques vraies pour décisions business
- Architecture évolutive (mais sans développer mobile)

---

## 📊 PROBLÈMES ACTUELS (rappel)

### 🔴 Critique
1. **Pas d'auth sur dashboards** - N'importe qui peut accéder
2. **2 dashboards parallèles** - `/dashboard` ET `/admin` (bordel)
3. **Métriques fake** - `Math.random()` partout
4. **Isolation faible** - Un gérant pourrait voir d'autres salles

### 🟠 Important  
5. **Système kiosk basique** - Pas de device management
6. **Pas d'invitations** - Impossible d'ajouter un gérant
7. **Tables BDD inutilisées** - `member_analytics`, `manager_alerts`, etc.

### 🟡 Améliorable
8. **UX incohérente** - Chaque page fait sa propre chose
9. **Logs au pif** - `console.log` partout
10. **Pas de monitoring** - Impossible de voir si ça marche

---

## 🏗️ ARCHITECTURE CIBLE (simplifié)

### Hiérarchie dashboards (UN SEUL SYSTÈME)

```
/dashboard                    ← UN SEUL dashboard
  ├── middleware.ts           ← 🔒 Auth + permissions
  │
  ├── /                       ← Redirect selon rôle
  │
  ├── (super-admin)/
  │   ├── /overview           ← Vue globale JARVIS-GROUP
  │   ├── /franchises         ← Liste toutes franchises
  │   └── /system             ← Monitoring + config
  │
  ├── (franchise-owner)/
  │   └── /franchise/[id]
  │       ├── /               ← Vue d'ensemble franchise
  │       └── /gyms           ← Liste salles de la franchise
  │
  ├── (gym-manager)/          ← 🎯 VUE PRINCIPALE
  │   └── /gym/[id]
  │       ├── /               ← Dashboard SALLE (vue unique)
  │       ├── /members        ← Adhérents de cette salle
  │       ├── /sessions       ← Conversations JARVIS
  │       ├── /analytics      ← Métriques + graphiques
  │       ├── /alerts         ← Alertes intelligentes (nouveau)
  │       └── /settings       ← Config salle + kiosk
  │
  └── (shared)/
      ├── /team               ← Invitations + gestion équipe
      └── /profile            ← Profil utilisateur

/admin                        ← ❌ SUPPRIMÉ (tout fusionné)

/kiosk/[slug]                 ← ✅ GARDÉ (interface miroir)
```

**Changements** :
- ❌ Supprimer `/admin` complètement
- ✅ UN SEUL système dashboard avec rôles
- ✅ Dashboard salle = vue isolée (un gérant = une salle)
- ✅ Kiosks gardés tels quels (juste améliorés)

### Système kiosks (amélioré, pas refondre)

**Actuel** :
```
Kiosk physique
  ↓
  URL: /kiosk/{slug}
  ↓
  Badge RFID scanné
  ↓
  Session JARVIS
```

**Améliorations** :
1. **Provisioning propre** : Code d'activation + heartbeat
2. **Monitoring** : Status online/offline visible dashboard
3. **Config centralisée** : Gérant peut changer voix/modèle depuis dashboard
4. **Logs structurés** : Plus de `console.log`, logs BDD

**PAS de changements** :
- ✅ URL `/kiosk/{slug}` gardée
- ✅ Système RFID gardé
- ✅ Flow actuel gardé

---

## 📅 PLAN D'ACTION (3 PHASES)

### 🔴 PHASE 1 : SÉCURITÉ + NETTOYAGE (Semaine 1-2)

**Objectif** : Protéger les dashboards + supprimer `/admin`

#### 1.1 Middleware Auth (2 jours)
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔒 Protéger TOUS les dashboards
  if (pathname.startsWith('/dashboard')) {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.redirect('/login')
    }
    
    // Vérifier accès selon rôle
    if (!canAccessRoute(user, pathname)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }
  
  return NextResponse.next()
}
```

**Livrables** :
- [ ] Middleware auth complet
- [ ] Protection toutes routes `/dashboard`
- [ ] Redirection auto selon rôle
- [ ] Tests E2E auth

#### 1.2 Fusion `/admin` → `/dashboard` (3 jours)
```bash
# Migrations
/admin/franchises    → /dashboard/(super-admin)/franchises
/admin/sessions/live → /dashboard/(shared)/sessions
/admin/team          → /dashboard/(shared)/team
/admin/monitoring    → /dashboard/(super-admin)/system
```

**Livrables** :
- [ ] Nouvelle structure dossiers
- [ ] Redirects 301 anciennes routes
- [ ] Navigation unifiée
- [ ] Suppression dossier `/admin`

#### 1.3 RLS Strict + Helpers (2 jours)
```typescript
// src/lib/secure-queries.ts
export async function getGymDataSecure(gymId: uuid, userId: uuid) {
  // ✅ Vérifie TOUJOURS l'accès avant de renvoyer data
  const hasAccess = await checkUserHasGymAccess(userId, gymId)
  if (!hasAccess) throw new ForbiddenError()
  
  return supabase.from('gyms').select('*').eq('id', gymId).single()
}
```

**Livrables** :
- [ ] Helpers sécurisés pour queries sensibles
- [ ] Audit logs (table `audit_trail`)
- [ ] Tests sécurité (isolation par salle)

---

### 🟠 PHASE 2 : DASHBOARDS PROPRES (Semaine 3-5)

**Objectif** : Dashboard salle niveau entreprise

#### 2.1 Dashboard Salle - Vue principale (5 jours)

**Route** : `/dashboard/gym/[id]`

**Page d'accueil salle** :
```typescript
// Sections affichées
1. Header
   - Nom salle
   - Status kiosk (online/offline)
   - Quick actions (inviter staff, créer mission)

2. Métriques clés (4 cards)
   - Membres actifs (vs mois dernier)
   - Sessions aujourd'hui (vs hier)
   - Churn risk HIGH (combien)
   - Satisfaction (score /5)

3. Alertes urgentes (top 3)
   - Ex: "5 membres à risque de churn"
   - Ex: "Kiosk offline depuis 2h"
   - Ex: "10 feedbacks négatifs cette semaine"

4. Graphiques tendances
   - Sessions par jour (7 derniers jours)
   - Satisfaction par semaine (4 dernières semaines)
```

**Livrables** :
- [ ] Page overview créée
- [ ] Composants réutilisables (MetricCard, AlertCard)
- [ ] Métriques RÉELLES (queries BDD)
- [ ] Graphiques (recharts)
- [ ] Responsive mobile

#### 2.2 Pages secondaires salle (5 jours)

**1. Members** (`/gym/[id]/members`)
```typescript
// Liste adhérents avec filtres
- Tous
- Churn risk élevé
- Inactifs (>30 jours)
- Nouveaux (ce mois)

// Actions
- Voir fiche détaillée
- Exporter CSV
- Filtrer par objectifs
```

**2. Sessions** (`/gym/[id]/sessions`)
```typescript
// Conversations JARVIS en temps réel
- Liste sessions live + récentes
- Durée, transcripts, sentiment
- Filtres par date, membre, sentiment
```

**3. Analytics** (`/gym/[id]/analytics`)
```typescript
// Graphiques avancés
- Fréquentation par heure/jour
- Taux de rétention
- Objectifs atteints
- Exports PDF/CSV
```

**4. Alerts** (`/gym/[id]/alerts`) ← **NOUVEAU**
```typescript
// Table manager_alerts affichée
- Tri par priorité (urgent → low)
- Actions recommandées par IA
- Résolution + notes
- Historique
```

**5. Settings** (`/gym/[id]/settings`)
```typescript
// Config salle + kiosk
- Voix JARVIS (verse, alloy, etc.)
- Modèle AI (mini vs full)
- Branding (couleurs, logo)
- Horaires salle
- Status kiosk (online/offline)
```

**Livrables** :
- [ ] 5 pages créées
- [ ] Navigation fluide
- [ ] Filtres fonctionnels
- [ ] Exports CSV/PDF
- [ ] Tests E2E dashboard

#### 2.3 Métriques réelles (3 jours)
```typescript
// Fini les Math.random() !
const metrics = {
  active_members: await countActiveMembers(gymId),
  sessions_today: await countSessionsToday(gymId),
  churn_risk_high: await countMembersChurnRisk(gymId, 'high'),
  avg_satisfaction: await calculateAvgSatisfaction(gymId, '30d')
}

// Cache Redis pour perf
await redis.set(`metrics:${gymId}`, metrics, 'EX', 300) // 5min cache
```

**Livrables** :
- [ ] Fonctions calcul métriques
- [ ] Cache Redis (Upstash Free tier)
- [ ] Background job refresh (cron)
- [ ] Tests unitaires

#### 2.4 Système d'invitations (2 jours)
```typescript
// /dashboard/(shared)/team
- Inviter un staff/gérant
- Email automatique (Resend)
- Flow: invitation → acceptation → accès
- Révoquer accès
```

**Livrables** :
- [ ] Page `/team` complète
- [ ] API `/api/invitations`
- [ ] Emails templates (Resend)
- [ ] Tests flow complet

---

### 🟡 PHASE 3 : ANALYTICS + POLISH (Semaine 6-7)

**Objectif** : Utiliser tables analytics + polish UX

#### 3.1 Intégration tables analytics (3 jours)
```typescript
// Utiliser member_analytics, manager_alerts, insights_reports
const alerts = await getManagerAlerts(gymId, { status: 'pending' })
const insights = await getWeeklyInsights(gymId)
const churnMembers = await getMembersAtRisk(gymId, 0.7)
```

**Livrables** :
- [ ] `manager_alerts` affichées dashboard
- [ ] `insights_reports` générés auto (cron)
- [ ] `member_analytics` calculées post-session
- [ ] Notifications email gérant

#### 3.2 Monitoring kiosks (2 jours)
```typescript
// Dashboard → Settings → Status kiosk
{
  status: 'online' | 'offline',
  last_heartbeat: '2025-10-23T14:30:00Z',
  uptime_percentage: 98.5,
  sessions_today: 45,
  avg_response_time: '350ms'
}
```

**Livrables** :
- [ ] Heartbeat system amélioré
- [ ] Status visible dashboard
- [ ] Alertes si offline >15min
- [ ] Historique uptime

#### 3.3 Design system + polish (2 jours)
```typescript
// Composants standardisés
- DashboardCard (card générique)
- MetricCard (métrique avec trend)
- AlertCard (alerte avec priorité)
- MemberCard (fiche adhérent)
- SessionCard (conversation)
- GraphCard (graphique recharts)

// Palette couleurs unifiée
const colors = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
}
```

**Livrables** :
- [ ] Design system documenté
- [ ] Composants Storybook (optionnel)
- [ ] Guide style (Figma ou doc)
- [ ] UI cohérente partout

---

## 🎨 MAQUETTES DASHBOARD SALLE

### Vue d'ensemble (`/dashboard/gym/[id]`)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏋️ PowerGym Lyon                    [⚡ Kiosk: Online]      │
│ ───────────────────────────────────────────────────────────  │
│                                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 245      │ │ 18       │ │ 12       │ │ 4.3/5    │        │
│ │ Membres  │ │ Sessions │ │ Churn    │ │ Satisf.  │        │
│ │ actifs   │ │ today    │ │ risk     │ │ score    │        │
│ │ +5%      │ │ +2       │ │ 🔴       │ │ 😊       │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│ 🚨 Alertes urgentes (3)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 URGENT - 5 membres à risque churn élevé              │ │
│ │    → Action: Contacter dans les 48h                     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🟠 WARNING - Kiosk offline 2x cette semaine             │ │
│ │    → Action: Vérifier connexion réseau                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🟡 INFO - 10 feedbacks négatifs équipements             │ │
│ │    → Action: Planifier maintenance                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ 📊 Tendances (7 derniers jours)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │     📈 Sessions                                          │ │
│ │ 60  ┌─┐                                                  │ │
│ │ 40  │ │ ┌─┐     ┌─┐                                     │ │
│ │ 20  │ │ │ │ ┌─┐ │ │ ┌─┐ ┌─┐ ┌─┐                        │ │
│ │  0  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─                         │ │
│ │     L   M   M   J   V   S   D                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Quick Actions: [+ Inviter staff] [📊 Rapport] [⚙️ Config]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 ESTIMATION EFFORT

| Phase | Durée | Focus | Priorité |
|-------|-------|-------|----------|
| Phase 1 - Sécurité | 2 semaines | Auth + nettoyage | 🔴 Critique |
| Phase 2 - Dashboards | 3 semaines | Dashboard salle | 🟠 Important |
| Phase 3 - Polish | 2 semaines | Analytics + UX | 🟡 Souhaitable |
| **TOTAL** | **7 semaines** | - | - |

**Ressources** : 1 dev fullstack senior

**Coût opportunité** : ~€0 (juste votre temps)

---

## 📊 MÉTRIQUES DE SUCCÈS

### Phase 1 (Sécurité)
- [ ] 100% routes dashboards protégées
- [ ] 0 fuite de données entre salles
- [ ] Tests sécu passants
- [ ] Ancien `/admin` supprimé

### Phase 2 (Dashboards)
- [ ] Dashboard salle <1s load time
- [ ] 100% métriques réelles (0 random)
- [ ] Invitations fonctionnelles
- [ ] 5 pages créées + testées

### Phase 3 (Polish)
- [ ] Alertes affichées (<5min latency)
- [ ] Status kiosk visible
- [ ] Design cohérent partout
- [ ] Documentation complète

---

## 🚧 RISQUES

### Risque 1 : Performance dashboards
**Impact** : Dashboards lents (>2s)  
**Mitigation** : Cache Redis + indexes BDD

### Risque 2 : Migration `/admin` → `/dashboard`
**Impact** : Liens cassés  
**Mitigation** : Redirects 301 + tests E2E

### Risque 3 : Métriques complexes
**Impact** : Queries lentes  
**Mitigation** : Background jobs + cache

---

## ✅ CHECKLIST AVANT DE COMMENCER

### Validation
- [ ] Plan approuvé par vous
- [ ] Backup BDD complet
- [ ] Environnement staging configuré
- [ ] Tests E2E setup (Playwright)

### Technique
- [ ] Supabase access vérifié
- [ ] Redis (Upstash) configuré
- [ ] Resend API key (emails invitations)
- [ ] Sentry configuré (monitoring)

---

## 🎯 PROCHAINES ÉTAPES

**Si vous validez ce plan** :

### Cette semaine (Phase 1 kick-off)
1. Backup BDD + création branch `refonte/phase-1`
2. Middleware auth (2 jours)
3. Fusion `/admin` → `/dashboard` (3 jours)

### Semaine prochaine
4. RLS strict + helpers (2 jours)
5. Tests sécurité
6. **Phase 1 terminée** ✅

---

## ❓ QUESTIONS OUVERTES

1. **Tests E2E** : Playwright obligatoire ou optionnel ?
2. **Cache** : Redis (Upstash) ou autre ?
3. **Emails** : Resend ou autre provider ?
4. **Design** : Garder Chakra UI ou migrer Shadcn/ui ?

---

**FIN DU PLAN SIMPLIFIÉ**

**Architecture évolutive** : On garde une structure qui POURRA accueillir mobile plus tard, mais on ne le développe pas maintenant.

**Focus** : Kiosks + Dashboards, c'est tout. Simple, propre, pro.

