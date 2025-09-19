"use client"

import { useBreakpointValue, useMediaQuery } from '@chakra-ui/react'
import { createContext, useContext, useState, useEffect, useMemo } from 'react'

// Types pour la gestion responsive
export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenSize: 'mobile' | 'tablet' | 'desktop'
}

export interface ResponsiveConfig {
  device: DeviceInfo
  animations: 'minimal' | 'full'
  imageQuality: number
  lazyThreshold: string
}

// 🌐 TYPES UNIVERSELS (APPROCHE GÉANT TECH)
export interface UniversalViewport {
  width: number
  height: number
  aspectRatio: number
  devicePixelRatio: number
}

export interface UniversalCapabilities {
  touch: boolean
  hover: boolean
  motion: boolean
  highRes: boolean
  connection: string
  colorScheme: 'light' | 'dark'
}

export interface UniversalContext {
  viewport: UniversalViewport
  capabilities: UniversalCapabilities
  deviceType: 'compact' | 'medium' | 'standard' | 'large' | 'ultrawide'
  layoutMode: 'mobile' | 'tablet' | 'desktop' | 'ultrawide'
  interactionMode: 'touch' | 'mouse' | 'hybrid'
}

// Hook principal pour détecter le device
export const useDeviceDetection = (): DeviceInfo => {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false }) ?? false
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false

  const screenSize = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize
  }
}

// Hook pour la configuration responsive
export const useResponsiveConfig = (device: DeviceInfo): ResponsiveConfig => {
  return {
    device,
    animations: device.isMobile ? 'minimal' : 'full',
    imageQuality: device.isMobile ? 75 : 90,
    lazyThreshold: device.isMobile ? '50px' : '100px'
  }
}

// 🌐 HOOK UNIVERSEL (APPROCHE GÉANT TECH)
export const useUniversalResponsive = (): UniversalContext => {
  const [viewport, setViewport] = useState<UniversalViewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    aspectRatio: typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  })

  const capabilities = useMemo<UniversalCapabilities>(() => ({
    touch: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
    hover: typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true,
    motion: typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true,
    highRes: typeof window !== 'undefined' ? window.devicePixelRatio > 1 : false,
    connection: typeof window !== 'undefined' && 'connection' in navigator 
      ? (navigator as any).connection?.effectiveType || '4g' 
      : '4g',
    colorScheme: typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : 'light'
  }), [])

  // Classification intelligente du device (comme Apple/Tesla)
  const deviceType = useMemo<UniversalContext['deviceType']>(() => {
    const { width, aspectRatio } = viewport
    
    if (width < 480) return 'compact'
    if (width < 768) return 'medium'
    if (aspectRatio > 2.1) return 'ultrawide'
    if (width > 1920) return 'large'
    return 'standard'
  }, [viewport])

  // Mode de layout adaptatif
  const layoutMode = useMemo<UniversalContext['layoutMode']>(() => {
    const { width, aspectRatio } = viewport
    
    if (width < 768) return 'mobile'
    if (width < 1024 && aspectRatio < 1.3) return 'tablet'
    if (aspectRatio > 2.1) return 'ultrawide'
    return 'desktop'
  }, [viewport])

  // Mode d'interaction
  const interactionMode = useMemo<UniversalContext['interactionMode']>(() => {
    if (capabilities.touch && !capabilities.hover) return 'touch'
    if (!capabilities.touch && capabilities.hover) return 'mouse'
    return 'hybrid'
  }, [capabilities])

  // Mise à jour du viewport
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  return {
    viewport,
    capabilities,
    deviceType,
    layoutMode,
    interactionMode
  }
}

// Hook combiné pour faciliter l'usage (ÉTENDU AVEC UNIVERSEL)
export const useResponsive = () => {
  const device = useDeviceDetection()
  const config = useResponsiveConfig(device)
  const universal = useUniversalResponsive()
  
  return {
    // ✅ API EXISTANTE (100% COMPATIBLE)
    ...device,
    config,
    showMobileVersion: device.isMobile,
    showDesktopVersion: !device.isMobile,
    animationsEnabled: config.animations === 'full',
    
    // ➕ API UNIVERSELLE (NOUVELLE)
    universal,
    
    // 🎯 HELPERS UNIVERSELS
    isCompact: universal.viewport.width < 480,
    isMedium: universal.viewport.width >= 480 && universal.viewport.width < 768,
    isStandard: universal.viewport.width >= 768 && universal.viewport.width <= 1920,
    isLarge: universal.viewport.width > 1920,
    isUltrawide: universal.viewport.aspectRatio > 2.1,
    isTall: universal.viewport.aspectRatio < 0.8,
    
    // 🎮 CAPACITÉS
    supportsHover: universal.capabilities.hover,
    supportsTouch: universal.capabilities.touch,
    prefersMotion: universal.capabilities.motion,
    isHighRes: universal.capabilities.highRes,
    isDarkMode: universal.capabilities.colorScheme === 'dark',
    
    // 📱 MODES
    isTouchDevice: universal.interactionMode === 'touch',
    isMouseDevice: universal.interactionMode === 'mouse',
    isHybridDevice: universal.interactionMode === 'hybrid'
  }
}

// Context pour partager les infos responsive
export const ResponsiveContext = createContext<ResponsiveConfig | null>(null)

export const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext)
  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveProvider')
  }
  return context
}
