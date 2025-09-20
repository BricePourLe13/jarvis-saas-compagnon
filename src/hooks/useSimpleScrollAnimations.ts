"use client"

import { useEffect, useRef, useState } from 'react'

// 📦 DYNAMIC GSAP IMPORTS - Chargement à la demande
type GSAPType = typeof import('gsap').gsap
type ScrollTriggerType = typeof import('gsap/ScrollTrigger').ScrollTrigger

interface GSAPModules {
  gsap: GSAPType
  ScrollTrigger: ScrollTriggerType
}

export function useSimpleScrollAnimations() {
  const animationsInitialized = useRef(false)
  const [gsapModules, setGsapModules] = useState<GSAPModules | null>(null)

  // 🎯 LAZY LOAD GSAP au premier scroll
  useEffect(() => {
    let isScrolled = false
    
    const loadGSAP = async () => {
      if (isScrolled || gsapModules) return
      
      try {
        // Import dynamique de GSAP
        const [gsapModule, scrollTriggerModule] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ])
        
        // Enregistrer plugin
        gsapModule.gsap.registerPlugin(scrollTriggerModule.ScrollTrigger)
        
        setGsapModules({
          gsap: gsapModule.gsap,
          ScrollTrigger: scrollTriggerModule.ScrollTrigger
        })
        
        isScrolled = true
      } catch (error) {
        console.warn('GSAP loading failed, animations disabled:', error)
      }
    }
    
    // Charger GSAP au premier scroll
    const handleFirstScroll = () => {
      loadGSAP()
      window.removeEventListener('scroll', handleFirstScroll)
    }
    
    // Ou après 2s si pas de scroll
    const fallbackTimer = setTimeout(loadGSAP, 2000)
    
    window.addEventListener('scroll', handleFirstScroll, { passive: true, once: true })
    
    return () => {
      window.removeEventListener('scroll', handleFirstScroll)
      clearTimeout(fallbackTimer)
    }
  }, [gsapModules])

  useEffect(() => {
    if (animationsInitialized.current || typeof window === 'undefined' || !gsapModules) return

    const { gsap, ScrollTrigger } = gsapModules

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
  }, [gsapModules])

  return { 
    refreshScrollTrigger: () => {
      try {
        if (gsapModules?.ScrollTrigger) {
          gsapModules.ScrollTrigger.refresh()
        }
      } catch (error) {
        console.error('Erreur refresh ScrollTrigger:', error)
      }
    },
    isGSAPLoaded: !!gsapModules
  }
}
