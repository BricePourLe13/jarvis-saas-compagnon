'use client'

import { useEffect, useRef } from 'react'

interface Avatar3DProps {
  isListening?: boolean
  isSpeaking?: boolean
  size?: number
}

/**
 * Composant Avatar 3D pour JARVIS
 * TODO: Implémenter la vraie sphère 3D avec Three.js ou similaire
 * Pour l'instant, placeholder avec animation CSS
 */
export default function Avatar3D({ 
  isListening = false, 
  isSpeaking = false,
  size = 200 
}: Avatar3DProps) {
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
      
      // Animation pulsation si isListening ou isSpeaking
      const radiusModifier = isListening || isSpeaking ? Math.sin(time * 3) * 10 : 0
      const radius = baseRadius + radiusModifier
      
      // Gradient radial
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.3,
        centerX, centerY, radius
      )
      
      if (isSpeaking) {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)') // Bleu quand parle
        gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.5)')
        gradient.addColorStop(1, 'rgba(29, 78, 216, 0.1)')
      } else if (isListening) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)') // Vert quand écoute
        gradient.addColorStop(0.5, 'rgba(22, 163, 74, 0.5)')
        gradient.addColorStop(1, 'rgba(21, 128, 61, 0.1)')
      } else {
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.6)') // Violet par défaut
        gradient.addColorStop(0.5, 'rgba(126, 34, 206, 0.4)')
        gradient.addColorStop(1, 'rgba(107, 33, 168, 0.1)')
      }
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Cercles orbitaux
      if (isListening || isSpeaking) {
        for (let i = 0; i < 3; i++) {
          const orbitRadius = radius + 20 + i * 15
          const orbitAlpha = 0.3 - i * 0.1
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${orbitAlpha})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
          ctx.stroke()
          
          // Points orbitaux
          const angle = time * (1 + i * 0.5)
          const pointX = centerX + Math.cos(angle) * orbitRadius
          const pointY = centerY + Math.sin(angle) * orbitRadius
          
          ctx.fillStyle = `rgba(255, 255, 255, ${orbitAlpha + 0.3})`
          ctx.beginPath()
          ctx.arc(pointX, pointY, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isListening, isSpeaking, size])

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
          filter: isListening || isSpeaking ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' : 'none',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  )
}

