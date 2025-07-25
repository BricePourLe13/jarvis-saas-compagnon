"use client"
import React, { useRef, useMemo, useEffect, useState, useCallback, Suspense } from 'react'
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
      glassMarbleShaderMaterial: {
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
        roughness?: number
        metalness?: number
        transmission?: number
        thickness?: number
        clearcoat?: number
        clearcoatRoughness?: number
        ior?: number
        transparent?: boolean
        side?: THREE.Side
      }
    }
  }
}

// 🎨 SHADER MATÉRIAU VERRE TRANSLUCIDE PHOTORÉALISTE
const GlassMarbleShaderMaterial = shaderMaterial(
  {
    time: 0,
    emotion: new THREE.Vector3(0.2, 0.6, 1.0),
    intensity: 0.5,
    noiseScale: 1.0,
    marbleFlow: new THREE.Vector3(1.0, 0.5, 0.3),
    iridescence: 0.8,
    transparency: 0.15,
    refractionRatio: 0.98,
    chromaticAberration: 0.02,
    caustics: 0.4,
    roughness: 0.1,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 0.5,
    envMapIntensity: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  },
  // Vertex Shader avec déformations subtiles
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying vec3 vReflect;
    varying vec3 vRefract;
    
    uniform float time;
    uniform float noiseScale;
    
    // Bruit pour déformations organiques
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    }
    
    void main() {
      vUv = uv;
      
      // Déformation subtile de la géométrie
      vec3 pos = position;
      float displacement = noise(pos * noiseScale + time * 0.1) * 0.02;
      pos += normal * displacement;
      
      vPosition = pos;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;
      vViewDirection = normalize(cameraPosition - worldPosition.xyz);
      
      // Calculs réflexion/réfraction pour le verre
      vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
      vReflect = reflect(-vViewDirection, worldNormal);
      vRefract = refract(-vViewDirection, worldNormal, 0.75);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader photoréaliste avec PBR
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
    uniform float roughness;
    uniform float metalness;
    uniform float transmission;
    uniform float thickness;
    uniform float envMapIntensity;
    uniform float clearcoat;
    uniform float clearcoatRoughness;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying vec3 vReflect;
    varying vec3 vRefract;
    
    // Bruit Perlin 3D optimisé
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
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
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
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    // Marbrures 3D fluides
    vec3 generateFluidMarble(vec3 pos, float t) {
      vec3 flowPos = pos * noiseScale + marbleFlow * t * 0.1;
      
      float noise1 = snoise(flowPos * 2.0 + t * 0.5);
      float noise2 = snoise(flowPos * 4.0 - t * 0.3) * 0.5;
      float noise3 = snoise(flowPos * 8.0 + t * 0.7) * 0.25;
      float noise4 = snoise(flowPos * 16.0 + t * 1.0) * 0.125;
      
      float marbleNoise = noise1 + noise2 + noise3 + noise4;
      
      // Palette émotionnelle étendue
      vec3 color1 = emotion;
      vec3 color2 = mix(emotion, vec3(1.0, 0.95, 0.9), 0.4);
      vec3 color3 = mix(emotion, vec3(0.9, 0.95, 1.0), 0.6);
      vec3 color4 = mix(emotion, vec3(1.0, 0.9, 0.95), 0.3);
      
      vec3 marbleColor = mix(color1, color2, smoothstep(-0.8, 0.8, marbleNoise));
      marbleColor = mix(marbleColor, color3, smoothstep(0.0, 1.0, abs(marbleNoise)));
      marbleColor = mix(marbleColor, color4, smoothstep(0.5, 1.0, marbleNoise * marbleNoise));
      
      return marbleColor * intensity;
    }
    
    // Iridescence avancée avec spectre complet
    vec3 getAdvancedIridescence(vec3 normal, vec3 viewDir) {
      float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
      fresnel = pow(fresnel, 1.5);
      
      // Spectre iridescent complet
      vec3 iridColor = vec3(
        sin(fresnel * 8.0 + time * 3.0) * 0.5 + 0.5,
        sin(fresnel * 8.0 + time * 3.0 + 2.094) * 0.5 + 0.5,
        sin(fresnel * 8.0 + time * 3.0 + 4.188) * 0.5 + 0.5
      );
      
      // Modulation par le bruit pour effet naturel
      float iridNoise = snoise(vWorldPosition * 5.0 + time * 0.5) * 0.3 + 0.7;
      
      return iridColor * iridescence * fresnel * iridNoise;
    }
    
    // Caustics 3D volumétriques
    vec3 getVolumetricCaustics(vec3 worldPos, float t) {
      vec3 causticsPos = worldPos * 0.8;
      
      float caustic1 = sin(causticsPos.x * 12.0 + t * 4.0) * sin(causticsPos.y * 12.0 + t * 3.0);
      float caustic2 = sin(causticsPos.y * 8.0 - t * 3.5) * sin(causticsPos.z * 8.0 + t * 4.5);
      float caustic3 = sin(causticsPos.z * 10.0 + t * 2.5) * sin(causticsPos.x * 10.0 - t * 3.0);
      
      float causticsPattern = max(0.0, caustic1 * caustic2 * caustic3) * caustics;
      
      return vec3(causticsPattern) * 0.4;
    }
    
    // Aberration chromatique
    vec3 getChromaticAberration(vec3 baseColor, vec3 normal, vec3 viewDir) {
      float fresnel = 1.0 - dot(normal, viewDir);
      
      vec3 aberration = vec3(
        baseColor.r * (1.0 + chromaticAberration * fresnel),
        baseColor.g,
        baseColor.b * (1.0 - chromaticAberration * fresnel)
      );
      
      return aberration;
    }
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDirection);
      
      // Génération marbrures fluides
      vec3 marbleColor = generateFluidMarble(vPosition, time);
      
      // Iridescence avancée
      vec3 iridColor = getAdvancedIridescence(normal, viewDir);
      
      // Caustics volumétriques
      vec3 causticsColor = getVolumetricCaustics(vWorldPosition, time);
      
      // Fresnel pour réflexions
      float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
      fresnel = pow(fresnel, 2.0);
      
      // Simulation réflexions environnementales
      vec3 envReflection = vec3(0.8, 0.9, 1.0) * fresnel * envMapIntensity;
      
      // Composition des couleurs
      vec3 finalColor = marbleColor + iridColor + causticsColor + envReflection;
      
      // Aberration chromatique
      finalColor = getChromaticAberration(finalColor, normal, viewDir);
      
      // Ajustement clearcoat
      finalColor = mix(finalColor, vec3(1.0), clearcoat * fresnel * 0.2);
      
      // Transparence dynamique avec transmission
      float alpha = transmission * (transparency + fresnel * 0.6);
      alpha = clamp(alpha, 0.05, 0.98);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ GlassMarbleShaderMaterial })

interface Avatar3DProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'
  size?: number
  className?: string
}

// 🔮 SPHÈRE VERRE PHOTORÉALISTE
function PhotorealisticGlassSphere({ status }: { status: Avatar3DProps['status'] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  
  const voiceSync = useVoiceVisualSync()
  
  // Palettes émotionnelles sophistiquées
  const getEmotionalPalette = useCallback((status: string) => {
    switch (status) {
      case 'listening': 
        return { 
          emotion: [0.1, 0.8, 0.4], // Vert émeraude vif
          intensity: 0.85, 
          flow: [1.3, 0.7, 0.5],
          caustics: 0.7,
          iridescence: 0.6
        }
      case 'speaking': 
        return { 
          emotion: [0.2, 0.5, 1.0], // Bleu océan profond
          intensity: 0.95, 
          flow: [0.9, 1.5, 0.8],
          caustics: 0.8,
          iridescence: 0.9
        }
      case 'thinking': 
        return { 
          emotion: [0.7, 0.3, 1.0], // Violet mystique
          intensity: 0.75, 
          flow: [0.6, 0.9, 1.4],
          caustics: 0.5,
          iridescence: 0.8
        }
      case 'connecting': 
        return { 
          emotion: [1.0, 0.6, 0.1], // Orange doré électrique
          intensity: 0.9, 
          flow: [1.6, 0.8, 1.0],
          caustics: 0.9,
          iridescence: 0.7
        }
      default: // idle
        return { 
          emotion: [0.3, 0.6, 1.0], // Bleu serein
          intensity: 0.65, 
          flow: [1.0, 0.6, 0.4],
          caustics: 0.4,
          iridescence: 0.5
        }
    }
  }, [])
  
  useFrame((state) => {
    if (materialRef.current) {
      const palette = getEmotionalPalette(status)
      
      // Mise à jour en temps réel
      materialRef.current.time = state.clock.getElapsedTime()
      materialRef.current.emotion = new THREE.Vector3(...palette.emotion)
      materialRef.current.intensity = palette.intensity
      materialRef.current.marbleFlow = new THREE.Vector3(...palette.flow)
      materialRef.current.caustics = palette.caustics
      materialRef.current.iridescence = palette.iridescence
      
      // Animations spécifiques par état
      const time = state.clock.getElapsedTime()
      
      if (status === 'speaking') {
        materialRef.current.chromaticAberration = 0.03 + Math.sin(time * 8) * 0.01
        materialRef.current.transmission = 0.95 + Math.sin(time * 6) * 0.05
      } else if (status === 'listening') {
        materialRef.current.transparency = 0.1 + Math.sin(time * 3) * 0.02
        materialRef.current.envMapIntensity = 1.5 + Math.sin(time * 2) * 0.3
      } else if (status === 'thinking') {
        materialRef.current.noiseScale = 1.2 + Math.sin(time * 1.5) * 0.3
        materialRef.current.clearcoat = 1.0 + Math.sin(time * 2.5) * 0.2
      }
    }
    
    if (meshRef.current) {
      // Rotations organiques
      meshRef.current.rotation.y += 0.003
      meshRef.current.rotation.x += 0.002
      meshRef.current.rotation.z += 0.001
      
      // Pulsations émotionnelles
      const time = state.clock.getElapsedTime()
      const basePulse = 1 + Math.sin(time * 1.2) * 0.008
      
      const statusPulse = {
        speaking: 1 + Math.sin(time * 8) * 0.04,
        listening: 1 + Math.sin(time * 4) * 0.02,
        thinking: 1 + Math.sin(time * 2) * 0.015,
        connecting: 1 + Math.sin(time * 6) * 0.03,
        idle: basePulse
      }[status] || basePulse
      
      meshRef.current.scale.setScalar(statusPulse)
      
      // Floating motion
      meshRef.current.position.y = Math.sin(time * 0.8) * 0.05
      meshRef.current.position.x = Math.cos(time * 0.6) * 0.02
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1, 16]} />
      {React.createElement('glassMarbleShaderMaterial', {
        ref: materialRef,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending
      })}
    </mesh>
  )
}

// ⭐ PARTICULES GALACTIQUES AVANCÉES
function AdvancedCosmicParticles({ count = 3000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    const cosmicPalette = [
      [0.6, 0.8, 1.0],   // Bleu stellaire
      [1.0, 0.9, 0.7],   // Blanc doré
      [0.9, 0.7, 1.0],   // Lavande
      [0.7, 1.0, 0.8],   // Vert néon
      [1.0, 0.7, 0.8],   // Rose cosmique
      [0.8, 0.9, 1.0],   // Bleu glacier
    ]
    
    for (let i = 0; i < count; i++) {
      // Distribution sphérique naturelle
      const radius = Math.pow(Math.random(), 0.5) * 12 + 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) 
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Couleurs cosmiques
      const colorIndex = Math.floor(Math.random() * cosmicPalette.length)
      const color = cosmicPalette[colorIndex]
      colors[i * 3] = color[0]
      colors[i * 3 + 1] = color[1] 
      colors[i * 3 + 2] = color[2]
      
      // Tailles variées
      sizes[i] = Math.random() * 0.04 + 0.01
    }
    
    return { positions, colors, sizes }
  }, [count])
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime()
      
      // Rotation galactique lente
      pointsRef.current.rotation.y += 0.0008
      pointsRef.current.rotation.x += 0.0005
      
      // Pulsation cosmique
      const scale = 1 + Math.sin(time * 0.8) * 0.15
      pointsRef.current.scale.setScalar(scale)
      
      // Animation des positions pour effet de vie
      if (geometryRef.current) {
        const positions = geometryRef.current.attributes.position.array as Float32Array
        
        for (let i = 0; i < count; i++) {
          const offset = i * 3
          const originalRadius = Math.sqrt(
            Math.pow(positions[offset], 2) + 
            Math.pow(positions[offset + 1], 2) + 
            Math.pow(positions[offset + 2], 2)
          )
          
          // Oscillation radiale subtile
          const radiusVariation = 1 + Math.sin(time * 0.5 + i * 0.01) * 0.02
          const factor = (originalRadius * radiusVariation) / originalRadius
          
          positions[offset] *= factor
          positions[offset + 1] *= factor  
          positions[offset + 2] *= factor
        }
        
        geometryRef.current.attributes.position.needsUpdate = true
      }
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
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
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        size={1}
      />
    </points>
  )
}

// 🎬 POST-PROCESSING CINÉMATOGRAPHIQUE
// TODO: Installer @react-three/postprocessing pour activer ces effets
function CinematicPostProcessing() {
  return null // Temporairement désactivé en attendant @react-three/postprocessing
  
  /* 
  return (
    <EffectComposer multisampling={8}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.8}
        height={300}
        opacity={0.8}
      />
      
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={3}
        height={480}
      />
      
      <ToneMapping
        adaptive={true}
        resolution={256}
        middleGrey={0.6}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
      
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.2}
      />
      
      <Noise
        opacity={0.015}
        premultiply={false}
      />
    </EffectComposer>
  )
  */
}

// 🌌 ÉCLAIRAGE CINÉMATOGRAPHIQUE
function CinematicLighting() {
  return (
    <>
      <Environment preset="apartment" environmentIntensity={0.8} />
      
      {/* Éclairage principal - key light */}
      <directionalLight
        position={[8, 8, 5]}
        intensity={0.4}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Éclairage de remplissage - fill light */}
      <directionalLight
        position={[-5, 3, -3]}
        intensity={0.15}
        color="#6366f1"
      />
      
      {/* Éclairage de contour - rim light */}
      <spotLight
        position={[0, 0, 10]}
        intensity={0.6}
        color="#8b5cf6"
        angle={Math.PI / 4}
        penumbra={0.3}
        decay={2}
        distance={20}
      />
      
      {/* Lumière d'ambiance colorée */}
      <ambientLight intensity={0.08} color="#e0e7ff" />
      
      {/* Lumières d'accent colorées */}
      <pointLight position={[5, -5, 2]} intensity={0.3} color="#ec4899" distance={15} />
      <pointLight position={[-5, 5, -2]} intensity={0.25} color="#06d6a0" distance={12} />
    </>
  )
}

// Composant de chargement
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#4f46e5" opacity={0.3} transparent />
    </mesh>
  )
}

// 🎯 COMPOSANT PRINCIPAL ENHANCED
export default function Avatar3D_R3F_Enhanced({ status, size = 450, className }: Avatar3DProps) {
  const [dpr, setDpr] = useState(2)
  const [performanceMode, setPerformanceMode] = useState<'ultra' | 'high' | 'medium' | 'low'>('ultra')
  
  const handlePerformanceChange = useCallback((api: any) => {
    const averageFrameTime = api.averageFrameTime || 16 // Fallback à 60 FPS
    if (averageFrameTime > 50) { // < 20 FPS
      setPerformanceMode('low')
      setDpr(0.8)
    } else if (averageFrameTime > 33) { // < 30 FPS
      setPerformanceMode('medium')
      setDpr(1)
    } else if (averageFrameTime > 20) { // < 50 FPS
      setPerformanceMode('high')
      setDpr(1.5)
    } else {
      setPerformanceMode('ultra')
      setDpr(2)
    }
  }, [])
  
  const particleCount = {
    ultra: 3000,
    high: 2000,
    medium: 1000,
    low: 500
  }[performanceMode]
  
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Canvas
        dpr={dpr}
        camera={{ 
          position: [0, 0, 4], 
          fov: 35,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        style={{ background: 'transparent' }}
        shadows={performanceMode === 'ultra' || performanceMode === 'high'}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Monitoring performance */}
          <PerformanceMonitor onIncline={handlePerformanceChange} />
          
          {/* Éclairage cinématographique */}
          <CinematicLighting />
          
          {/* Sphère avatar principale */}
          <PhotorealisticGlassSphere status={status} />
          
          {/* Particules cosmiques */}
          <AdvancedCosmicParticles count={particleCount} />
          
          {/* Post-processing si performance suffisante */}
          {(performanceMode === 'ultra' || performanceMode === 'high') && (
            <CinematicPostProcessing />
          )}
          
          {/* Contrôles debug */}
          {process.env.NODE_ENV === 'development' && (
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={2 * Math.PI / 3}
            />
          )}
        </Suspense>
      </Canvas>
      
      {/* Indicateur de performance */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {performanceMode.toUpperCase()} | DPR: {dpr}
        </div>
      )}
    </motion.div>
  )
} 