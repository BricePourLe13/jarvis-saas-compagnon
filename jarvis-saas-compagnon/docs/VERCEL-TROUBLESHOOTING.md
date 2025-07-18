# 🚨 Guide de Correction Vercel - JARVIS SaaS Compagnon

## Problème Rencontré
Le CLI Vercel cherche le projet dans un mauvais chemin :
```
Error: The provided path "~\Desktop\PERSO\jarvis-saas-platforrm\jarvis-saas-compagnon\jarvis-saas-compagnon" does not exist
```

## ✅ Solutions

### Solution 1 : Correction via Interface Web Vercel

1. **Aller sur** : https://vercel.com/jarvis-projects-64c74b6d/jarvis-saas-compagnon/settings
2. **Onglet "General"** → **Build & Development Settings**
3. **Root Directory** : Changer de `jarvis-saas-compagnon` vers `.` (point)
4. **Sauvegarder** les changements

### Solution 2 : Reconfiguration Complète

```bash
# Supprimer la config locale
rm -rf .vercel

# Créer un nouveau projet Vercel
vercel --name jarvis-saas-compagnon-new

# Suivre les prompts :
# ? Set up and deploy? yes
# ? Which scope? jarvis' projects  
# ? Link to existing project? no
# ? What's your project's name? jarvis-saas-compagnon-new
# ? In which directory is your code located? ./
```

### Solution 3 : Import GitHub (Recommandé)

1. **Aller sur** : [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**
3. **Sélectionner** : `BricePourLe13/jarvis-saas-compagnon`
4. **Configure Project** :
   - Project Name: `jarvis-saas-compagnon`
   - Framework Preset: `Next.js`
   - Root Directory: `./` (par défaut)
   - Build Command: `npm run build`
   - Output Directory: `.next`

## 🔧 Variables d'Environnement à Configurer

### Dans Vercel Dashboard → Settings → Environment Variables

```env
# Supabase (À configurer plus tard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (À configurer plus tard)  
OPENAI_API_KEY=sk-your_openai_key
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime

# Auth
NEXTAUTH_SECRET=your_random_secret_32_chars_min
NEXTAUTH_URL=https://your-vercel-domain.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

## 📱 URLs Attendues

- **Production** : `https://jarvis-saas-compagnon.vercel.app`
- **Admin** : `https://jarvis-saas-compagnon.vercel.app/admin`
- **Kiosk** : `https://jarvis-saas-compagnon.vercel.app/kiosk`

## 🎯 Étapes Suivantes

1. ✅ **Corriger la config Vercel** (Solutions ci-dessus)
2. ⏳ **Configurer Supabase** (base de données + auth)
3. ⏳ **Intégrer OpenAI** (API GPT-4o Mini Realtime)
4. ⏳ **Tests de déploiement** avec variables d'env

## 📞 Support

Si le problème persiste :
- **GitHub Issues** : Créer une issue avec label `deployment`
- **Vercel Support** : [vercel.com/help](https://vercel.com/help)
- **Discord Vercel** : [vercel.com/discord](https://vercel.com/discord)

---

**🚀 Une fois corrigé, le déploiement sera automatique via GitHub Actions !**
