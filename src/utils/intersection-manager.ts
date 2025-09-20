/**
 * 🎯 Intersection Observer Manager
 * Centralize et optimise tous les observers pour éviter les conflits
 */

import React from 'react'

type ObserverCallback = (entry: IntersectionObserverEntry) => void

interface ObserverConfig {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
}

class IntersectionManager {
  private observers = new Map<string, IntersectionObserver>()
  private elementCallbacks = new Map<Element, { callback: ObserverCallback; observerId: string }>()
  
  // Créer ou réutiliser un observer avec config spécifique
  private getOrCreateObserver(config: ObserverConfig): string {
    const configKey = JSON.stringify(config)
    
    if (!this.observers.has(configKey)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const elementData = this.elementCallbacks.get(entry.target)
          if (elementData && elementData.observerId === configKey) {
            elementData.callback(entry)
          }
        })
      }, config)
      
      this.observers.set(configKey, observer)
    }
    
    return configKey
  }
  
  // Observer un élément avec callback optimisé
  observe(
    element: Element, 
    callback: ObserverCallback, 
    config: ObserverConfig = {}
  ): () => void {
    const observerId = this.getOrCreateObserver(config)
    const observer = this.observers.get(observerId)!
    
    // Nettoyer ancien observer si existant
    this.unobserve(element)
    
    // Ajouter nouveau callback
    this.elementCallbacks.set(element, { callback, observerId })
    observer.observe(element)
    
    // Retourner fonction cleanup
    return () => this.unobserve(element)
  }
  
  // Arrêter d'observer un élément
  unobserve(element: Element) {
    const elementData = this.elementCallbacks.get(element)
    if (elementData) {
      const observer = this.observers.get(elementData.observerId)
      if (observer) {
        observer.unobserve(element)
      }
      this.elementCallbacks.delete(element)
    }
  }
  
  // Cleanup global
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.elementCallbacks.clear()
  }
  
  // Hook React optimisé
  useIntersectionObserver(
    ref: React.RefObject<Element>,
    callback: ObserverCallback,
    config?: ObserverConfig,
    deps: React.DependencyList = []
  ) {
    React.useEffect(() => {
      if (!ref.current) return
      
      const cleanup = this.observe(ref.current, callback, config)
      return cleanup
    }, [ref, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  }
}

// Instance globale partagée
export const intersectionManager = new IntersectionManager()

// Hook React simplifié
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  callback: ObserverCallback,
  config?: ObserverConfig,
  deps: React.DependencyList = []
) => {
  return intersectionManager.useIntersectionObserver(ref, callback, config, deps)
}

// Cleanup au changement de page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    intersectionManager.disconnect()
  })
}
