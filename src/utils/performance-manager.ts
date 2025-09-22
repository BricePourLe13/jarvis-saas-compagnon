/**
 * 🎯 Performance Manager Global
 * Gestion mémoire et animations basée sur la visibilité
 */

import React from 'react'

type AnimationController = {
  pause: () => void
  resume: () => void
  cleanup: () => void
}

class PerformanceManager {
  private timers = new Set<NodeJS.Timeout>()
  private intervals = new Set<NodeJS.Timeout>()
  private animationFrames = new Set<number>()
  private animationControllers = new Set<AnimationController>()
  private isPageVisible = true
  private isInitialized = false
  
  // Initialisation globale
  init() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    this.isInitialized = true
    
    // Écouter changements de visibilité
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Cleanup sur fermeture page
    window.addEventListener('beforeunload', this.cleanup.bind(this))
    
    // Pause animations sur faible batterie (si supporté)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            this.pauseAllAnimations()
          } else if (battery.level > 0.3) {
            this.resumeAllAnimations()
          }
        })
      }).catch(() => {
        // getBattery non supporté, ignorer
      })
    }
  }
  
  // Gestion visibilité page
  private handleVisibilityChange() {
    this.isPageVisible = !document.hidden
    
    if (this.isPageVisible) {
      this.resumeAllAnimations()
    } else {
      this.pauseAllAnimations()
    }
  }
  
  // Ajouter timer avec cleanup automatique
  addTimer(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback()
      this.timers.delete(timer)
    }, delay)
    
    this.timers.add(timer)
    return timer
  }
  
  // Ajouter interval avec cleanup automatique
  addInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)
    return interval
  }
  
  // Ajouter RAF avec cleanup automatique
  addAnimationFrame(callback: FrameRequestCallback): number {
    const raf = requestAnimationFrame((time) => {
      callback(time)
      this.animationFrames.delete(raf)
    })
    
    this.animationFrames.add(raf)
    return raf
  }
  
  // Enregistrer contrôleur d'animation
  registerAnimationController(controller: AnimationController) {
    this.animationControllers.add(controller)
    
    // Si page cachée, pause immédiatement
    if (!this.isPageVisible) {
      controller.pause()
    }
    
    return () => {
      this.animationControllers.delete(controller)
    }
  }
  
  // Pause toutes animations
  private pauseAllAnimations() {
    this.animationControllers.forEach(controller => {
      try {
        controller.pause()
      } catch (error) {
        console.warn('Erreur pause animation:', error)
      }
    })
  }
  
  // Resume toutes animations
  private resumeAllAnimations() {
    this.animationControllers.forEach(controller => {
      try {
        controller.resume()
      } catch (error) {
        console.warn('Erreur resume animation:', error)
      }
    })
  }
  
  // Cleanup global
  cleanup() {
    // Clear tous les timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    
    // Clear tous les intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    
    // Clear tous les RAF
    this.animationFrames.forEach(raf => cancelAnimationFrame(raf))
    this.animationFrames.clear()
    
    // Cleanup animations
    this.animationControllers.forEach(controller => {
      try {
        controller.cleanup()
      } catch (error) {
        console.warn('Erreur cleanup animation:', error)
      }
    })
    this.animationControllers.clear()
  }
  
  // Hook React pour auto-init
  useInit() {
    React.useEffect(() => {
      this.init()
      return () => this.cleanup()
    }, [])
  }
  
  // Hook React pour timer optimisé
  useOptimizedTimer(callback: () => void, delay: number, deps: React.DependencyList = []) {
    React.useEffect(() => {
      const timer = this.addTimer(callback, delay)
      return () => clearTimeout(timer)
    }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  }
  
  // Hook React pour interval optimisé
  useOptimizedInterval(callback: () => void, delay: number, deps: React.DependencyList = []) {
    React.useEffect(() => {
      const interval = this.addInterval(callback, delay)
      return () => clearInterval(interval)
    }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  }
}

// Instance globale
export const performanceManager = new PerformanceManager()

// Hooks React simplifiés
export const usePerformanceManager = () => {
  performanceManager.useInit()
  return performanceManager
}

export const useOptimizedTimer = (
  callback: () => void, 
  delay: number, 
  deps: React.DependencyList = []
) => {
  return performanceManager.useOptimizedTimer(callback, delay, deps)
}

export const useOptimizedInterval = (
  callback: () => void, 
  delay: number, 
  deps: React.DependencyList = []
) => {
  return performanceManager.useOptimizedInterval(callback, delay, deps)
}


