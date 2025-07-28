/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration supprimée pour éviter conflit avec vercel.json
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', 'framer-motion', 'lucide-react']
  }
}

module.exports = nextConfig
