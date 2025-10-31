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
 * Sphère minimaliste translucide avec deux lignes verticales (style logo)
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
      time += 0.01
      
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = size / 2 - 10
      
      // Dessiner l'ombre portée très douce (bas-droite)
      const shadowOffset = 2
      const shadowBlur = 15
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetX = shadowOffset
      ctx.shadowOffsetY = shadowOffset
      
      // Sphère principale - gradient translucide blanc/bleu-vert très pâle
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3, // Source lumière haut-gauche
        centerY - radius * 0.3,
        radius * 0.1,
        centerX, centerY, radius
      )
      
      // Couleur de base : blanc très doux avec léger bleu-vert menthe au centre
      // Variation subtile selon le statut
      if (isSpeaking) {
        // Léger bleu quand parle
        gradient.addColorStop(0, 'rgba(220, 245, 255, 0.7)') // Bleu très pâle au centre
        gradient.addColorStop(0.4, 'rgba(240, 250, 255, 0.5)')
        gradient.addColorStop(0.7, 'rgba(250, 252, 255, 0.3)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
      } else if (isListening) {
        // Léger vert menthe quand écoute
        gradient.addColorStop(0, 'rgba(220, 255, 240, 0.7)') // Vert menthe très pâle
        gradient.addColorStop(0.4, 'rgba(240, 255, 250, 0.5)')
        gradient.addColorStop(0.7, 'rgba(250, 255, 252, 0.3)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
      } else {
        // Couleur par défaut : blanc avec léger bleu-vert menthe au centre
        const mintVariation = Math.sin(time * 0.5) * 0.05
        gradient.addColorStop(0, `rgba(${230 + mintVariation * 10}, ${245 + mintVariation * 5}, ${255 + mintVariation * 10}, 0.75)`)
        gradient.addColorStop(0.3, `rgba(${240 + mintVariation * 5}, ${250 + mintVariation * 3}, 255, 0.6)`)
        gradient.addColorStop(0.6, `rgba(${248 + mintVariation * 2}, ${252 + mintVariation * 2}, 255, 0.4)`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)')
      }
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Réinitialiser l'ombre pour les autres éléments
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Anneau extérieur très fin (blanc/gris très clair)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2)
      ctx.stroke()
      
      // Effet de brillance/highlight (haut-gauche)
      const shineAngle = Math.PI / 4 // 45 degrés (haut-gauche)
      const shineDistance = radius * 0.35
      const shineX = centerX - Math.cos(shineAngle) * shineDistance
      const shineY = centerY - Math.sin(shineAngle) * shineDistance
      
      const shineGradient = ctx.createRadialGradient(
        shineX, shineY, 0,
        shineX, shineY, radius * 0.4
      )
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)')
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = shineGradient
      ctx.beginPath()
      ctx.arc(shineX, shineY, radius * 0.4, 0, Math.PI * 2)
      ctx.fill()
      
      // Deux lignes verticales blanches au centre (symbole pause) avec extrémités arrondies
      const lineWidth = 4
      const lineHeight = radius * 0.3
      const lineSpacing = 6
      const lineY = centerY - lineHeight / 2
      const lineRadius = lineWidth / 2
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      
      // Fonction pour dessiner un rectangle arrondi
      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
      }
      
      // Ligne gauche avec extrémités arrondies
      const leftLineX = centerX - lineSpacing / 2 - lineWidth
      drawRoundedRect(leftLineX, lineY, lineWidth, lineHeight, lineRadius)
      
      // Ligne droite avec extrémités arrondies
      const rightLineX = centerX + lineSpacing / 2
      drawRoundedRect(rightLineX, lineY, lineWidth, lineHeight, lineRadius)
      
      // Animation subtile : légère pulsation si actif (les lignes sont déjà dessinées au-dessus)
      // L'animation est déjà appliquée via le redessin continu du canvas
      
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
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))',
        }}
      />
    </div>
  )
}
