import React from 'react';
import { Box } from '@chakra-ui/react';

export interface SilkCSSProps {
  speed?: number;
  color?: string;
  opacity?: number;
}

const SilkCSS: React.FC<SilkCSSProps> = ({ 
  speed = 20,        // Durée animation en secondes
  color = '#0f0f23', // Couleur de base
  opacity = 0.8      // Opacité globale
}) => {
  return (
    <>
      {/* CSS ANIMATION KEYFRAMES */}
      <style jsx>{`
        @keyframes silkFlow {
          0%, 100% {
            background-position: 0% 0%, 100% 100%, 50% 50%;
            transform: translateY(0px) scale(1);
          }
          25% {
            background-position: 100% 20%, 0% 80%, 80% 20%;
            transform: translateY(-10px) scale(1.02);
          }
          50% {
            background-position: 50% 100%, 50% 0%, 0% 100%;
            transform: translateY(5px) scale(0.98);
          }
          75% {
            background-position: 0% 80%, 100% 20%, 20% 80%;
            transform: translateY(-5px) scale(1.01);
          }
        }
        
        @keyframes silkPattern {
          0%, 100% {
            opacity: ${opacity};
            filter: hue-rotate(0deg) brightness(1);
          }
          33% {
            opacity: ${opacity * 0.8};
            filter: hue-rotate(10deg) brightness(1.1);
          }
          66% {
            opacity: ${opacity * 1.1};
            filter: hue-rotate(-5deg) brightness(0.9);
          }
        }

        .silk-background {
          background: 
            radial-gradient(circle at 20% 30%, ${color}40 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, ${color}30 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, ${color}20 0%, transparent 70%),
            linear-gradient(135deg, ${color}15 0%, ${color}25 30%, ${color}10 60%, ${color}20 100%);
          background-size: 400% 400%, 300% 300%, 500% 500%, 100% 100%;
          animation: 
            silkFlow ${speed}s ease-in-out infinite,
            silkPattern ${speed * 1.5}s ease-in-out infinite;
          will-change: transform, background-position, opacity;
        }

        /* PERFORMANCE: Réduire animations sur devices faibles */
        @media (prefers-reduced-motion: reduce) {
          .silk-background {
            animation: none;
            background: linear-gradient(135deg, ${color}20 0%, ${color}30 50%, ${color}15 100%);
          }
        }

        /* MOBILE: Animations plus légères */
        @media (max-width: 768px) {
          .silk-background {
            animation-duration: ${speed * 1.5}s;
            background-size: 200% 200%, 150% 150%, 250% 250%, 100% 100%;
          }
        }
      `}</style>

      {/* CONTAINER PRINCIPAL */}
      <Box
        className="silk-background"
        position="absolute"
        inset={0}
        width="100%"
        height="100%"
        overflow="hidden"
        pointerEvents="none"
      />

      {/* OVERLAY SUBTLE POUR TEXTURE */}
      <Box
        position="absolute"
        inset={0}
        width="100%"
        height="100%"
        background={`
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            ${color}08 2px,
            ${color}08 4px
          )
        `}
        opacity={0.3}
        pointerEvents="none"
        style={{
          backgroundSize: '20px 20px',
          animation: `silkPattern ${speed * 2}s linear infinite reverse`
        }}
      />
    </>
  );
};

export default SilkCSS;

