"use client"

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Enregistrer le plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function useSimpleScrollAnimations() {
  const animationsInitialized = useRef(false)

  useEffect(() => {
    if (animationsInitialized.current || typeof window === 'undefined') return

    try {
      // Configuration GSAP simple
      gsap.config({
        force3D: true,
        nullTargetWarn: false,
      })

      // 🎭 ANIMATION 1: Hero Section - Simple et efficace
      gsap.fromTo('.hero-title', 
        { 
          y: 30, 
          opacity: 0.7,
          scale: 0.95
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          delay: 0.2
        }
      )

      gsap.fromTo('.hero-subtitle', 
        { 
          y: 20, 
          opacity: 0.7
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.5
        }
      )

      // 🎭 ANIMATION 2: Sections - Entrée progressive
      gsap.utils.toArray('.section-container').forEach((section: any) => {
        gsap.fromTo(section,
          {
            y: 40,
            opacity: 0.8
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        )
      })

      // 🎭 ANIMATION 3: Cards - Stagger simple
      gsap.utils.toArray('.pricing-cards > *').forEach((card: any, index) => {
        gsap.fromTo(card,
          {
            y: 50,
            opacity: 0.6,
            scale: 0.95
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none"
            },
            delay: index * 0.1
          }
        )
      })

      // 🎭 ANIMATION 4: Text reveal simple
      gsap.utils.toArray('.text-reveal').forEach((text: any) => {
        gsap.fromTo(text,
          {
            y: 20,
            opacity: 0.8
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: text,
              start: "top 90%",
              toggleActions: "play none none none"
            }
          }
        )
      })

      animationsInitialized.current = true

    } catch (error) {
      console.error('Erreur animations GSAP:', error)
      // Fallback : rendre tous les éléments visibles
      const elements = document.querySelectorAll('.hero-title, .hero-subtitle, .section-container, .pricing-cards > *, .text-reveal')
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.opacity = '1'
          el.style.transform = 'none'
        }
      })
    }

    // Nettoyage
    return () => {
      try {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        gsap.killTweensOf("*")
      } catch (error) {
        console.error('Erreur nettoyage GSAP:', error)
      }
    }
  }, [])

  return { 
    refreshScrollTrigger: () => {
      try {
        ScrollTrigger.refresh()
      } catch (error) {
        console.error('Erreur refresh ScrollTrigger:', error)
      }
    }
  }
}
