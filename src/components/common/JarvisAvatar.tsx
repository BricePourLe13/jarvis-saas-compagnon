'use client'

import { motion } from 'framer-motion'
import Avatar3D from '@/components/kiosk/Avatar3D'

interface JarvisAvatarProps {
  size?: number
  showText?: boolean
  title?: string
  description?: string
  variant?: 'default' | 'compact' | 'minimal'
  status?: 'idle' | 'listening' | 'speaking' | 'thinking'
  eyeScale?: number
}

const JarvisAvatar = ({ 
  size = 200, 
  showText = true, 
  title = "Intelligence Platform",
  description = "Analyse conversationnelle et insights analytiques pour salles de sport",
  variant = 'default',
  status = 'idle',
  eyeScale = 1
}: JarvisAvatarProps) => {
  
  // Animations selon la variante
  const getAnimationProps = () => {
    switch (variant) {
      case 'compact':
        return {
          animate: {
            y: [-3, 3, -3],
            rotateY: [0, 0.5, 0],
          },
          transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'minimal':
        return {
          animate: {
            scale: [1, 1.02, 1],
          },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      default:
        return {
          animate: {
            y: [-6, 6, -6],
            rotateY: [0, 1, 0],
          },
          transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
    }
  }

  const animationProps = getAnimationProps()

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className={`flex flex-col items-center ${variant === 'minimal' ? 'gap-4' : 'gap-8'}`}>
        {/* Avatar JARVIS avec animation */}
        <div className="relative">
          <motion.div {...animationProps}>
            <Avatar3D 
              status={status}
              size={size}
              eyeScale={eyeScale}
            />
          </motion.div>
        </div>
        
        {/* Texte descriptif optionnel */}
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className={`flex flex-col items-center text-center ${variant === 'minimal' ? 'gap-2' : 'gap-3'}`}>
              <h3 className={`font-bold text-gray-700 ${variant === 'minimal' ? 'text-lg' : 'text-2xl'}`}>
                {title}
              </h3>
              {description && variant !== 'minimal' && (
                <p 
                  className={`text-gray-500 font-medium ${variant === 'compact' ? 'text-base max-w-[250px]' : 'text-lg max-w-[350px]'}`}
                >
                  {description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default JarvisAvatar