'use client'

import { useEffect, useRef } from 'react'

interface Avatar3DProps {
  isListening?: boolean
  isSpeaking?: boolean
  size?: number
  status?: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'
  currentSection?: string
  eyeScale?: number
}

/**
 * Composant Avatar 3D pour JARVIS
 * Sphère animée avec Canvas pour une belle animation fluide
 */
export default function Avatar3D({ 
  isListening: propIsListening = false, 
  isSpeaking: propIsSpeaking = false,
  size = 200,
  status,
  currentSection,
  eyeScale
}: Avatar3DProps) {
  // Convertir le status en isListening/isSpeaking si fourni
  const isListening = status === 'listening' || propIsListening
  const isSpeaking = status === 'speaking' || propIsSpeaking
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const animate = () => {
      time += 0.02
      
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Dessiner la sphère principale
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const baseRadius = size / 2 - 20
      
      // Animation pulsation selon le statut
      let radiusModifier = 0
      if (status === 'connecting') {
        radiusModifier = Math.sin(time * 2) * 8 // Pulsation douce pour connecting
      } else if (isListening || isSpeaking) {
        radiusModifier = Math.sin(time * 3) * 10 // Pulsation plus rapide
      } else {
        // Pulsation plus visible au repos avec variation douce
        radiusModifier = Math.sin(time * 1.2) * 6 + Math.sin(time * 0.7) * 2
      }
      const radius = baseRadius + radiusModifier
      
      // Gradient radial avec effets améliorés
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.2,
        centerX, centerY, radius * 1.2
      )
      
      if (isSpeaking) {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)') // Bleu brillant quand parle
        gradient.addColorStop(0.4, 'rgba(37, 99, 235, 0.6)')
        gradient.addColorStop(0.7, 'rgba(29, 78, 216, 0.3)')
        gradient.addColorStop(1, 'rgba(29, 78, 216, 0.05)')
      } else if (isListening) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)') // Vert brillant quand écoute
        gradient.addColorStop(0.4, 'rgba(22, 163, 74, 0.6)')
        gradient.addColorStop(0.7, 'rgba(21, 128, 61, 0.3)')
        gradient.addColorStop(1, 'rgba(21, 128, 61, 0.05)')
      } else if (status === 'connecting') {
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)') // Jaune/Orange pour connecting
        gradient.addColorStop(0.4, 'rgba(245, 158, 11, 0.5)')
        gradient.addColorStop(0.7, 'rgba(217, 119, 6, 0.3)')
        gradient.addColorStop(1, 'rgba(217, 119, 6, 0.05)')
      } else {
        // Gradient violet amélioré avec variation subtile de couleur au repos
        const purpleVariation = Math.sin(time * 0.8) * 0.15
        const r1 = Math.max(120, Math.min(170, 147 + purpleVariation * 25))
        const b1 = Math.max(200, Math.min(255, 234 + purpleVariation * 35))
        const r2 = Math.max(100, Math.min(140, 126 + purpleVariation * 20))
        const b2 = Math.max(180, Math.min(230, 206 + purpleVariation * 25))
        const r3 = Math.max(90, Math.min(120, 107 + purpleVariation * 15))
        const b3 = Math.max(150, Math.min(190, 168 + purpleVariation * 20))
        const r4 = Math.max(95, Math.min(115, 107 + purpleVariation * 10))
        const b4 = Math.max(155, Math.min(180, 168 + purpleVariation * 15))
        
        gradient.addColorStop(0, `rgba(${r1}, 51, ${b1}, 0.85)`) // Violet brillant
        gradient.addColorStop(0.3, `rgba(${r2}, 34, ${b2}, 0.65)`)
        gradient.addColorStop(0.6, `rgba(${r3}, 33, ${b3}, 0.4)`)
        gradient.addColorStop(1, `rgba(${r4}, 33, ${b4}, 0.08)`)
      }
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Cercles orbitaux animés - toujours visibles mais plus subtils au repos
      const isActive = isListening || isSpeaking || status === 'connecting'
      const numOrbits = status === 'connecting' ? 2 : (isActive ? 3 : 2) // 2 orbites au repos, 3 actives
      
      for (let i = 0; i < numOrbits; i++) {
        const orbitRadius = radius + 25 + i * 18
        // Alpha plus faible au repos
        const baseAlpha = isActive ? 0.4 : 0.15
        const orbitAlpha = baseAlpha - i * (isActive ? 0.12 : 0.05)
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${orbitAlpha})`
        ctx.lineWidth = isActive ? 2 : 1.5
        ctx.beginPath()
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
        ctx.stroke()
        
        // Points orbitaux animés - vitesse plus lente au repos
        const speed = status === 'connecting' ? 0.8 : (isActive ? (1 + i * 0.5) : (0.3 + i * 0.2))
        const angle = time * speed
        const pointX = centerX + Math.cos(angle) * orbitRadius
        const pointY = centerY + Math.sin(angle) * orbitRadius
        
        ctx.fillStyle = `rgba(255, 255, 255, ${orbitAlpha + (isActive ? 0.4 : 0.2)})`
        ctx.beginPath()
        ctx.arc(pointX, pointY, isActive ? 5 : 3, 0, Math.PI * 2)
        ctx.fill()
        
        // Second point pour créer un effet de rotation plus fluide
        if (i === 0 || (!isActive && i === 1)) {
          const angle2 = angle + Math.PI
          const pointX2 = centerX + Math.cos(angle2) * orbitRadius
          const pointY2 = centerY + Math.sin(angle2) * orbitRadius
          ctx.fillStyle = `rgba(255, 255, 255, ${orbitAlpha + (isActive ? 0.2 : 0.1)})`
          ctx.beginPath()
          ctx.arc(pointX2, pointY2, isActive ? 3 : 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      
      // Effet de brillance subtil sur la sphère principale - toujours présent mais plus visible quand actif
      const shineSpeed = isActive ? 2 : 1.2
      const shineIntensity = isActive ? 0.4 : 0.25
      const shineAngle = time * shineSpeed
      const shineX = centerX + Math.cos(shineAngle) * (radius * 0.4)
      const shineY = centerY + Math.sin(shineAngle) * (radius * 0.4)
      const shineGradient = ctx.createRadialGradient(
        shineX, shineY, 0,
        shineX, shineY, radius * 0.3
      )
      shineGradient.addColorStop(0, `rgba(255, 255, 255, ${shineIntensity})`)
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = shineGradient
      ctx.beginPath()
      ctx.arc(shineX, shineY, radius * 0.3, 0, Math.PI * 2)
      ctx.fill()
      
      // Petites particules flottantes autour de la sphère au repos
      if (!isActive) {
        for (let i = 0; i < 4; i++) {
          const particleAngle = time * 0.5 + (i * Math.PI / 2)
          const particleRadius = radius + 35 + Math.sin(time * 0.8 + i) * 5
          const particleX = centerX + Math.cos(particleAngle) * particleRadius
          const particleY = centerY + Math.sin(particleAngle) * particleRadius
          const particleAlpha = 0.3 + Math.sin(time * 1.5 + i) * 0.2
          
          ctx.fillStyle = `rgba(147, 51, 234, ${particleAlpha})`
          ctx.beginPath()
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isListening, isSpeaking, size, status])

  return (
    <div 
      style={{ 
        width: size, 
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas 
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          filter: isListening || isSpeaking 
            ? 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.6))' 
            : status === 'connecting'
            ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))'
            : 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.4)) drop-shadow(0 0 40px rgba(147, 51, 234, 0.15))',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  )
}



