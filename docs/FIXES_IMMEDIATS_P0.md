# ✅ FIXES IMMÉDIATS APPLIQUÉS (P0)

**Date :** 9 Novembre 2025  
**Status :** 🟡 En cours - 3/6 fixes appliqués

---

## ✅ **DÉJÀ CORRIGÉ**

### 1. Détection "Au revoir" Réactivée ✅
**Fichier :** `src/app/kiosk/[slug]/page.tsx`

**Avant :**
```typescript
const detectExitIntent = useCallback((transcript: string) => {
  return false  // ❌ Désactivé
}, [])
```

**Après :**
```typescript
const detectExitIntent = useCallback((transcript: string) => {
  const exitKeywords = [
    /au\s*revoir/i,
    /merci\s+(beaucoup|bien|bcp)/i,
    /\b(salut|ciao|bye|adieu)\b/i,
    /bonne\s+(journée|journ[ée]e|soir[ée]e|nuit)/i,
    /à\s+(bientôt|bient[ôo]t|plus|tout\s+à\s+l'heure|demain)/i,
    /c['']\s*est\s+bon/i,
    /j['']\s*y\s+vais/i,
    /je\s+(pars|m['']\s*en\s+vais)/i
  ]
  return exitKeywords.some(regex => regex.test(transcript.toLowerCase()))
}, [])
```

**Impact :**
- ✅ Sessions se terminent naturellement
- ✅ Économie tokens OpenAI
- ✅ Meilleure UX

---

### 2. Rate Limiting Kiosks Créé ✅
**Fichier :** `src/lib/kiosk-rate-limiter.ts`

**Fonctionnalités :**
```typescript
// Limite 10 sessions/membre/jour
export async function checkKioskRateLimit(memberId, gymId)

// Alertes si > 50 sessions/gym/jour
export async function checkGymDailyUsage(gymId)

// Vérifier durée session (max 30 min)
export async function checkSessionDuration(sessionId)
```

**Impact :**
- ✅ Protection contre spam
- ✅ Contrôle coûts OpenAI
- ✅ Alertes préventives

---

### 3. Tool `get_class_schedule` Créé ✅
**Fichier :** `src/app/api/jarvis/tools/get-class-schedule/route.ts`

**Fonctionnalités :**
- ✅ Récupération horaires cours
- ✅ Filtrage par nom cours
- ✅ Filtrage par date
- ✅ Affichage places disponibles
- ✅ Validation Zod
- ✅ Logging interactions

**Impact :**
- ✅ JARVIS peut maintenant donner horaires cours !

---

## 🔄 **À FAIRE MAINTENANT (2-3h)**

### 4. Intégrer Rate Limiting dans API Route

**Fichier à modifier :** `src/app/api/voice/kiosk/session/route.ts`

```typescript
import { checkKioskRateLimit, checkGymDailyUsage } from '@/lib/kiosk-rate-limiter'

export async function POST(request: NextRequest) {
  const { memberId, gymId } = await request.json()
  
  // 🔧 AJOUTER CECI
  const rateLimit = await checkKioskRateLimit(memberId, gymId)
  
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'Limite quotidienne atteinte',
      message: `Tu as atteint ta limite de ${rateLimit.currentSessionCount} sessions aujourd'hui. Reviens demain !`,
      remainingToday: rateLimit.remainingToday
    }, { status: 429 })
  }
  
  // Vérifier usage global gym (alertes)
  const gymUsage = await checkGymDailyUsage(gymId)
  if (gymUsage.shouldAlert) {
    console.warn(`🚨 Gym ${gymId} : ${gymUsage.totalSessionsToday} sessions aujourd'hui !`)
    // TODO: Envoyer alerte Slack/Email
  }
  
  // ... reste du code
}
```

---

### 5. Créer 5 Tools Manquants (4h)

#### Tool #1: `reserve-class` (1h)
```typescript
// src/app/api/jarvis/tools/reserve-class/route.ts

export async function POST(request: NextRequest) {
  const { memberId, classId, className, date, time } = await request.json()
  
  // 1. Vérifier que le cours existe
  const { data: gymClass } = await supabase
    .from('gym_classes')
    .select('*')
    .eq('id', classId)
    .single()
  
  // 2. Vérifier places disponibles
  const { count: reserved } = await supabase
    .from('class_reservations')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
  
  if (reserved >= gymClass.capacity) {
    return NextResponse.json({
      success: false,
      message: "Désolé, ce cours est complet. Je peux te proposer d'autres horaires ?"
    })
  }
  
  // 3. Créer réservation
  const { data, error } = await supabase
    .from('class_reservations')
    .insert({
      member_id: memberId,
      class_id: classId,
      gym_id: gymClass.gym_id,
      status: 'confirmed',
      reserved_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({
      success: false,
      message: "Erreur lors de la réservation. Réessaye ou contacte l'accueil."
    })
  }
  
  return NextResponse.json({
    success: true,
    reservation: data,
    message: `Parfait ! Je t'ai réservé une place pour ${gymClass.name} le ${date} à ${time}. À bientôt !`
  })
}
```

#### Tool #2: `cancel-reservation` (30min)
```typescript
// src/app/api/jarvis/tools/cancel-reservation/route.ts

export async function POST(request: NextRequest) {
  const { memberId, reservationId } = await request.json()
  
  // Vérifier que la réservation appartient au membre
  const { data: reservation, error: fetchError } = await supabase
    .from('class_reservations')
    .select('*, gym_classes(*)')
    .eq('id', reservationId)
    .eq('member_id', memberId)
    .single()
  
  if (fetchError || !reservation) {
    return NextResponse.json({
      success: false,
      message: "Je ne trouve pas cette réservation."
    })
  }
  
  // Annuler
  const { error } = await supabase
    .from('class_reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', reservationId)
  
  if (error) {
    return NextResponse.json({
      success: false,
      message: "Erreur lors de l'annulation."
    })
  }
  
  return NextResponse.json({
    success: true,
    message: `Ta réservation pour ${reservation.gym_classes.name} est annulée.`
  })
}
```

#### Tool #3: `get-equipment-availability` (1h)
```typescript
// src/app/api/jarvis/tools/get-equipment-availability/route.ts

export async function POST(request: NextRequest) {
  const { gymId, equipmentName } = await request.json()
  
  // Query équipements disponibles
  let query = supabase
    .from('gym_equipment')
    .select('*')
    .eq('gym_id', gymId)
    .eq('status', 'available')
  
  if (equipmentName) {
    query = query.ilike('name', `%${equipmentName}%`)
  }
  
  const { data: equipment } = await query
  
  if (!equipment || equipment.length === 0) {
    return NextResponse.json({
      success: true,
      equipment: [],
      message: `Désolé, je ne trouve pas de "${equipmentName}" disponible pour le moment. Veux-tu essayer un autre équipement ?`
    })
  }
  
  const message = `Il y a ${equipment.length} ${equipmentName} disponible(s) : ${equipment.map(e => e.location || 'zone principale').join(', ')}.`
  
  return NextResponse.json({
    success: true,
    equipment,
    message
  })
}
```

#### Tool #4: `get-member-stats` (1h)
```typescript
// src/app/api/jarvis/tools/get-member-stats/route.ts

export async function POST(request: NextRequest) {
  const { memberId, period = 'month' } = await request.json()
  
  // Calculer date début selon période
  const now = new Date()
  const startDate = new Date()
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }
  
  // Récupérer stats membre
  const { data: visits } = await supabase
    .from('member_check_ins')
    .select('*')
    .eq('member_id', memberId)
    .gte('checked_in_at', startDate.toISOString())
  
  const { data: classesAttended } = await supabase
    .from('class_attendances')
    .select('*, gym_classes(*)')
    .eq('member_id', memberId)
    .gte('attended_at', startDate.toISOString())
  
  const totalVisits = visits?.length || 0
  const totalClasses = classesAttended?.length || 0
  const avgVisitsPerWeek = period === 'week' ? totalVisits : (totalVisits / 4)
  
  const periodText = {
    week: 'cette semaine',
    month: 'ce mois',
    year: 'cette année'
  }[period]
  
  const message = `Tes stats ${periodText} : ${totalVisits} visites et ${totalClasses} cours suivis. Tu viens en moyenne ${Math.round(avgVisitsPerWeek)} fois par semaine. Bravo !`
  
  return NextResponse.json({
    success: true,
    stats: {
      period,
      total_visits: totalVisits,
      total_classes: totalClasses,
      avg_visits_per_week: avgVisitsPerWeek,
      favorite_classes: classesAttended?.slice(0, 3).map(c => c.gym_classes.name) || []
    },
    message
  })
}
```

#### Tool #5: `get-gym-hours` (30min)
```typescript
// src/app/api/jarvis/tools/get-gym-hours/route.ts

export async function POST(request: NextRequest) {
  const { gymId } = await request.json()
  
  const { data: gym } = await supabase
    .from('gyms')
    .select('name, opening_hours')
    .eq('id', gymId)
    .single()
  
  if (!gym || !gym.opening_hours) {
    return NextResponse.json({
      success: true,
      message: "Les horaires standard sont 6h-23h du lundi au vendredi, et 8h-20h le weekend. Contacte l'accueil pour plus de détails."
    })
  }
  
  // Formatter horaires (supposant JSON structure)
  const hours = typeof gym.opening_hours === 'string' 
    ? JSON.parse(gym.opening_hours)
    : gym.opening_hours
  
  const message = `Voici les horaires de ${gym.name} :\n` +
    `Lundi-Vendredi : ${hours.weekday || '6h-23h'}\n` +
    `Samedi-Dimanche : ${hours.weekend || '8h-20h'}`
  
  return NextResponse.json({
    success: true,
    hours,
    message
  })
}
```

---

### 6. Créer Tables DB Manquantes (30min)

**Migration SQL à créer :** `supabase/migrations/20251109000001_add_missing_tables.sql`

```sql
-- Table: gym_classes (si manquante)
CREATE TABLE IF NOT EXISTS gym_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructor_name TEXT,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  capacity INTEGER NOT NULL DEFAULT 20,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: class_reservations (si manquante)
CREATE TABLE IF NOT EXISTS class_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')) DEFAULT 'confirmed',
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gym_equipment (si manquante)
CREATE TABLE IF NOT EXISTS gym_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- 'cardio', 'weights', 'functional', etc.
  status TEXT CHECK (status IN ('available', 'in_use', 'maintenance', 'broken')) DEFAULT 'available',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: member_check_ins (si manquante)
CREATE TABLE IF NOT EXISTS member_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ
);

-- Table: class_attendances (si manquante)
CREATE TABLE IF NOT EXISTS class_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES class_reservations(id),
  attended_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gym_classes_gym_id ON gym_classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_classes_date ON gym_classes(date);
CREATE INDEX IF NOT EXISTS idx_class_reservations_member_id ON class_reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_class_reservations_class_id ON class_reservations(class_id);
CREATE INDEX IF NOT EXISTS idx_gym_equipment_gym_id ON gym_equipment(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_check_ins_member_id ON member_check_ins(member_id);

-- RLS Policies
ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendances ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique des cours (pour kiosks)
CREATE POLICY "Courses visibles publiquement" ON gym_classes
  FOR SELECT USING (is_active = true);

-- Policy: Membres peuvent voir leurs réservations
CREATE POLICY "Membres voient leurs réservations" ON class_reservations
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM members WHERE id = member_id));

-- Policy: Service role peut tout faire
CREATE POLICY "Service role full access gym_classes" ON gym_classes
  USING (auth.jwt()->>'role' = 'service_role');
  
CREATE POLICY "Service role full access reservations" ON class_reservations
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## 🎯 **CHECKLIST FINAL**

- [x] ✅ Détection "au revoir" réactivée
- [x] ✅ Rate limiter kiosks créé
- [x] ✅ Tool `get_class_schedule` créé
- [ ] 🔄 Intégrer rate limiter dans API route (15 min)
- [ ] 🔄 Créer tool `reserve-class` (1h)
- [ ] 🔄 Créer tool `cancel-reservation` (30min)
- [ ] 🔄 Créer tool `get-equipment-availability` (1h)
- [ ] 🔄 Créer tool `get-member-stats` (1h)
- [ ] 🔄 Créer tool `get-gym-hours` (30min)
- [ ] 🔄 Créer migration SQL tables manquantes (30min)

**Total restant :** ~5h de dev

---

## 🚀 **DÉPLOIEMENT**

Une fois tous les fixes appliqués :

```bash
# 1. Vérifier linter
npm run lint

# 2. Appliquer migration DB
# Via Supabase Dashboard > SQL Editor > Run migration

# 3. Commit & Push
git add .
git commit -m "fix(P0): detection au revoir + rate limiting + 6 tools manquants"
git push origin main

# 4. Vérifier déploiement Vercel
# https://vercel.com/dashboard

# 5. Tester en prod
# Scanner badge → Demander horaires cours → Réserver → Au revoir
```

---

**Status Final Attendu :** 🟢 **Production-Ready (Pilote)**

Avec ces fixes, JARVIS sera fonctionnel à **80%** de ses capacités promises !

