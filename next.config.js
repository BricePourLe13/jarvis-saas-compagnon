const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ BUILD CHECKS : TypeScript strict, ESLint temporairement ignoré (TODO: corriger warnings)
  typescript: {
    ignoreBuildErrors: false, // ✅ TypeScript strict maintenu
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Temporaire: 100+ warnings à corriger en Phase 2
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react']
  },
  
  // 🔀 REDIRECTS 301 : /admin → /dashboard (fusion complète)
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
    ]
  },
  
  // 🎯 CHUNK SPLITTING INTELLIGENT
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Optimisation bundle pour production
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor principal (React, Next.js core)
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'vendor',
            priority: 30,
            reuseExistingChunk: true,
          },
          // UI Libraries (Chakra UI)
          ui: {
            test: /[\\/]node_modules[\\/](@chakra-ui|@emotion)[\\/]/,
            name: 'ui',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Animations (Framer Motion + GSAP)
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|gsap)[\\/]/,
            name: 'animations',
            priority: 20,
            reuseExistingChunk: true,
          },
          // 3D Graphics (Three.js)
          graphics: {
            test: /[\\/]node_modules[\\/](three)[\\/]/,
            name: 'graphics',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Icons
          icons: {
            test: /[\\/]node_modules[\\/](react-icons)[\\/]/,
            name: 'icons',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Autres dépendances
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'commons',
            priority: 5,
            minChunks: 2,
            reuseExistingChunk: true,
          }
        }
      }
    }
    
    return config
  },
  
  // 🎯 OPTIMISATIONS IMAGES
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 an
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
}

// Configuration Sentry optimisée pour performance
const sentryWebpackPluginOptions = {
  // Configuration de base
  org: "jarvis-group",
  project: "jarvis-saas-compagnon",

  // 🚀 OPTIMISATIONS PERFORMANCE BUILD
  silent: true, // Toujours silencieux pour accélérer
  
  // ❌ DÉSACTIVÉ: Upload source maps réduit (build plus rapide)
  widenClientFileUpload: false,
  
  // ❌ DÉSACTIVÉ: Pas de tunnel route (économise ressources)
  // tunnelRoute: "/monitoring",

  // ✅ ACTIVÉ: Tree-shake Sentry logger statements
  disableLogger: true,

  // ❌ DÉSACTIVÉ: Pas de monitoring Vercel Cron (pour l'instant)
  automaticVercelMonitors: false,
  
  // 🚀 OPTIMISATIONS SUPPLÉMENTAIRES
  hideSourceMaps: true, // Cache les source maps du navigateur
  sourcemaps: {
    disable: process.env.NODE_ENV === 'development', // Pas de sourcemaps en dev
  },
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);