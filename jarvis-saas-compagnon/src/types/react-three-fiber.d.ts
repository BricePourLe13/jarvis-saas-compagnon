/**
 * 🎨 DÉCLARATIONS TYPESCRIPT POUR REACT THREE FIBER
 * Extension des types JSX pour nos matériaux de shaders personnalisés
 */

import * as THREE from 'three'

// 🌟 Extension de JSX.IntrinsicElements pour nos matériaux personnalisés
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

export {} 