"use client"

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Enregistrer le plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function useScrollAnimations() {
  const animationsInitialized = useRef(false)

  useEffect(() => {
    if (animationsInitialized.current || typeof window === 'undefined') return

    // Configuration globale GSAP
    gsap.config({
      force3D: true, // Force l'accélération GPU
      nullTargetWarn: false,
    })

    // Fallback : si GSAP ne fonctionne pas, rendre tous les éléments visibles
    const fallbackTimer = setTimeout(() => {
      const elements = document.querySelectorAll('.hero-title, .hero-subtitle, .section-container, .pricing-cards > *, .text-reveal')
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.opacity = '1'
          el.style.transform = 'none'
        }
      })
    }, 2000) // Fallback après 2 secondes

    // 🎭 ANIMATION 1: Hero Section - Reveal progressif et rapide
    gsap.fromTo('.hero-title', 
      { 
        y: 10, 
        opacity: 0.8,
        scale: 0.98
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.1
      }
    )

    gsap.fromTo('.hero-subtitle', 
      { 
        y: 10, 
        opacity: 0.8 
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.3
      }
    )

    // 🎭 ANIMATION 2: Sections - Entrance douce et rapide
    gsap.utils.toArray('.section-container').forEach((section: any, index) => {
      gsap.fromTo(section,
        {
          y: 10,
          opacity: 0.9
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // 🎭 ANIMATION 3: Cards - Stagger effect doux
    gsap.utils.toArray('.pricing-cards > *').forEach((card: any, index) => {
      gsap.fromTo(card,
        {
          y: 10,
          opacity: 0.9,
          scale: 0.99
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none reverse"
          },
          delay: index * 0.1 // Stagger delay réduit
        }
      )
    })

    // 🎭 ANIMATION 4: Parallaxe subtil pour éléments background
    gsap.utils.toArray('.parallax-element').forEach((element: any) => {
      gsap.to(element, {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      })
    })

    // 🎭 ANIMATION 5: Text reveal avec masque
    gsap.utils.toArray('.text-reveal').forEach((text: any) => {
      gsap.fromTo(text,
        {
          y: 100,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: text,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // 🎭 ANIMATION 6: Hover effects pour cards
    gsap.utils.toArray('.hover-card').forEach((card: any) => {
      const tl = gsap.timeline({ paused: true })
      
      tl.to(card, {
        y: -10,
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        duration: 0.3,
        ease: "power2.out"
      })

      card.addEventListener('mouseenter', () => tl.play())
      card.addEventListener('mouseleave', () => tl.reverse())
    })

    animationsInitialized.current = true

    // Nettoyage
    return () => {
      clearTimeout(fallbackTimer)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      gsap.killTweensOf("*")
    }
  }, [])

  // Fonction pour rafraîchir ScrollTrigger après changements DOM
  const refreshScrollTrigger = () => {
    ScrollTrigger.refresh()
  }

  return { refreshScrollTrigger }
}
