# 📅 Configuration Upstash QStash - Cron Jobs JARVIS

## 🎯 Vue d'ensemble

JARVIS utilise **Upstash QStash** pour exécuter des tâches planifiées (cron jobs) de manière fiable et serverless.

### Jobs configurés

| Job | Fréquence | Horaire | Description |
|-----|-----------|---------|-------------|
| **Daily Churn Analysis** | Quotidien | 2h00 AM | Analyse le risque de churn de tous les membres actifs |
| **Health Check Kiosks** | Quotidien | 3h00 AM | Vérifie l'état de tous les kiosks et crée des alertes |
| **Cleanup Old Data** | Quotidien | 4h00 AM | Nettoie les données anciennes (RGPD) |
| **Weekly Reports** | Hebdomadaire | Lundi 6h00 AM | Génère les rapports hebdomadaires pour chaque gym |

---

## 📋 Prérequis

1. **Compte Upstash** : [https://upstash.com](https://upstash.com) (gratuit jusqu'à 500 requêtes/jour)
2. **QStash activé** : Dans votre console Upstash
3. **Variables d'environnement** configurées dans Vercel

---

## 🔧 Configuration

### Étape 1 : Créer un compte Upstash

1. Aller sur [https://console.upstash.com](https://console.upstash.com)
2. S'inscrire (Google/GitHub auth)
3. Aller dans **QStash** (menu gauche)
4. Copier les credentials :
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`
   - `QSTASH_TOKEN`

### Étape 2 : Configurer les variables d'environnement Vercel

Dans Vercel Dashboard → **jarvis-saas-compagnon** → Settings → **Environment Variables** :

```bash
# Upstash QStash
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
QSTASH_TOKEN=your_qstash_token

# Cron Job Security (générer un secret aléatoire fort)
CRON_SECRET=your_strong_random_secret_here
```

**Générer un CRON_SECRET fort :**
```bash
openssl rand -hex 32
```

### Étape 3 : Créer les schedules dans Upstash QStash

#### Job 1 : Daily Churn Analysis

```
Name: jarvis-daily-churn
URL: https://jarvis-group.net/api/cron/daily-churn-analysis
Method: POST
Schedule (cron): 0 2 * * *
Headers:
  - Authorization: Bearer YOUR_CRON_SECRET
  - Content-Type: application/json
```

#### Job 2 : Health Check Kiosks

```
Name: jarvis-health-check-kiosks
URL: https://jarvis-group.net/api/cron/health-check-kiosks
Method: POST
Schedule (cron): 0 3 * * *
Headers:
  - Authorization: Bearer YOUR_CRON_SECRET
  - Content-Type: application/json
```

#### Job 3 : Cleanup Old Data

```
Name: jarvis-cleanup-data
URL: https://jarvis-group.net/api/cron/cleanup-old-data
Method: POST
Schedule (cron): 0 4 * * *
Headers:
  - Authorization: Bearer YOUR_CRON_SECRET
  - Content-Type: application/json
```

#### Job 4 : Weekly Reports

```
Name: jarvis-weekly-reports
URL: https://jarvis-group.net/api/cron/weekly-reports
Method: POST
Schedule (cron): 0 6 * * 1
Headers:
  - Authorization: Bearer YOUR_CRON_SECRET
  - Content-Type: application/json
```

---

## ⏰ Syntaxe Cron

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Jour de la semaine (0-7, 0 et 7 = dimanche)
│ │ │ └─── Mois (1-12)
│ │ └───── Jour du mois (1-31)
│ └─────── Heure (0-23)
└───────── Minute (0-59)
```

### Exemples

- `0 2 * * *` = Tous les jours à 2h00 AM
- `0 6 * * 1` = Tous les lundis à 6h00 AM
- `*/15 * * * *` = Toutes les 15 minutes
- `0 */6 * * *` = Toutes les 6 heures

---

## 🔒 Sécurité

### Vérification du CRON_SECRET

Tous les endpoints cron vérifient le header `Authorization` :

```typescript
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json(
    { error: 'Unauthorized - Invalid cron secret' },
    { status: 401 }
  )
}
```

**⚠️ Important :** Ne JAMAIS commiter le `CRON_SECRET` dans le code. Toujours utiliser les variables d'environnement.

---

## 📊 Monitoring

### Vérifier les logs Upstash

1. Aller sur [https://console.upstash.com/qstash](https://console.upstash.com/qstash)
2. Cliquer sur **Logs** (menu gauche)
3. Voir l'historique des exécutions (succès/échecs)

### Vérifier les logs système JARVIS

Les cron jobs logguent dans `system_logs` :

```sql
SELECT * FROM system_logs 
WHERE log_type LIKE 'cron_%' 
ORDER BY timestamp DESC 
LIMIT 50;
```

Types de logs :
- `cron_daily_churn` : Analyse churn
- `cron_kiosk_health` : Health check kiosks
- `cron_cleanup` : Nettoyage données
- `cron_weekly_reports` : Rapports hebdomadaires

### Vérifier manuellement un job

**Via curl :**
```bash
curl -X POST https://jarvis-group.net/api/cron/daily-churn-analysis \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Via Postman/Insomnia :**
- Method: `POST`
- URL: `https://jarvis-group.net/api/cron/daily-churn-analysis`
- Headers:
  - `Authorization`: `Bearer YOUR_CRON_SECRET`
  - `Content-Type`: `application/json`

---

## 🚨 Troubleshooting

### Job ne s'exécute pas

1. **Vérifier les credentials Upstash**
   - Les signing keys sont corrects ?
   - Le token QStash est valide ?

2. **Vérifier l'URL du job**
   - L'URL est accessible publiquement ?
   - HTTPS activé ?

3. **Vérifier le CRON_SECRET**
   - Correspond au header Authorization ?
   - Bien configuré dans Vercel ?

4. **Vérifier les logs Upstash**
   - Erreur 401 = CRON_SECRET invalide
   - Erreur 404 = URL invalide
   - Erreur 500 = Erreur serveur (voir logs Vercel)

### Job timeout

Si un job prend trop de temps (> 60s sur Vercel Free) :

1. **Optimiser le traitement par batch**
   - Réduire `batchSize` dans le code
   - Traiter moins d'éléments à la fois

2. **Passer à Vercel Pro**
   - Timeout 300s au lieu de 60s

3. **Split le job en plusieurs**
   - Ex: Analyser 100 membres/job au lieu de tous

---

## 💰 Coûts Upstash QStash

### Plan Gratuit
- **500 requêtes/jour** = suffisant pour :
  - 3 jobs quotidiens
  - 1 job hebdomadaire
  - ~30 jours de marge

### Plan Pro ($10/mois)
- **100,000 requêtes/mois**
- Nécessaire si :
  - Plus de 10 gyms actives
  - Jobs toutes les heures
  - Jobs de test fréquents

---

## 📚 Ressources

- [Upstash QStash Docs](https://upstash.com/docs/qstash)
- [Cron Syntax](https://crontab.guru/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Checklist Configuration

- [ ] Compte Upstash créé
- [ ] QStash activé
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `CRON_SECRET` généré (openssl rand -hex 32)
- [ ] 4 schedules créés dans Upstash QStash
- [ ] Jobs testés manuellement (curl/Postman)
- [ ] Logs système vérifiés
- [ ] Monitoring Upstash configuré

---

**🎯 Une fois configuré, les jobs s'exécutent automatiquement selon leur planning !**

