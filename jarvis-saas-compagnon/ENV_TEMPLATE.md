# 🔐 Variables d'Environnement JARVIS

## Variables Requises pour la Production

### Supabase (OBLIGATOIRE)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### OpenAI (Pour le Kiosk JARVIS)
```bash
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime
```

### Vercel Deployment
```bash
VERCEL_URL=your-app.vercel.app
VERCEL_ENV=production
```

### Sécurité
```bash
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
```

### Analytics (Optionnel)
```bash
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ID=your-speed-insights-id
```

## Configuration dans Vercel

1. **Dashboard Vercel** → Votre projet → Settings → Environment Variables
2. **Ajouter chaque variable** avec les bonnes valeurs
3. **Sélectionner les environnements** : Production, Preview, Development
4. **Sauvegarder** et redéployer 