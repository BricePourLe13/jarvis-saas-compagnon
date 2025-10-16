'use client';

import { useEffect, useState } from 'react';

interface Avatar3DOptimizedProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting' | 'contextual';
  size?: number;
  className?: string;
  currentSection?: 'hero' | 'social-proof' | 'solutions' | 'benefits';
}

export default function Avatar3DOptimized({ 
  status, 
  size = 480, 
  className = '',
  currentSection = 'hero' 
}: Avatar3DOptimizedProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className={`relative ${className}`}
        style={{ width: size, height: size }}
        suppressHydrationWarning
      />
    );
  }

  // ✅ Couleurs MONOCHROME blanc/gris/noir avec teinte bleue ULTRA-SUBTILE
  const getColors = () => {
    switch (status) {
      case 'listening': 
        return { primary: '#e2e8f0', secondary: '#cbd5e1', accent: '#94a3b8' }; // Gris clair → moyen (écoute active)
      case 'speaking': 
        return { primary: '#f1f5f9', secondary: '#e2e8f0', accent: '#cbd5e1' }; // Presque blanc → gris clair (parle)
      case 'thinking': 
        return { primary: '#cbd5e1', secondary: '#94a3b8', accent: '#64748b' }; // Gris moyen → foncé (réfléchit)
      case 'connecting': 
        return { primary: '#94a3b8', secondary: '#64748b', accent: '#475569' }; // Gris foncé (connexion)
      default: 
        return { primary: '#e2e8f0', secondary: '#cbd5e1', accent: '#94a3b8' }; // Gris clair par défaut
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      suppressHydrationWarning
    >
      <style jsx>{`
        @keyframes sphere-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${status === 'speaking' ? '1.05' : '1.02'}); }
        }

        @keyframes sphere-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes eye-blink {
          0%, 90%, 100% { height: 20%; }
          95% { height: 2%; }
        }

        @keyframes gradient-shift {
          0%, 100% { stop-color: ${colors.primary}; }
          33% { stop-color: ${colors.secondary}; }
          66% { stop-color: ${colors.accent}; }
        }

        .sphere-container {
          animation: sphere-pulse ${status === 'speaking' ? '0.8s' : '4s'} ease-in-out infinite;
          will-change: transform;
        }

        .sphere-rotate {
          animation: sphere-rotate 20s linear infinite;
        }

        .eye {
          animation: eye-blink 4s ease-in-out infinite;
        }

        .gradient-animated stop:nth-child(1) {
          animation: gradient-shift 8s ease-in-out infinite;
        }

        .gradient-animated stop:nth-child(2) {
          animation: gradient-shift 8s ease-in-out infinite 2.6s;
        }

        .gradient-animated stop:nth-child(3) {
          animation: gradient-shift 8s ease-in-out infinite 5.3s;
        }
      `}</style>

      <svg 
        viewBox="0 0 200 200" 
        className="sphere-container"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Gradient radial pour la sphère */}
          <radialGradient id={`sphere-gradient-${status}`} className="gradient-animated">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.accent} stopOpacity="0.5" />
          </radialGradient>

          {/* Filtre de lueur (RÉDUIT) */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Reflet brillant (RÉDUIT) */}
          <radialGradient id="shine">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="50%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo extérieur */}
        {status !== 'idle' && (
          <circle 
            cx="100" 
            cy="100" 
            r="90" 
            fill="none"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.3"
            className="sphere-rotate"
          />
        )}

        {/* Sphère principale */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill={`url(#sphere-gradient-${status})`}
          filter="url(#glow)"
          style={{
            mixBlendMode: 'normal'
          }}
        />

        {/* Reflet de brillance */}
        <ellipse 
          cx="80" 
          cy="70" 
          rx="30" 
          ry="40" 
          fill="url(#shine)"
          opacity="0.6"
          style={{
            transform: 'rotate(-25deg)',
            transformOrigin: '80px 70px'
          }}
        />

        {/* Yeux */}
        <g className="eyes">
          {/* Œil gauche */}
          <rect 
            x="72" 
            y="90" 
            width="6" 
            height="20" 
            rx="2" 
            fill="white"
            className="eye"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
            }}
          />
          
          {/* Œil droit */}
          <rect 
            x="122" 
            y="90" 
            width="6" 
            height="20" 
            rx="2" 
            fill="white"
            className="eye"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
              animationDelay: '0.1s'
            }}
          />
        </g>

        {/* Particules décoratives (optionnel) */}
        {[
          { cx: 40, cy: 50, r: 1.5, delay: 0 },
          { cx: 160, cy: 60, r: 1, delay: 1.5 },
          { cx: 50, cy: 150, r: 1.2, delay: 3 },
          { cx: 150, cy: 140, r: 1, delay: 4.5 }
        ].map((particle, i) => (
          <circle
            key={i}
            cx={particle.cx}
            cy={particle.cy}
            r={particle.r}
            fill={colors.accent}
            opacity="0.6"
            style={{
              animation: `sphere-pulse 5s ease-in-out infinite ${particle.delay}s`
            }}
          />
        ))}
      </svg>
    </div>
  );
}

