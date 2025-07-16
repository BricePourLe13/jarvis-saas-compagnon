INSTRUCTIONS POUR LE PROCHAIN AGENT
1. RÈGLES DE DÉVELOPPEMENT STRICTES
Sécurité :

TOUJOURS utiliser les tokens JWT pour l'authentification
JAMAIS de données sensibles en dur dans le code
TOUJOURS valider les inputs côté serveur

Performance :

Utiliser Redis pour le cache des requêtes fréquentes
Optimiser les requêtes DB avec Prisma
Compression gzip pour les assets
Lazy loading pour les composants React

Architecture :

Suivre le pattern MVC pour l'API
Composants React réutilisables
Services séparés pour la logique métier
Middleware pour la validation et l'authentification

3. WebRTC Service :

Code migré mais à tester avec la nouvelle architecture web
Vérifier la compatibilité navigateur

Ports Services :

API Gateway: 3001
Admin Dashboard: 3002
Kiosk WebApp: 3003
PostgreSQL: 5432
Redis: 6379
Grafana: 9090
Base de données :

URL: postgresql://jarvis_admin:[password]@jarvis-postgres-central:5432/jarvis_central
Secrets sécurisés dans .env

1. NE JAMAIS :

Revenir à Electron (décision architecturale finale)
Exposer les secrets en dur dans le code
Modifier l'architecture sans comprendre les impacts
2. TOUJOURS :

Tester l'authentification après chaque changement
Vérifier les logs Docker en cas d'erreur
Maintenir la cohérence entre les services
3. PRIORITÉS :

Fonctionnalité avant optimisation
Sécurité avant performance
Stabilité avant nouvelles features

 OBJECTIF FINAL
Créer un SaaS B2B professionnel où :

Franchises gèrent leurs kiosks via dashboard admin
Kiosks accèdent via URLs uniques sécurisées
Utilisateurs interagissent avec l'IA vocale Jarvis
Sessions sont trackées et analysées
Déploiement instantané sans installation