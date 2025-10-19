# Infrastructure JARVIS-GROUP

> **Version :** 3.0 (Architecture V3.0 Validée)  
> **Date :** 19 octobre 2025  
> **Auteur :** Brice PRADET - JARVIS-GROUP  
> **Stack :** Groq + Chatterbox + Analytics MVP Crédible

## Vue d'ensemble

L'infrastructure JARVIS-GROUP supporte le déploiement de **JARVIS Voice Engine V3.0**, notre agent vocal IA pour salles de sport. Architecture optimisée pour performance, coût et scalabilité.

## Stack Technologique V3.0 (Validée)

### Frontend
- **Next.js 15** - Framework React
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Vercel** - Hosting et CDN

### Backend Voice Engine
- **FastAPI** - API Gateway + WebSocket
- **Groq API** - STT (Whisper Large V3) + LLM (LLaMA 3.3 70B)
- **Chatterbox TTS** - Voice synthesis + emotions (RunPod GPU)
- **Supabase** - Base-de-données + Auth + Storage
- **Redis** - Cache + Sessions

### Analytics & ML
- **Celery + RabbitMQ** - Task queue asynchrone
- **scikit-learn** - Churn prediction (XGBoost)
- **transformers** - Sentiment analysis (CamemBERT)
- **Supabase** - Data warehouse

### Infrastructure
- **Vercel** - Hosting frontend + API Gateway
- **RunPod** - GPU pour Chatterbox TTS (RTX 3060 12GB)
- **Supabase Cloud** - Base-de-données + Auth
- **GitHub** - Version control + CI/CD

### Monitoring
- **Prometheus + Grafana** - Métriques système
- **Sentry** - Error tracking
- **Vercel Analytics** - Métriques frontend

## Architecture de Déploiement

### Production (15 kiosques)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel Edge)                              │
│                            jarvis-group.net                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  Landing Page   │  │ Dashboard Gérant │  │  Kiosk Interface (React)  │  │
│  │  (Marketing)    │  │  (Analytics UI)  │  │  (WebSocket Audio Stream) │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                              HTTPS REST + WebSocket
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (FastAPI - Vercel Edge Functions)             │
│                         Cloudflare CDN + DDoS Protection                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  LAYER 1: INIT      │   │  LAYER 2: AGENT     │   │  LAYER 3: ANALYTICS │
│  (Context Loading)  │   │  (Real-Time Voice)  │   │  (Post-Processing)  │
│                     │   │                     │   │                     │
│  1.5-3 secondes     │   │  <400ms latency     │   │  Asynchrone         │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
                                      │
                              ┌───────┼───────┐
                              │       │       │
                              ▼       ▼       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  GROQ API (FREE)    │   │  CHATTERBOX TTS     │   │  SUPABASE + REDIS   │
│  STT + LLM          │   │  RunPod RTX 3060    │   │  Data + Cache       │
│  <400ms latency     │   │  €180/mois          │   │  €0/mois            │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Coûts Infrastructure (15 kiosques)

| Service | Coût Mensuel | Notes |
|---------|--------------|-------|
| **Vercel** | €0 | Hobby Plan (gratuit) |
| **Groq API** | €0 | FREE tier (1M STT + 14.4k LLM/jour) |
| **Chatterbox TTS** | €180 | RunPod RTX 3060 12GB |
| **Supabase** | €0 | FREE tier (< 500MB) |
| **Redis** | €0 | Inclus dans RunPod |
| **Total** | **€180/mois** | **€12/kiosque/mois** |

## Sécurité et Performance

### Sécurité
- **HTTPS** - Chiffrement end-to-end
- **JWT Tokens** - Authentification sécurisée
- **RLS (Row Level Security)** - Isolation données par salle
- **API Rate Limiting** - Protection contre abus
- **DDoS Protection** - Cloudflare

### Performance
- **Latence end-to-end** - <400ms p95
- **Uptime** - >99.5% (SLA)
- **Scalabilité** - 200+ kiosques simultanés
- **Cache Redis** - <5ms response time
- **CDN** - Vercel Edge Network

## Monitoring et Observabilité

### Métriques Business
- **Sessions actives** - Kiosques connectés
- **Taux de satisfaction** - Sentiment analysis
- **Churn risk** - Prédictions ML
- **Tools usage** - Actions exécutées

### Métriques Techniques
- **Latence pipeline** - STT + LLM + TTS
- **Erreur rate** - <1% target
- **Throughput** - Sessions/minute
- **GPU utilization** - Chatterbox TTS

### Alertes
- **Churn risk élevé** - >70% pour un membre
- **Latence élevée** - >500ms
- **Erreurs API** - >5% sur 5 minutes
- **GPU saturation** - >90% utilisation

## Déploiement et CI/CD

### Pipeline de Déploiement
1. **Development** - Branches feature
2. **Staging** - Tests automatiques
3. **Production** - Déploiement automatique

### Environnements
- **Production** - jarvis-group.net
- **Staging** - staging.jarvis-group.net
- **Development** - dev.jarvis-group.net

### Backup et Recovery
- **Base de données** - Backup quotidien Supabase
- **Code** - Git repository GitHub
- **Configuration** - Environment variables Vercel
- **RTO** - <15 minutes (Recovery Time Objective)

## Évolutivité

### Phase 1 : MVP (0-50 kiosques)
- Architecture actuelle
- Coût : €12/kiosque/mois
- Latence : <400ms

### Phase 2 : Scale (50-200 kiosques)
- Ajout TimescaleDB pour time series
- Load balancing multi-région
- Coût : €8/kiosque/mois

### Phase 3 : Enterprise (200+ kiosques)
- Data Lake complet
- ML Ops (MLflow)
- Analytics prédictifs avancés
- Coût : €6/kiosque/mois

---

**Dernière mise à jour :** 19 Octobre 2025  
**Validé par :** Architecture Team - JARVIS-GROUP  
**Contact :** tech@jarvis-group.net