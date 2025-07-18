# 🚀 Guide de Déploiement Vercel - JARVIS SaaS Compagnon

## 📋 Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **CLI Vercel** : `npm i -g vercel`
3. **Variables d'environnement** configurées

## 🔧 Configuration Initiale

### 1. Installation CLI Vercel
```bash
npm install -g vercel
vercel login
```

### 2. Configuration du Projet
```bash
# Dans le dossier du projet
vercel

# Suivre les prompts :
# ? Set up and deploy "~/jarvis-saas-compagnon"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? jarvis-saas-compagnon
# ? In which directory is your code located? ./
```

## 🌍 Variables d'Environnement Vercel

### Méthode 1 : Interface Web
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `jarvis-saas-compagnon`
3. Onglet **Settings** → **Environment Variables**
4. Ajouter chaque variable :

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
OPENAI_API_KEY = sk-...
NEXTAUTH_SECRET = your-secret-key
NEXTAUTH_URL = https://jarvis-saas-compagnon.vercel.app
```

### Méthode 2 : CLI Vercel
```bash
# Variables publiques (commencent par NEXT_PUBLIC_)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Variables privées
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add NEXTAUTH_SECRET production
```

## 🚀 Déploiement

### Déploiement Automatique (Recommandé)
Une fois configuré, chaque push sur `main` déclenche un déploiement automatique grâce à notre workflow GitHub Actions.

### Déploiement Manuel
```bash
# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

## 🔗 Configuration des Domaines

### Domaine Vercel (Gratuit)
- **Production** : `jarvis-saas-compagnon.vercel.app`
- **Preview** : `jarvis-saas-compagnon-[branch].vercel.app`

### Domaine Personnalisé
1. **Vercel Dashboard** → **Settings** → **Domains**
2. Ajouter : `jarvis.your-domain.com`
3. Configurer DNS :
   ```
   Type: CNAME
   Name: jarvis
   Value: cname.vercel-dns.com
   ```

## 📊 Monitoring Vercel

### Analytics Intégrés
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/analytics']
  }
}

module.exports = nextConfig
```

### Speed Insights
```bash
npm install @vercel/speed-insights
```

```javascript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

## 🔄 Workflow CI/CD

Notre fichier `.github/workflows/ci-cd.yml` gère :
- ✅ Tests automatiques
- ✅ Build verification
- ✅ Déploiement Vercel
- ✅ Preview deployments pour PRs

### Branches et Environnements
- **`main`** → Production (`jarvis-saas-compagnon.vercel.app`)
- **`dev`** → Preview (`jarvis-saas-compagnon-dev.vercel.app`)
- **Pull Requests** → Preview unique par PR

## 🛠️ Configuration Avancée

### Functions Serverless
```javascript
// api/hello.js
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'JARVIS API is running!',
    timestamp: new Date().toISOString()
  })
}
```

### Edge Functions (Beta)
```javascript
// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Redirection admin
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
}
```

## 🔍 Debugging Production

### Logs Vercel
```bash
# Voir les logs en temps réel
vercel logs --follow

# Logs d'une function spécifique
vercel logs api/users
```

### Variables d'environnement de debug
```bash
# Vérifier les variables
vercel env ls

# Télécharger les variables localement
vercel env pull .env.local
```

## 📱 Performance et Optimisation

### Optimisation Next.js pour Vercel
```javascript
// next.config.js
const nextConfig = {
  // Optimisations Vercel
  swcMinify: true,
  compress: true,
  
  // Images
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp']
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}
```

## 🚨 Troubleshooting

### Erreurs Communes

1. **Build Error** : Vérifier `npm run build` en local
2. **Env Variables** : Vérifier que toutes les variables sont définies
3. **Import Errors** : Vérifier les paths absolus/relatifs
4. **API Routes** : Vérifier la structure dans `app/api/`

### Support
- **Vercel Docs** : [vercel.com/docs](https://vercel.com/docs)
- **Next.js Vercel** : [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Discord Vercel** : [vercel.com/discord](https://vercel.com/discord)

---

## 🎯 Checklist de Déploiement

- [ ] Compte Vercel créé
- [ ] CLI Vercel installé
- [ ] Variables d'environnement configurées
- [ ] Build local réussi (`npm run build`)
- [ ] Tests passent (`npm test`)
- [ ] Configuration domaine (optionnel)
- [ ] Monitoring activé
- [ ] Documentation mise à jour

**🚀 Une fois configuré, le déploiement sera automatique à chaque push !**
