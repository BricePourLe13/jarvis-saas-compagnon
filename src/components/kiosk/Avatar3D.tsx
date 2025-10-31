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
        radiusModifier = Math.sin(time * 0.5) * 3 // Très légère pulsation au repos
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
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.7)') // Violet par défaut
        gradient.addColorStop(0.4, 'rgba(126, 34, 206, 0.5)')
        gradient.addColorStop(0.7, 'rgba(107, 33, 168, 0.3)')
        gradient.addColorStop(1, 'rgba(107, 33, 168, 0.05)')
      }
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Cercles orbitaux animés
      if (isListening || isSpeaking || status === 'connecting') {
        const numOrbits = status === 'connecting' ? 2 : 3
        for (let i = 0; i < numOrbits; i++) {
          const orbitRadius = radius + 25 + i * 18
          const orbitAlpha = 0.4 - i * 0.12
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${orbitAlpha})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
          ctx.stroke()
          
          // Points orbitaux animés
          const speed = status === 'connecting' ? 0.8 : (1 + i * 0.5)
          const angle = time * speed
          const pointX = centerX + Math.cos(angle) * orbitRadius
          const pointY = centerY + Math.sin(angle) * orbitRadius
          
          ctx.fillStyle = `rgba(255, 255, 255, ${orbitAlpha + 0.4})`
          ctx.beginPath()
          ctx.arc(pointX, pointY, 5, 0, Math.PI * 2)
          ctx.fill()
          
          // Second point pour créer un effet de rotation plus fluide
          if (i === 0) {
            const angle2 = angle + Math.PI
            const pointX2 = centerX + Math.cos(angle2) * orbitRadius
            const pointY2 = centerY + Math.sin(angle2) * orbitRadius
            ctx.fillStyle = `rgba(255, 255, 255, ${orbitAlpha + 0.2})`
            ctx.beginPath()
            ctx.arc(pointX2, pointY2, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      
      // Effet de brillance subtil sur la sphère principale
      if (status !== 'idle') {
        const shineAngle = time * 2
        const shineX = centerX + Math.cos(shineAngle) * (radius * 0.4)
        const shineY = centerY + Math.sin(shineAngle) * (radius * 0.4)
        const shineGradient = ctx.createRadialGradient(
          shineX, shineY, 0,
          shineX, shineY, radius * 0.3
        )
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = shineGradient
        ctx.beginPath()
        ctx.arc(shineX, shineY, radius * 0.3, 0, Math.PI * 2)
        ctx.fill()
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
            : 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.3))',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  )
}



