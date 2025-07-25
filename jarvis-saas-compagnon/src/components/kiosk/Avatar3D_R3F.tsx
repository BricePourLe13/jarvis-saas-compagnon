"use client"
import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Environment, 
  OrbitControls, 
  shaderMaterial, 
  useTexture,
  Sphere,
  PerformanceMonitor
} from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useVoiceVisualSync } from '@/hooks/useVoiceVisualSync'

// 🌟 DÉCLARATIONS TYPESCRIPT POUR MATÉRIAUX PERSONNALISÉS
declare global {
  namespace JSX {
    interface IntrinsicElements {
      marbleShaderMaterial: {
        ref?: React.Ref<any>
        time?: number
        emotion?: THREE.Vector3
        intensity?: number
        noiseScale?: number
        marbleFlow?: THREE.Vector3
        iridescence?: number
        transparency?: number
        refractionRatio?: number
        chromaticAberration?: number
        caustics?: number
        transparent?: boolean
        side?: THREE.Side
      }
    }
  }
}

// 🎨 CUSTOM SHADERS POUR EFFETS MARBRÉS AVANCÉS
const MarbleShaderMaterial = shaderMaterial(
  {
    time: 0,
    emotion: new THREE.Vector3(0.2, 0.6, 1.0), // RGB de l'émotion
    intensity: 0.5,
    noiseScale: 1.0,
    marbleFlow: new THREE.Vector3(1.0, 0.5, 0.3),
    iridescence: 0.8,
    transparency: 0.15,
    refractionRatio: 0.98,
    chromaticAberration: 0.02,
    caustics: 0.4
  },
  // Vertex Shader - Géométrie de base
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vViewDirection = normalize(cameraPosition - worldPosition.xyz);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader - Rendu photoréaliste
  `
    uniform float time;
    uniform vec3 emotion;
    uniform float intensity;
    uniform float noiseScale;
    uniform vec3 marbleFlow;
    uniform float iridescence;
    uniform float transparency;
    uniform float refractionRatio;
    uniform float chromaticAberration;
    uniform float caustics;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    
    // 🌊 BRUIT PERLIN 3D POUR MARBRURES NATURELLES
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    // 🎨 GÉNÉRATION MARBRURES ÉMOTIONNELLES
    vec3 generateMarblePattern(vec3 pos, float t) {
      vec3 flowPos = pos * noiseScale + marbleFlow * t * 0.1;
      
      // Couches de bruit pour effet marbré complexe
      float noise1 = snoise(flowPos * 2.0 + t * 0.5);
      float noise2 = snoise(flowPos * 4.0 - t * 0.3) * 0.5;
      float noise3 = snoise(flowPos * 8.0 + t * 0.7) * 0.25;
      
      float marbleNoise = noise1 + noise2 + noise3;
      
      // Couleurs émotionnelles dynamiques
      vec3 color1 = emotion;
      vec3 color2 = mix(emotion, vec3(1.0), 0.3);
      vec3 color3 = mix(emotion, vec3(0.8, 0.9, 1.0), 0.5);
      
      // Mélange basé sur le bruit
      vec3 marbleColor = mix(color1, color2, smoothstep(-0.5, 0.5, marbleNoise));
      marbleColor = mix(marbleColor, color3, smoothstep(0.2, 0.8, abs(marbleNoise)));
      
      return marbleColor * intensity;
    }
    
    // ✨ EFFET IRIDESCENCE (CHANGEMENT DE COULEUR SELON L'ANGLE)
    vec3 getIridescence(vec3 normal, vec3 viewDir) {
      float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
      
      // Spectre iridescent
      vec3 iridColor = vec3(
        sin(fresnel * 6.28 + time * 2.0) * 0.5 + 0.5,
        sin(fresnel * 6.28 + time * 2.0 + 2.09) * 0.5 + 0.5,
        sin(fresnel * 6.28 + time * 2.0 + 4.18) * 0.5 + 0.5
      );
      
      return iridColor * iridescence * fresnel;
    }
    
    // 🌊 CAUSTICS AQUATIQUES
    vec3 getCaustics(vec3 worldPos, float t) {
      vec2 causticsUV = worldPos.xz * 0.5;
      
      float caustic1 = sin(causticsUV.x * 10.0 + t * 3.0) * sin(causticsUV.y * 10.0 + t * 2.0);
      float caustic2 = sin(causticsUV.x * 15.0 - t * 2.5) * sin(causticsUV.y * 15.0 + t * 3.5);
      
      float causticsPattern = max(0.0, caustic1 * caustic2) * caustics;
      
      return vec3(causticsPattern) * 0.3;
    }
    
    void main() {
      // 🔮 POSITION & NORMALES
      vec3 worldPos = vWorldPosition;
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDirection);
      
      // 🎨 GÉNÉRATION MARBRURES
      vec3 marbleColor = generateMarblePattern(vPosition, time);
      
      // ✨ IRIDESCENCE
      vec3 iridColor = getIridescence(normal, viewDir);
      
      // 🌊 CAUSTICS
      vec3 causticsColor = getCaustics(worldPos, time);
      
      // 🔍 FRESNEL & RÉFLEXION
      float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
      fresnel = pow(fresnel, 2.0);
      
      // 🎯 COMPOSITION FINALE
      vec3 finalColor = marbleColor + iridColor + causticsColor;
      finalColor = mix(finalColor, vec3(1.0), fresnel * 0.3);
      
      // 💎 TRANSPARENCE DYNAMIQUE
      float alpha = transparency + fresnel * 0.4;
      alpha = clamp(alpha, 0.1, 0.95);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

// Étendre R3F avec notre shader
extend({ MarbleShaderMaterial })

// Interface pour TypeScript
interface Avatar3DProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'
  size?: number
  className?: string
}

// 🔮 COMPOSANT SPHÈRE 3D PHOTORÉALISTE
function Avatar3DSphere({ status }: { status: Avatar3DProps['status'] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  
  // 🎭 SYNCHRONISATION ÉMOTIONNELLE
  const voiceSync = useVoiceVisualSync()
  
  // 🎨 MAPPINGS ÉMOTIONS → COULEURS
  const getEmotionalColors = useCallback((status: string) => {
    switch (status) {
      case 'listening': 
        return { emotion: [0.13, 0.77, 0.37], intensity: 0.8, flow: [1.2, 0.6, 0.4] } // Vert émeraude
      case 'speaking': 
        return { emotion: [0.23, 0.51, 0.96], intensity: 0.9, flow: [0.8, 1.4, 0.7] } // Bleu océan
      case 'thinking': 
        return { emotion: [0.65, 0.36, 0.96], intensity: 0.7, flow: [0.5, 0.8, 1.2] } // Violet mystique
      case 'connecting': 
        return { emotion: [0.96, 0.62, 0.07], intensity: 0.8, flow: [1.5, 0.7, 0.9] } // Orange doré
      default: // idle
        return { emotion: [0.23, 0.51, 0.96], intensity: 0.6, flow: [1.0, 0.5, 0.3] } // Bleu paisible
    }
  }, [])
  
  // 🔄 ANIMATION FRAME
  useFrame((state) => {
    if (materialRef.current) {
      const colors = getEmotionalColors(status)
      
      // Mise à jour des uniforms
      materialRef.current.time = state.clock.getElapsedTime()
      materialRef.current.emotion = new THREE.Vector3(...colors.emotion)
      materialRef.current.intensity = colors.intensity
      materialRef.current.marbleFlow = new THREE.Vector3(...colors.flow)
      
      // Animation selon le statut
      if (status === 'speaking') {
        materialRef.current.caustics = 0.6 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2
        materialRef.current.iridescence = 0.9
      } else if (status === 'listening') {
        materialRef.current.transparency = 0.12 + Math.sin(state.clock.getElapsedTime() * 2) * 0.03
      } else if (status === 'thinking') {
        materialRef.current.noiseScale = 1.0 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.2
      }
    }
    
    // Animation de la géométrie
    if (meshRef.current) {
      // Rotation lente continue
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.x += 0.001
      
      // Pulsation selon l'état
      const pulse = status === 'speaking' ? 1 + Math.sin(state.clock.getElapsedTime() * 6) * 0.03 : 
                   status === 'listening' ? 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.01 :
                   1 + Math.sin(state.clock.getElapsedTime() * 1) * 0.005
      
      meshRef.current.scale.setScalar(pulse)
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* 🔮 GÉOMÉTRIE ICOSAÈDRE POUR SPHÈRE PARFAITE */}
      <icosahedronGeometry args={[1, 12]} />
      
      {/* 🎨 MATÉRIAU SHADER CUSTOM */}
      {React.createElement('marbleShaderMaterial', {
        ref: materialRef,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })}
    </mesh>
  )
}

// ⭐ SYSTÈME PARTICULES 3D VOLUMÉTRIQUES
function CosmicParticles({ count = 2000 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  
  // Génération positions aléatoires dans une sphère
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Distribution dans une sphère de rayon variable
      const radius = Math.random() * 8 + 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return positions
  }, [count])
  
  // Couleurs aléatoires cosmiques
  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3)
    const cosmicColors = [
      [0.59, 0.82, 0.99], // Bleu ciel
      [0.92, 0.71, 0.99], // Rose lavande
      [0.99, 0.84, 0.30], // Doré
      [0.65, 0.99, 0.81], // Vert menthe
      [0.99, 0.65, 0.65], // Rose corail
    ]
    
    for (let i = 0; i < count; i++) {
      const color = cosmicColors[Math.floor(Math.random() * cosmicColors.length)]
      colors[i * 3] = color[0]
      colors[i * 3 + 1] = color[1]
      colors[i * 3 + 2] = color[2]
    }
    
    return colors
  }, [count])
  
  // Animation des particules
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0005
      points.current.rotation.x += 0.0003
      
      // Pulsation globale
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
      points.current.scale.setScalar(scale)
    }
  })
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// 💫 ENVIRONNEMENT HDR & ÉCLAIRAGE
function SceneEnvironment() {
  return (
    <>
      {/* 🌟 ÉCLAIRAGE HDR ENVIRONNEMENTAL */}
      <Environment preset="studio" environmentIntensity={0.6} />
      
      {/* ✨ ÉCLAIRAGES DIRECTIONNELS */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.3}
        color="#ffffff"
        castShadow
      />
      
      <directionalLight
        position={[-5, -5, -2]}
        intensity={0.2}
        color="#6366f1"
      />
      
      {/* 🔆 LUMIÈRE AMBIANTE DOUCE */}
      <ambientLight intensity={0.1} color="#e0e7ff" />
      
      {/* 🌟 ÉCLAIRAGE DE RIM */}
      <spotLight
        position={[0, 0, 8]}
        intensity={0.4}
        color="#8b5cf6"
        angle={Math.PI / 6}
        penumbra={0.5}
      />
    </>
  )
}

// 🎯 COMPOSANT PRINCIPAL AVATAR 3D
export default function Avatar3D_R3F({ status, size = 450, className }: Avatar3DProps) {
  const [dpr, setDpr] = useState(1.5)
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high')
  
  // 📊 MONITORING PERFORMANCE
  const handlePerformanceChange = useCallback((api: any) => {
    const averageFrameTime = api.averageFrameTime || 16 // Fallback à 60 FPS
    if (averageFrameTime > 32) { // < 30 FPS
      setPerformanceMode('low')
      setDpr(1)
    } else if (averageFrameTime > 20) { // < 50 FPS
      setPerformanceMode('medium')
      setDpr(1.2)
    } else {
      setPerformanceMode('high')
      setDpr(1.5)
    }
  }, [])
  
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
      >
        {/* 📊 MONITORING PERFORMANCE */}
        <PerformanceMonitor onIncline={handlePerformanceChange} />
        
        {/* 🌌 ENVIRONNEMENT & ÉCLAIRAGE */}
        <SceneEnvironment />
        
        {/* 🔮 SPHÈRE AVATAR PRINCIPALE */}
        <Avatar3DSphere status={status} />
        
        {/* ⭐ PARTICULES COSMIQUES */}
        {performanceMode !== 'low' && (
          <CosmicParticles count={performanceMode === 'high' ? 2000 : 1000} />
        )}
        
        {/* 🎮 CONTRÔLES (MASQUÉS) - Pour debug seulement */}
        {process.env.NODE_ENV === 'development' && (
          <OrbitControls enableZoom={false} enablePan={false} />
        )}
      </Canvas>
    </motion.div>
  )
} 