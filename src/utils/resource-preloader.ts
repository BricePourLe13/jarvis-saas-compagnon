/**
 * 🎯 Critical Resource Preloader
 * Preload intelligent basé sur les capacités device
 */

import { WebGLDetector } from './webgl-detector'

interface PreloadConfig {
  critical: string[]     // Toujours précharger
  performance: string[]  // Précharger seulement si device performant  
  lazy: string[]        // Précharger après interaction
}

class ResourcePreloader {
  private preloadedResources = new Set<string>()
  private isInitialized = false
  
  // Configuration des ressources par priorité
  private config: PreloadConfig = {
    critical: [
      // Images critiques above-the-fold
      '/images/dashboard-gerant.jpg',
    ],
    performance: [
      // Modules lourds pour devices performants
      // '/api/voice/vitrine/session', // API POST-only, cannot preload
    ],
    lazy: [
      // Ressources pour interactions futures
    ]
  }
  
  // Initialisation automatique
  init() {
    if (this.isInitialized || typeof window === 'undefined') return
    this.isInitialized = true
    
    // Précharger immédiatement les ressources critiques
    this.preloadCritical()
    
    // Précharger ressources performance selon device
    const isHighEnd = !WebGLDetector.isLowEndDevice()
    if (isHighEnd) {
      // Délai court pour devices performants
      setTimeout(() => this.preloadPerformance(), 1000)
    } else {
      // Délai plus long pour devices faibles
      setTimeout(() => this.preloadPerformance(), 3000)
    }
    
    // Précharger ressources lazy sur première interaction
    this.setupLazyPreload()
  }
  
  // Préchargement critique (immédiat)
  private preloadCritical() {
    this.config.critical.forEach(resource => {
      this.preloadResource(resource, 'critical')
    })
  }
  
  // Préchargement performance (différé)
  private preloadPerformance() {
    this.config.performance.forEach(resource => {
      this.preloadResource(resource, 'performance')
    })
  }
  
  // Setup préchargement lazy
  private setupLazyPreload() {
    const events = ['mouseenter', 'touchstart', 'focus']
    
    const handleFirstInteraction = () => {
      this.config.lazy.forEach(resource => {
        this.preloadResource(resource, 'lazy')
      })
      
      // Nettoyer listeners
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction)
      })
    }
    
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { 
        passive: true, 
        once: true 
      })
    })
  }
  
  // Précharger une ressource spécifique
  private preloadResource(href: string, priority: 'critical' | 'performance' | 'lazy') {
    if (this.preloadedResources.has(href)) return
    
    try {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      
      // Déterminer le type de ressource
      if (href.startsWith('/api/')) {
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
      } else if (href.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        link.as = 'image'
      } else if (href.match(/\.(css)$/i)) {
        link.as = 'style'
      } else if (href.match(/\.(js|mjs)$/i)) {
        link.as = 'script'
      } else {
        link.as = 'fetch'
      }
      
      // Priorité de chargement
      switch (priority) {
        case 'critical':
          link.setAttribute('importance', 'high')
          break
        case 'performance':
          link.setAttribute('importance', 'auto')
          break
        case 'lazy':
          link.setAttribute('importance', 'low')
          break
      }
      
      document.head.appendChild(link)
      this.preloadedResources.add(href)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Preloaded [${priority}]:`, href)
      }
      
    } catch (error) {
      console.warn('Preload failed:', href, error)
    }
  }
  
  // Ajouter ressource à précharger
  addCritical(href: string) {
    this.config.critical.push(href)
    if (this.isInitialized) {
      this.preloadResource(href, 'critical')
    }
  }
  
  addPerformance(href: string) {
    this.config.performance.push(href)
    if (this.isInitialized && !WebGLDetector.isLowEndDevice()) {
      this.preloadResource(href, 'performance')
    }
  }
  
  addLazy(href: string) {
    this.config.lazy.push(href)
  }
  
  // Hook React
  usePreloader() {
    React.useEffect(() => {
      this.init()
    }, [])
    
    return {
      addCritical: this.addCritical.bind(this),
      addPerformance: this.addPerformance.bind(this),
      addLazy: this.addLazy.bind(this)
    }
  }
}

// Instance globale
export const resourcePreloader = new ResourcePreloader()

// Hook React simplifié
import React from 'react'

export const useResourcePreloader = () => {
  return resourcePreloader.usePreloader()
}

// Auto-init sur import
if (typeof window !== 'undefined') {
  // Init après un micro-délai pour pas bloquer le parsing
  setTimeout(() => resourcePreloader.init(), 0)
}
