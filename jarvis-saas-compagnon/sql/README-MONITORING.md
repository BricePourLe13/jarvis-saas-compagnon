# 🚀 SYSTÈME DE MONITORING JARVIS - GUIDE COMPLET

Ce guide détaille l'installation et l'utilisation du système de monitoring avancé pour les kiosks JARVIS.

## 📋 ÉTAPES D'INSTALLATION

### 1. 🔍 Audit Initial
Exécutez d'abord pour analyser votre configuration actuelle :
```sql
-- Dans Supabase SQL Editor
\i 01-audit-current-config.sql
```

**Ce script vous dira :**
- Quelles tables existent déjà
- Combien de données vous avez
- L'état de vos kiosks
- Les erreurs récentes

### 2. ✅ Vérification Prérequis
Assurez-vous que ces tables existent :
```sql
-- Si manquantes, exécutez d'abord :
\i create-heartbeat-table.sql
\i create-errors-log-table.sql
```

### 3. 🚀 Installation Complète
Lancez l'installation principale :
```sql
-- Installation complète du monitoring
\i 05-setup-monitoring-complete.sql
```

### 4. 🔧 Fonctions Avancées (Optionnel)
Pour les fonctions automatisées :
```sql
-- Fonctions de calcul et alertes
\i 03-monitoring-functions.sql
```

---

## 📊 STRUCTURE DU SYSTÈME

### 🗄️ Nouvelles Tables Créées

#### `kiosk_metrics`
Métriques techniques détaillées collectées en temps réel :
- **CPU, RAM, stockage** - Utilisation système
- **Réseau** - Latence, vitesse, qualité
- **API** - Temps de réponse OpenAI
- **Audio** - Niveau micro, volume, qualité
- **Matériel** - Température, consommation

#### `kiosk_incidents`
Incidents et pannes avec suivi complet :
- **Type** - offline, performance, audio, réseau, etc.
- **Sévérité** - low, medium, high, critical
- **Timeline** - Détection → Investigation → Résolution
- **Impact** - Sessions affectées, perte estimée

#### `monitoring_alerts`
Alertes intelligentes avec seuils configurables :
- **Types** - CPU élevé, réseau lent, API timeout, etc.
- **États** - active, acknowledged, resolved, muted
- **Actions** - Recommandations automatiques

#### `kiosk_analytics_hourly`
Cache des métriques agrégées par heure :
- **Performance** - Moyennes CPU, mémoire, réseau
- **Sessions** - Compteurs, taux de succès
- **Uptime** - Disponibilité calculée

### 🔧 Fonctions Automatisées

#### `calculate_hourly_analytics()`
À exécuter **chaque heure** pour calculer les agrégations :
```sql
SELECT calculate_hourly_analytics();
```

#### `cleanup_monitoring_data()`
À exécuter **quotidiennement** pour nettoyer :
```sql
SELECT cleanup_monitoring_data();
```

### 👁️ Vues Dashboard

#### `v_kiosk_current_status`
Vue d'ensemble temps réel de tous les kiosks :
```sql
SELECT * FROM v_kiosk_current_status;
```

---

## 📈 REQUÊTES PRÊTES À UTILISER

### 🎯 Vue d'Ensemble Monitoring
```sql
-- Métriques globales
SELECT * FROM monitoring_overview;
```

### 🚨 Alertes Critiques
```sql
-- Top 10 alertes critiques
SELECT 
  gym_name,
  kiosk_slug,
  alert_type,
  severity,
  title,
  current_value || unit as current,
  threshold_value || unit as threshold,
  triggered_at
FROM monitoring_alerts ma
JOIN gyms g ON ma.gym_id = g.id
WHERE ma.status = 'active'
AND ma.severity IN ('critical', 'error')
ORDER BY ma.triggered_at DESC
LIMIT 10;
```

### 📊 Performance Trends 24h
```sql
-- Évolution performance
SELECT 
  date_trunc('hour', hour_bucket) as hour,
  AVG(avg_cpu_usage) as cpu,
  AVG(avg_memory_usage) as memory,
  AVG(avg_network_latency) as latency,
  SUM(total_sessions) as sessions
FROM kiosk_analytics_hourly
WHERE hour_bucket > now() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', hour_bucket)
ORDER BY hour DESC;
```

### 🔍 Détail Kiosk Spécifique
```sql
-- Remplacer GYM_ID par l'ID réel
SELECT 
  g.name as gym_name,
  kh.last_heartbeat,
  km.cpu_usage,
  km.memory_usage,
  km.network_latency,
  km.api_response_time,
  (SELECT COUNT(*) FROM monitoring_alerts ma 
   WHERE ma.gym_id = g.id AND ma.status = 'active') as active_alerts
FROM gyms g
LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
LEFT JOIN LATERAL (
  SELECT * FROM kiosk_metrics km2 
  WHERE km2.gym_id = g.id 
  ORDER BY km2.collected_at DESC 
  LIMIT 1
) km ON true
WHERE g.id = 'GYM_ID';
```

### 🔧 Health Check Complet
```sql
-- Statut santé de tous les kiosks
SELECT 
  gym_name,
  kiosk_slug,
  CASE 
    WHEN last_heartbeat > now() - INTERVAL '2 minutes' THEN '🟢 Online'
    ELSE '🔴 Offline'
  END as status,
  cpu_usage || '%' as cpu,
  memory_usage || '%' as memory,
  network_latency || 'ms' as latency,
  active_alerts || ' alertes' as alerts
FROM v_kiosk_current_status
ORDER BY active_alerts DESC, gym_name;
```

### 📋 Top Erreurs 7 Jours
```sql
-- Analyse erreurs par type
SELECT 
  error_type,
  COUNT(*) as count,
  COUNT(DISTINCT gym_slug) as affected_kiosks,
  MAX(timestamp) as last_seen
FROM jarvis_errors_log
WHERE timestamp > now() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY count DESC;
```

### 🔧 Recommandations Maintenance
```sql
-- Kiosks nécessitant attention
SELECT 
  g.name as gym_name,
  CASE 
    WHEN km.cpu_usage > 80 THEN '🔥 CPU critique'
    WHEN km.memory_usage > 85 THEN '💾 Mémoire pleine'
    WHEN km.temperature_cpu > 75 THEN '🌡️ Surchauffe'
    WHEN km.network_latency > 300 THEN '🌐 Réseau lent'
    ELSE '✅ OK'
  END as issue,
  km.cpu_usage || '%' as cpu,
  km.memory_usage || '%' as memory,
  km.temperature_cpu || '°C' as temp
FROM gyms g
JOIN LATERAL (
  SELECT * FROM kiosk_metrics km2 
  WHERE km2.gym_id = g.id 
  ORDER BY km2.collected_at DESC 
  LIMIT 1
) km ON true
WHERE km.cpu_usage > 80 
   OR km.memory_usage > 85 
   OR km.temperature_cpu > 75 
   OR km.network_latency > 300
ORDER BY 
  CASE 
    WHEN km.temperature_cpu > 75 THEN 1
    WHEN km.memory_usage > 85 THEN 2
    WHEN km.cpu_usage > 80 THEN 3
    ELSE 4
  END;
```

---

## 🎯 INTÉGRATION INTERFACE ADMIN

### TypeScript Service
Utilisez le service préconfiguré :
```typescript
import { monitoringService } from '@/lib/monitoring-service'

// Vue d'ensemble
const overview = await monitoringService.getMonitoringOverview()

// Statut tous kiosks
const allKiosks = await monitoringService.getAllKioskStatus()

// Détail kiosk
const kioskDetail = await monitoringService.getKioskDetail(gymId)

// Alertes critiques
const alerts = await monitoringService.getCriticalAlerts()

// Métriques récentes
const metrics = await monitoringService.getKioskMetrics(gymId, 24)
```

### Composant React Exemple
```tsx
'use client'

import { useEffect, useState } from 'react'
import { monitoringService, type MonitoringOverview } from '@/lib/monitoring-service'

export function MonitoringDashboard() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  
  useEffect(() => {
    const loadOverview = async () => {
      const data = await monitoringService.getMonitoringOverview()
      setOverview(data)
    }
    
    loadOverview()
    const interval = setInterval(loadOverview, 30000) // Refresh 30s
    
    return () => clearInterval(interval)
  }, [])
  
  if (!overview) return <div>Chargement...</div>
  
  return (
    <div>
      <h2>Monitoring JARVIS</h2>
      <div>
        <span>Kiosks en ligne: {overview.online_kiosks}/{overview.total_kiosks}</span>
        <span>Uptime: {overview.uptime_percentage}%</span>
        <span>Alertes critiques: {overview.critical_alerts}</span>
      </div>
    </div>
  )
}
```

---

## ⚡ AUTOMATISATION RECOMMANDÉE

### Tâches Cron/Scheduler

#### Toutes les heures
```sql
-- Calculer analytics horaires
SELECT calculate_hourly_analytics();
```

#### Quotidien (2h du matin)
```sql
-- Nettoyage données anciennes
SELECT cleanup_monitoring_data();
```

#### Toutes les 5 minutes
```sql
-- Vérifier alertes automatiques
SELECT check_monitoring_alerts();
```

### Alertes Email/Slack
Intégrez avec vos systèmes :
```sql
-- Alertes critiques non acquittées
SELECT 
  title,
  description,
  gym_name,
  triggered_at
FROM monitoring_alerts ma
JOIN gyms g ON ma.gym_id = g.id
WHERE ma.status = 'active'
AND ma.severity = 'critical'
AND ma.triggered_at > now() - INTERVAL '5 minutes';
```

---

## 🔍 DÉPANNAGE

### Aucune Métrique Affichée
1. Vérifiez que les tables existent :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'kiosk_%';
```

2. Vérifiez les données récentes :
```sql
SELECT COUNT(*), MAX(collected_at) 
FROM kiosk_metrics;
```

### Alertes Pas Déclenchées
```sql
-- Vérifier les seuils
SELECT alert_type, threshold_value, current_value 
FROM monitoring_alerts 
WHERE status = 'active';
```

### Performance Lente
```sql
-- Vérifier indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'kiosk_%';
```

---

## 📊 MÉTRIQUES COLLECTÉES

### 💻 Système
- **CPU** : Utilisation processeur (%)
- **RAM** : Utilisation mémoire (%)
- **Stockage** : Espace disque (%)
- **Température** : CPU (°C)

### 🌐 Réseau
- **Latence** : Ping (ms)
- **Vitesse** : Download/Upload (Mbps)
- **Qualité** : excellent/good/fair/poor

### 🎯 Performance
- **API** : Temps réponse OpenAI (ms)
- **Sessions** : Durée moyenne (s)
- **Erreurs** : Taux d'erreur (%)
- **Succès** : Taux de succès (%)

### 🔊 Audio
- **Micro** : Niveau d'entrée (0-100)
- **Haut-parleurs** : Volume sortie (0-100)
- **Qualité** : État audio global

---

## 🎯 SEUILS RECOMMANDÉS

### 🚨 Alertes Critiques
- **CPU** : > 85%
- **Mémoire** : > 90%
- **Température** : > 80°C
- **API** : > 3000ms

### ⚠️ Alertes Warning
- **CPU** : > 70%
- **Mémoire** : > 80%
- **Latence** : > 500ms
- **API** : > 2000ms

### ✅ Valeurs Normales
- **CPU** : < 60%
- **Mémoire** : < 70%
- **Latence** : < 200ms
- **API** : < 1500ms

---

## 🔗 LIENS UTILES

- **Scripts SQL** : `/sql/`
- **Service TypeScript** : `/src/lib/monitoring-service.ts`
- **Types** : Interface TypeScript complète
- **Documentation Supabase** : RLS et fonctions

**Support** : Consultez les logs et métriques pour diagnostiquer les problèmes JARVIS ! 🤖