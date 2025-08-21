const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration supprimée pour éviter conflit avec vercel.json
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', 'framer-motion', 'lucide-react']
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