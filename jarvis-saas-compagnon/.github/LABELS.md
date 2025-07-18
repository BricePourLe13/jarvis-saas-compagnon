# Labels pour JARVIS SaaS Compagnon

## 🏷️ Types de Problèmes
- `bug` - 🐛 Quelque chose ne fonctionne pas
- `enhancement` - ✨ Nouvelle fonctionnalité ou demande
- `documentation` - 📚 Amélioration ou ajout de documentation
- `question` - ❓ Question d'utilisation ou de clarification
- `help-wanted` - 🙋 Aide supplémentaire bienvenue
- `good-first-issue` - 👋 Bon pour les nouveaux contributeurs

## 🎯 Composants
- `admin` - 👨‍💼 Interface d'administration
- `kiosk` - 🤖 Interface kiosk/IA
- `api` - 🔌 API et backend
- `database` - 🗄️ Base de données
- `auth` - 🔐 Authentification et autorisation
- `ui/ux` - 🎨 Interface utilisateur et expérience
- `deployment` - 🚀 Déploiement et infrastructure
- `ci/cd` - ⚙️ Intégration et déploiement continu

## ⚡ Priorités
- `priority/critical` - 🚨 Critique - Problème bloquant
- `priority/high` - 🔴 Haute - Doit être résolu rapidement
- `priority/medium` - 🟡 Moyenne - Important mais pas urgent
- `priority/low` - 🟢 Faible - Nice-to-have

## 🔄 Statuts
- `status/needs-triage` - 🔍 Nécessite un tri et une évaluation
- `status/needs-review` - 👀 En attente de révision
- `status/in-progress` - 🚧 En cours de développement
- `status/blocked` - ⛔ Bloqué par une dépendance
- `status/ready-for-test` - 🧪 Prêt pour les tests
- `status/wontfix` - ❌ Ne sera pas corrigé

## 🏗️ Types de Développement
- `frontend` - 🎨 Développement frontend
- `backend` - ⚙️ Développement backend
- `fullstack` - 🔄 Développement fullstack
- `infrastructure` - 🏗️ Infrastructure et DevOps
- `security` - 🔒 Sécurité
- `performance` - ⚡ Performance et optimisation

## 🧪 Tests et Qualité
- `testing` - 🧪 Tests unitaires, intégration, E2E
- `refactoring` - 🔧 Refactoring et amélioration du code
- `dependencies` - 📦 Gestion des dépendances
- `technical-debt` - ⚠️ Dette technique

## 🌍 Environnements
- `env/development` - 🛠️ Environnement de développement
- `env/staging` - 🎭 Environnement de test
- `env/production` - 🏭 Environnement de production

## 🤝 Contributions
- `first-contribution` - 🎉 Première contribution
- `hacktoberfest` - 🎃 Événement Hacktoberfest
- `community` - 👥 Contribution de la communauté

---

## 📋 Configuration GitHub (Labels.yml)
```yaml
# À utiliser avec GitHub CLI ou actions pour synchroniser les labels
labels:
  - name: "bug"
    color: "d73a4a"
    description: "Quelque chose ne fonctionne pas"
  
  - name: "enhancement"
    color: "a2eeef"
    description: "Nouvelle fonctionnalité ou demande"
  
  - name: "admin"
    color: "0052cc"
    description: "Interface d'administration"
  
  - name: "kiosk"
    color: "5319e7"
    description: "Interface kiosk/IA"
  
  - name: "priority/critical"
    color: "b60205"
    description: "Critique - Problème bloquant"
  
  - name: "priority/high"
    color: "d93f0b"
    description: "Haute - Doit être résolu rapidement"
    
  # ... autres labels
```
