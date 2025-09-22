"use client"

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialiser Lenis avec configuration optimale
    lenisRef.current = new Lenis({
      duration: 1.2, // Durée du smooth scroll
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing personnalisé
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false, // Désactivé sur mobile pour de meilleures performances
      touchMultiplier: 2,
      wheelMultiplier: 1,
      infinite: false,
    })

    // Fonction de mise à jour pour l'animation
    function raf(time: number) {
      lenisRef.current?.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Nettoyage
    return () => {
      lenisRef.current?.destroy()
    }
  }, [])

  return lenisRef.current
}


