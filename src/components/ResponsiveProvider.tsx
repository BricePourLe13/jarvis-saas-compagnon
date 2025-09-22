"use client"

import React from 'react'
import { ResponsiveContext, useDeviceDetection, useResponsiveConfig } from '@/hooks/useResponsive'

interface ResponsiveProviderProps {
  children: React.ReactNode
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const device = useDeviceDetection()
  const config = useResponsiveConfig(device)

  return (
    <ResponsiveContext.Provider value={config}>
      {children}
    </ResponsiveContext.Provider>
  )
}


