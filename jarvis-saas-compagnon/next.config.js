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

module.exports = nextConfig
