/**
 * 🏗️ LAYOUT DASHBOARD V2 - CONTEXT-AWARE
 * Layout unifié avec Context Provider et navigation adaptative
 * Design aligné avec landing page (background noir, effets spatiaux)
 */

'use client'

import { ReactNode } from 'react'
import { GymContextProvider } from '@/contexts/GymContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { StarsBackground } from '@/components/ui/stars-background'
import { ShootingStars } from '@/components/ui/shooting-stars'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <GymContextProvider>
      <div className="relative min-h-screen bg-black">
        {/* Effets de fond (comme landing page) */}
        <div className="fixed inset-0 z-0">
          <StarsBackground 
            starDensity={0.0003}
            allStarsTwinkle={true}
            twinkleProbability={0.7}
            minTwinkleSpeed={0.5}
            maxTwinkleSpeed={1}
          />
          <ShootingStars 
            minSpeed={10}
            maxSpeed={30}
            minDelay={1200}
            maxDelay={4200}
            starColor="#8b5cf6"
            trailColor="#a78bfa"
            starWidth={10}
            starHeight={1}
          />
        </div>

        {/* Dashboard Shell avec backdrop */}
        <div className="relative z-10">
          <DashboardShell>{children}</DashboardShell>
        </div>
      </div>
    </GymContextProvider>
  )
}
