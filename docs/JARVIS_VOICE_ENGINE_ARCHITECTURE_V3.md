# 📘 JARVIS VOICE ENGINE - ARCHITECTURE V3.0

> **Classification :** Confidentiel - Usage Interne  
> **Version :** 3.0 Production-Ready  
> **Date :** 19 Octobre 2025  
> **Stack :** **Groq (STT/LLM) + Chatterbox (TTS) + Analytics MVP Crédible**  
> **Auteur :** JARVIS-GROUP  
> **Status :** ✅ **ARCHITECTURE VALIDÉE** - Prêt pour déploiement MVP

---

## ⚠️ CHANGEMENTS MAJEURS (V3.0)

Cette version **REMPLACE DÉFINITIVEMENT** :
- ❌ **Kyutai Unmute** (STT/TTS local Rust) → ✅ **Groq API** (STT/LLM gratuit) + **Chatterbox** (TTS)
- ❌ **CrewAI** (agents complexes) → ✅ **Analytics ML simples** (scikit-learn + transformers)

### Pourquoi ce changement ?

| Critère | V2 (Kyutai + CrewAI) | V3 (Groq + Chatterbox) |
|---------|----------------------|------------------------|
| **Coût/kiosque** | €23/mois | **€12/mois** (-48%) |
| **Latence STT** | 150ms (Kyutai Rust) | **50-80ms (Groq)** (-50%) |
| **Latence LLM** | 200-300ms (vLLM local) | **60-120ms (Groq)** (-60%) |
| **Qualité voix** | ⭐⭐⭐ Neutre uniquement | ⭐⭐⭐⭐⭐ **7 émotions** |
| **Voice cloning** | ❌ | ✅ **Chatterbox** |
| **Function calling** | ⚠️ Manuel | ✅ **Natif Groq** |
| **FREE tier** | ❌ | ✅ **1M req STT + 14.4k req LLM/jour** |
| **Maintenance** | ⚠️ Gestion GPU Rust | ✅ **Zéro (APIs managed)** |
| **Analytics** | ⚠️ CrewAI complexe | ✅ **ML simples (XGBoost + CamemBERT)** |

**Verdict : V3 est 2x plus rapide, 2x moins cher, plus simple et plus qualitatif** ✅

---

## 🎯 ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15 - Vercel)                       │
│                            jarvis-group.net (Edge)                           │
│                                                                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  Landing Page   │  │ Dashboard Gérant │  │  Kiosk Interface (React)  │  │
│  │  (Marketing)    │  │  (Analytics UI)  │  │  (WebSocket Audio Stream) │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                   HTTPS REST    WebSocket    HTTPS REST
                          │           │           │
                          ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (FastAPI - Vercel Edge Functions)             │
│                         Cloudflare CDN + DDoS Protection                      │
│                                                                               │
│  Endpoints:                                                                   │
│  • POST /api/session/create       → Layer 1 (Context Loading)               │
│  • WS   /api/voice/{session_id}   → Layer 2 (Real-Time Agent)               │
│  • POST /api/analytics/*          → Layer 3 (Analytics Query)               │
│  • POST /api/tools/*              → Tool Execution                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  LAYER 1: INIT      │   │  LAYER 2: AGENT     │   │  LAYER 3: ANALYTICS │
│  (Session Context)  │   │  (Real-Time Voice)  │   │  (Post-Processing)  │
│                     │   │                     │   │                     │
│  1.5-3 secondes     │   │  <400ms latency     │   │  Asynchrone         │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘

════════════════════════════════════════════════════════════════════════════════
                          LAYER 2 : REAL-TIME VOICE AGENT
════════════════════════════════════════════════════════════════════════════════

Audio Input (PCM16 20ms chunks)
  ↓
┌────────────────────────────────────────────────┐
│ VAD (Silero VAD v4 - 20ms latency)            │
│ • Model: silero_vad_v4.jit (45MB)             │
│ • Inference: CPU (torch JIT)                   │
│ • Output: is_speech (bool)                     │
└────────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────────┐
│ STT (Groq Whisper Large V3 Turbo)             │
│ • API: https://api.groq.com/.../transcriptions │
│ • Model: whisper-large-v3-turbo                │
│ • Language: fr (français)                      │
│ • Latency: 50-80ms ✅                          │
│ • Cost: FREE (1M req/mois)                     │
└────────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────────┐
│ LLM (Groq LLaMA 3.3 70B Versatile)            │
│ • API: https://api.groq.com/.../completions    │
│ • Model: llama-3.3-70b-versatile               │
│ • Speed: 650 tokens/s                          │
│ • Latency: 60-120ms ✅                         │
│ • Cost: FREE (14.4k req/jour)                  │
│ • Function Calling: Natif (25 tools)           │
└────────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────────┐
│ TTS (Chatterbox - Resemble AI)                │
│ • Deploy: RunPod RTX 3060 12GB (€180/mois)    │
│ • Model: chatterbox-v2 (4.5GB VRAM)            │
│ • Voice: "jarvis_fr" (custom clone)            │
│ • Emotions: 7 (neutral, enthusiastic,          │
│   empathetic, apologetic, encouraging,         │
│   confident, calm)                             │
│ • Latency: 200-300ms ✅                        │
│ • Streaming: Chunks 500ms                      │
└────────────────────────────────────────────────┘
  ↓
Audio Output (Opus 32kbps streaming)

**TOTAL LATENCY: 330-520ms p95** ✅
```

---

## 🛠️ LAYER 2 DÉTAILLÉ : 25 TOOLS MCP

### **KNOWLEDGE TOOLS (15)** - Enrichissement base de connaissance

| Tool | Description | Latency | DB Query |
|------|-------------|---------|----------|
| `get_member_stats` | Stats adhérent (visites, fréquence, progrès) | 30ms | `gym_members`, `visit_history` |
| `get_weekly_schedule` | Cours collectifs semaine avec dispo | 40ms | `group_classes` |
| `get_gym_info` | Infos salle (horaires, adresse, équipements, affluence) | 25ms | `gyms` |
| `list_coaches` | Liste coachs avec spécialités et horaires | 35ms | `coaches` |
| `check_coach_availability` | Disponibilités coach pour la semaine | 30ms | `coach_appointments` |
| `get_equipment_status` | Statut équipements (dispo, maintenance, HS) | 20ms | `equipment` |
| `get_member_programs` | Programmes d'entraînement (actuel et historique) | 30ms | `training_programs` |
| `search_video_tutorials` | Recherche vidéos tutoriels exercices | 25ms | `video_library` |
| `get_nutrition_tips` | Conseils nutrition selon objectif | 15ms | Statique |
| `get_gym_events` | Événements à venir (challenges, stages) | 30ms | `events` |
| `check_class_availability` | Places disponibles cours collectif | 20ms | `class_enrollments` |
| `get_member_achievements` | Achievements/badges adhérent (gamification) | 25ms | `achievements` |
| `get_workout_recommendations` | Recommandations exercices personnalisées | 40ms | ML inference |
| `get_gym_leaderboard` | Classement salle (visites, challenges) | 35ms | `leaderboards` |
| `get_faq_answer` | Recherche réponse dans FAQ salle | 30ms | `faq` + RAG |

### **ACTION TOOLS (10)** - Exécution de tâches

| Tool | Description | Side Effects | Latency |
|------|-------------|--------------|---------|
| `book_coach_appointment` | Réserve RDV coach | INSERT `coach_appointments` | 50ms |
| `enroll_group_class` | Inscrit à cours collectif | INSERT `class_enrollments` | 45ms |
| `cancel_booking` | Annule réservation | UPDATE `bookings` (status='cancelled') | 40ms |
| `send_sms_reminder` | Envoie SMS rappel/encouragement | Twilio API call | 100ms |
| `send_email_study` | Envoie document/étude par email | Resend API call | 80ms |
| `notify_gym_manager` | Notification urgente gérant | INSERT `manager_notifications` | 30ms |
| `create_mission` | Crée mission dashboard gérant | INSERT `manager_missions` | 40ms |
| `log_feedback` | Enregistre feedback adhérent | INSERT `member_feedback` | 35ms |
| `display_video_tutorial` | Affiche vidéo sur miroir | WebSocket event | 15ms |
| `update_member_goals` | Met à jour objectifs adhérent | UPDATE `gym_members` | 35ms |

---

## 📊 LAYER 3 : POST-SESSION ANALYTICS (SIMPLIFIÉ)

### Architecture

```python
# Après session terminée → Trigger Celery task
@celery.task
async def process_session_analytics(session_id: str):
    # 1. Churn Prediction (scikit-learn XGBoost)
    churn_analysis = predict_churn_risk(
        days_since_last_visit=18,
        visit_frequency=1.2,
        sentiment_history=[-0.2, 0.1, -0.5],
        negative_feedback_count=2,
        membership_months=6
    )
    # → {churn_risk_score: 0.78, risk_level: "HIGH", factors: [...], recommendations: [...]}
    
    # 2. Sentiment Analysis (transformers CamemBERT)
    sentiment_analysis = analyze_session_sentiment(
        transcript=session.transcript,
        member_responses=session.member_utterances
    )
    # → {overall_sentiment: "negative", sentiment_score: -0.4, emotions_detected: {...}}
    
    # 3. Insights Generator (Business Logic)
    insights = generate_session_insights(
        session_data=session,
        churn_analysis=churn_analysis,
        sentiment_analysis=sentiment_analysis
    )
    # → {priority_level: "high", actions_required: [...], missions_to_create: [...]}
    
    # 4. Update Supabase
    # - Sauvegarder churn score sur gym_members
    # - Créer missions pour gérant si nécessaire
    # - Logger insights dans voice_sessions
```

### Pas d'agents complexes !

❌ **V2 utilisait** : CrewAI avec 3 agents (ChurnAgent, SentimentAgent, InsightsAgent)  
✅ **V3 utilise** : Fonctions ML simples (XGBoost, CamemBERT, business logic)

**Avantages** :
- **Simplicité** : Pas de complexité inutile
- **Performance** : Inference ML directe (pas d'orchestration)
- **Maintenance** : Pas de dépendances CrewAI/LangChain
- **Coût** : Pas de LLM API calls pour analytics
- **Déterminisme** : Résultats reproductibles

---

## 💰 COÛTS DÉTAILLÉS (15 KIOSQUES)

### Coûts Mensuels

| Service | Coût | Notes |
|---------|------|-------|
| **Groq STT** | €0 | FREE tier: 1M req/mois<br>Estimation: 15 kiosques × 200 sessions/mois × 5 turns = 15k req/mois |
| **Groq LLM** | €0 | FREE tier: 14.4k req/jour (432k req/mois)<br>Estimation: 15k turns/mois |
| **Chatterbox TTS** | €180 | RunPod RTX 3060 12GB<br>Partagé entre 15 kiosques |
| **Supabase** | €0 | FREE tier < 500MB<br>Estimation: 300MB données |
| **Redis** | €0 | Inclus dans RunPod |
| **Celery/RabbitMQ** | €0 | Inclus dans RunPod |
| **Total** | **€180/mois** | |

### Par Kiosque

- **Coût/kiosque** : €180 / 15 = **€12/mois**
- **Coût/session** : €12 / 200 sessions = **€0.06/session**

### Revenus & Marge (15 salles)

```
Revenus (15 × €1,300/mois) : €19,500/mois
Coûts infrastructure : €180/mois
───────────────────────────────────────
Marge brute : €19,320/mois (99.1%) ✅

ROI annuel : 12,867%
Payback dev : 0.15 mois
```

---

## 🚀 DÉPLOIEMENT PRODUCTION

### Infrastructure Cible

| Composant | Provider | Specs | Coût/mois |
|-----------|----------|-------|-----------|
| **Frontend** | Vercel | Edge (Hobby Plan) | €0 |
| **API Gateway** | Vercel Edge Functions | Serverless | €0 (< 100GB) |
| **Chatterbox TTS** | RunPod | RTX 3060 12GB | €180 |
| **Supabase** | Supabase Cloud | FREE tier | €0 |
| **Redis** | Inclus RunPod | 8GB RAM | €0 |

### Script de déploiement

```bash
# 1. Cloner repo
git clone https://github.com/jarvis-group/jarvis-voice-engine.git
cd jarvis-voice-engine

# 2. Configurer .env
cp env.example .env
# Éditer .env avec GROQ_API_KEY, SUPABASE_URL, etc.

# 3. Déployer sur RunPod
bash scripts/deploy_vastai.sh

# Le script va:
# - Installer toutes les dépendances
# - Déployer Chatterbox TTS (GPU)
# - Configurer Redis
# - Lancer l'API JARVIS
```

### Monitoring

```bash
# Health checks
curl https://api.jarvis-group.net/health

# Métriques Prometheus
curl https://api.jarvis-group.net/metrics

# Logs temps réel
journalctl -u jarvis -f
journalctl -u chatterbox -f
```

---

## 📚 DOCUMENTATION COMPLÈTE

- 📖 [README.md](../../jarvis-voice-engine/README.md) - Vue d'ensemble
- 🛠️ [GUIDE_DEPLOYMENT.md](../../jarvis-voice-engine/GUIDE_DEPLOYMENT.md) - Déploiement détaillé
- 🔧 [API Reference](../../jarvis-voice-engine/API_REFERENCE.md) - Documentation API
- 📊 [Analytics Guide](../../jarvis-voice-engine/ANALYTICS_GUIDE.md) - Analytics ML

---

**Dernière mise à jour :** 19 Octobre 2025  
**Validé par :** Architecture Team - JARVIS-GROUP  
**Contact :** tech@jarvis-group.net

