"use client";
import React from "react";
import { motion } from "framer-motion";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = "",
  children,
  showRadialGradient = true,
}) => {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(40deg, #040317 0%, #0a0a1e 25%, #1a1a2e 50%, #16213e 75%, #0f1829 100%)",
      }}
    >
      {/* AURORA LAYERS */}
      <div className="absolute inset-0">
        {/* Aurora Layer 1 */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(600px circle at 0% 0%, #3b82f6 0%, transparent 50%)",
              "radial-gradient(600px circle at 100% 100%, #8b5cf6 0%, transparent 50%)",
              "radial-gradient(600px circle at 50% 0%, #06b6d4 0%, transparent 50%)",
              "radial-gradient(600px circle at 0% 100%, #ec4899 0%, transparent 50%)",
              "radial-gradient(600px circle at 0% 0%, #3b82f6 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Aurora Layer 2 */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(800px circle at 100% 0%, #10b981 0%, transparent 60%)",
              "radial-gradient(800px circle at 0% 100%, #f59e0b 0%, transparent 60%)",
              "radial-gradient(800px circle at 100% 100%, #ef4444 0%, transparent 60%)",
              "radial-gradient(800px circle at 0% 0%, #8b5cf6 0%, transparent 60%)",
              "radial-gradient(800px circle at 100% 0%, #10b981 0%, transparent 60%)",
            ],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Aurora Layer 3 - Subtle */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              "radial-gradient(1000px circle at 50% 50%, #06b6d4 0%, transparent 70%)",
              "radial-gradient(1000px circle at 20% 80%, #3b82f6 0%, transparent 70%)",
              "radial-gradient(1000px circle at 80% 20%, #ec4899 0%, transparent 70%)",
              "radial-gradient(1000px circle at 50% 50%, #06b6d4 0%, transparent 70%)",
            ],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Radial Gradient Overlay */}
        {showRadialGradient && (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `
                radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)
              `,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AuroraBackground;


