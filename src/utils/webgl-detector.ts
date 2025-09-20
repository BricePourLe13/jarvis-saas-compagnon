/**
 * 🎯 WebGL Detection & Performance Utils
 * Détecte les capacités WebGL sans changer le design
 */

export const WebGLDetector = {
  // Détection support WebGL
  isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  },

  // Détection performance WebGL
  getWebGLPerformanceLevel(): 'high' | 'medium' | 'low' | 'none' {
    if (!this.isWebGLSupported()) return 'none'
    
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') as WebGLRenderingContext
      
      if (!gl) return 'none'
      
      // Tester les extensions avancées
      const extensions = {
        anisotropic: gl.getExtension('EXT_texture_filter_anisotropic'),
        derivatives: gl.getExtension('OES_standard_derivatives'),
        vertexArray: gl.getExtension('OES_vertex_array_object'),
        instanced: gl.getExtension('ANGLE_instanced_arrays')
      }
      
      // Obtenir les limites GPU
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
      const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
      
      // Scoring basé sur les capacités
      let score = 0
      if (maxTextureSize >= 4096) score += 2
      if (maxVertexUniforms >= 256) score += 2
      if (maxFragmentUniforms >= 256) score += 2
      if (extensions.anisotropic) score += 1
      if (extensions.derivatives) score += 1
      if (extensions.vertexArray) score += 1
      if (extensions.instanced) score += 1
      
      if (score >= 7) return 'high'
      if (score >= 4) return 'medium'
      return 'low'
      
    } catch {
      return 'low'
    }
  },

  // Détection device mobile faible
  isLowEndDevice(): boolean {
    const nav = navigator as any
    const cores = nav.hardwareConcurrency || 4
    const memory = nav.deviceMemory || 4
    const connection = nav.connection?.effectiveType || '4g'
    
    return cores < 4 || memory < 4 || ['slow-2g', '2g', '3g'].includes(connection)
  },

  // 🔍 DÉTECTION NAVIGATEUR AVANCÉE (pour Chrome Canary vs Normal)
  getBrowserCapabilities(): {
    isCanary: boolean;
    isChrome: boolean;
    version: number;
    hasAdvancedFeatures: boolean;
    performanceLevel: 'premium' | 'standard' | 'basic';
  } {
    const userAgent = navigator.userAgent
    const isChrome = /Chrome/.test(userAgent)
    const isCanary = /Chrome\/(\d+)/.test(userAgent) && userAgent.includes('dev')
    
    // Extraire version Chrome
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0'
    const version = parseInt(chromeVersion)
    
    // Features avancées (Canary/Chrome récent)
    const hasAdvancedFeatures = isCanary || version >= 120
    
    // Test capacités réelles
    const supportsOffscreenCanvas = 'OffscreenCanvas' in window
    const supportsWebGL2 = !!document.createElement('canvas').getContext('webgl2')
    const supportsSharedArrayBuffer = 'SharedArrayBuffer' in window
    
    // Déterminer niveau performance
    let performanceLevel: 'premium' | 'standard' | 'basic' = 'basic'
    
    if (isCanary && supportsOffscreenCanvas && supportsWebGL2) {
      performanceLevel = 'premium'
    } else if (isChrome && version >= 110 && supportsWebGL2) {
      performanceLevel = 'standard'  
    }
    
    return {
      isCanary,
      isChrome,
      version,
      hasAdvancedFeatures,
      performanceLevel
    }
  },

  // 🎯 RECOMMANDATION OPTIMALE SELON NAVIGATEUR
  getOptimalConfig(): {
    useWebGL: boolean;
    pixelRatio: number;
    antialias: boolean;
    powerPreference: 'default' | 'high-performance' | 'low-power';
    enableAdvancedEffects: boolean;
  } {
    const webglLevel = this.getWebGLPerformanceLevel()
    const isLowEnd = this.isLowEndDevice()
    const browserCaps = this.getBrowserCapabilities()
    
    // 🚀 CHROME CANARY: Configuration premium
    if (browserCaps.isCanary || browserCaps.performanceLevel === 'premium') {
      return {
        useWebGL: true,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        antialias: true,
        powerPreference: 'high-performance',
        enableAdvancedEffects: true
      }
    }
    
    // ✅ CHROME/FIREFOX RÉCENT: Configuration standard
    if (browserCaps.performanceLevel === 'standard' && !isLowEnd) {
      return {
        useWebGL: webglLevel !== 'none',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        antialias: false, // OFF pour autres navigateurs
        powerPreference: 'default',
        enableAdvancedEffects: false
      }
    }
    
    // 📱 MOBILE/VIEUX: CSS Fallback
    return {
      useWebGL: false,
      pixelRatio: 1,
      antialias: false,
      powerPreference: 'low-power',
      enableAdvancedEffects: false
    }
  }
}

// CSS Background fallback identique visuellement
export const createCSSFallbackBackground = () => ({
  background: `
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.3) 0%, transparent 50%),
    linear-gradient(to bottom right, #0f0f23, #1a1a2e, #16213e)
  `,
  backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
  backgroundPosition: '0% 0%, 100% 0%, 0% 100%, 0% 0%',
  animation: 'liquidEtherFallback 8s ease-in-out infinite alternate'
})

// CSS Animation identique à LiquidEther
export const injectFallbackCSS = () => {
  if (document.getElementById('webgl-fallback-styles')) return
  
  const style = document.createElement('style')
  style.id = 'webgl-fallback-styles'
  style.textContent = `
    @keyframes liquidEtherFallback {
      0% {
        background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
      }
      50% {
        background-position: 100% 100%, 0% 100%, 100% 0%, 100% 100%;
      }
      100% {
        background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .webgl-fallback {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}
