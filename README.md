# 🤖 Jarvis SaaS Platform

> **Plateforme d'intelligence commerciale déguisée en compagnon vocal pour salles de sport**

## 🎯 Vision

Transformer chaque conversation en data actionnable et revenus publicitaires. Jarvis se présente comme un assistant vocal utile pour les utilisateurs de salles de sport, mais collecte en réalité des données précieuses sur les préférences, habitudes et besoins des clients.

## ✨ Fonctionnalités

### 🤖 Compagnon Vocal Intelligent
- Interface conversation vocale avec OpenAI Realtime API
- Authentification par badges RFID
- Conseils personnalisés nutrition et entraînement
- Collecte discrète de données utilisateur

### � Dashboard Admin Hiérarchique
- **Franchises** → **Salles de Sport** → **Kiosques**
- Gestion multitenant avec rôles (Admin/Franchise/Gérant)
- Analytics en temps réel
- Génération de tokens d'installation

### 🔐 Sécurité & Authentification
- JWT avec refresh tokens
- Système de badges RFID
- Middleware de sécurité avancé
- Gestion des permissions par rôle

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
# 🤖 JARVIS SaaS Platform

Assistant IA conversationnel pour salles de sport.

## 🚀 Application Principale

**[jarvis-saas-compagnon/](./jarvis-saas-compagnon/)** - Interface web SaaS avec Supabase et OpenAI

### Démarrage rapide

```bash
cd jarvis-saas-compagnon
npm install
npm run dev
```

### 🔗 Liens

- **Production**: [https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app](https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app)
- **Documentation**: [jarvis-saas-compagnon/README.md](./jarvis-saas-compagnon/README.md)

---
*Développé par JARVIS Group*/
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
