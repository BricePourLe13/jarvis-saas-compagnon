# 🤖 Jarvis - Compagnon Vocal Intelligent pour Salles de Sport

> **Plateforme d'intelligence commerciale déguisée en compagnon vocal qui transforme chaque conversation en data actionnable et revenus publicitaires.**

## 🎯 Vision

Jarvis est un compagnon vocal intelligent qui révolutionne l'expérience fitness en transformant chaque interaction membre en opportunité commerciale. 

### Le Concept
- 🏷️ **Adhérents scannent leur badge** et parlent avec Jarvis comme un ami
- 🗣️ **Jarvis répond à TOUT** : questions salle, critiques, demandes générales  
- 🧠 **Chaque conversation est analysée** par des agents IA spécialisés
- 📊 **Gérants reçoivent des insights automatiques** sur leurs membres
- 💰 **Marques paient** pour du placement produit ultra-ciblé

## 💰 Modèle Économique Révolutionnaire

### Stratégie Franchise (ex: Orange Bleue)
- **Salle individuelle** : Paie 1,600€, garde 0€ de pub
- **Franchise complète** : Paie 1,600€, reçoit % des revenus pub
- **Exemple** : 50 salles × 8,000€ pub = 400,000€/mois de revenus pub
- **Redistribution** : 30% à la franchise = 120,000€/mois passifs
- **Résultat** : Jarvis devient GRATUIT + profitable pour la franchise

## 🏗️ Architecture Multitenant

### 3 Niveaux de Dashboards

1. **👨‍💼 Dashboard Gérant** (Salle individuelle)
   - Statistiques de SA salle uniquement
   - Insights sur ses adhérents
   - Suggestions d'actions
   - Scores de satisfaction, churn risque

2. **🏢 Dashboard Franchise** (Orange Bleue)
   - Vue globale sur TOUTES leurs salles
   - Comparaisons inter-salles
   - Revenus publicitaires consolidés
   - KPIs franchise

3. **🔧 Dashboard Admin** (Votre équipe)
   - Monitoring technique global
   - Debug, maintenance
   - Gestion des marques annonceurs
   - Analytics business

## 🚀 Stack Technique

### Backend
- **API** : Node.js + Express + TypeScript
- **Database** : PostgreSQL + Prisma ORM
- **Auth** : JWT + bcrypt + middleware sécurisé
- **Cache** : Redis pour sessions et performances
- **Logs** : Winston + structured logging

### Frontend
- **Dashboard** : React + TypeScript + Vite
- **UI** : Tailwind CSS + Lucide Icons
- **State** : React hooks + Context API
- **HTTP** : Axios + intercepteurs

### Vocal
- **AI** : OpenAI Realtime API
- **Audio** : WebRTC + MediaStream
- **Processing** : Real-time transcription
- **Synthesis** : OpenAI TTS voices

### Infrastructure
- **Deploy** : Docker Compose + multi-services
- **Database** : PostgreSQL avec réplication
- **Cache** : Redis cluster
- **Monitoring** : Health checks + metrics

## 🎯 Fonctionnalités Actuelles

### ✅ Déjà Implémenté
- 🔐 **Authentification sécurisée** (JWT + bcrypt)
- 📱 **Dashboard admin responsive**
- 🎙️ **Interface conversation vocale** (OpenAI Realtime)
- 🏷️ **Système de scan de badges**
- 💾 **Base de données complète** (User, Session, Gym, Franchise)
- 📊 **Logging et analytics** détaillés
- 🏢 **Gestion des salles** (CRUD complet)
- 🔧 **Architecture multitenant** (base)

### 🚧 En Développement
- 🧠 **Agents IA d'analyse** des conversations
- 📈 **Génération d'insights** automatiques
- 💰 **Système publicitaire** et monétisation
- 🎯 **Ciblage produit** contextualisé
- 📊 **Dashboards spécialisés** par niveau

## 🛠️ Installation

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Démarrage Rapide
```bash
# Cloner le repository
git clone https://github.com/BricePourLe13/jarvis-compagnon.git
cd jarvis-compagnon

# Démarrer avec Docker
cd jarvis/jarvis-central-server
docker-compose up -d

# Ou démarrage manuel
./start-jarvis.sh
```

### Accès
- **Dashboard Admin** : http://localhost:3002
- **API** : http://localhost:3001
- **Compagnon Vocal** : http://localhost:3003

### Identifiants par défaut
- **Email** : admin@jarvis.com
- **Password** : admin123

## 📚 Documentation

### Structure du Projet
```
jarvis-saas-platforrm/
├── 📄 project.md              # Vision et spécifications
├── 📄 INSTRUCTIONS.md         # Instructions détaillées
├── 📁 docs/                   # Documentation technique
└── 📁 jarvis/
    └── 📁 jarvis-central-server/
        ├── 📁 api/            # Backend API
        ├── 📁 admin-dashboard/# Interface admin
        ├── 📁 companion-interface/ # Interface vocale
        ├── 📁 database/       # Schémas et migrations
        └── 📄 docker-compose.yml
```

### API Endpoints
- `GET /api/v1/health` - Health check
- `POST /api/v1/admin/auth/login` - Authentification admin
- `GET /api/v1/admin/gyms` - Liste des salles
- `POST /api/v1/realtime/session` - Session vocale
- `GET /api/v1/analytics/insights` - Insights IA

## 🤝 Contribution

### Workflow
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards
- **Code** : ESLint + Prettier
- **Commits** : Conventional Commits
- **Tests** : Jest + React Testing Library
- **Types** : TypeScript strict mode

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 Différenciation

**Jarvis n'est pas juste un chatbot**, c'est une plateforme d'intelligence commerciale qui combine :
- 🤖 **IA conversationnelle** naturelle
- 📊 **Analytics prédictives** avancées  
- 💰 **Monétisation publicitaire** ciblée
- 🏢 **Architecture SaaS** scalable

**Barrière à l'entrée** : Complexité technique + relations marques + données propriétaires.

---

**Créé avec ❤️ pour révolutionner l'expérience fitness**
