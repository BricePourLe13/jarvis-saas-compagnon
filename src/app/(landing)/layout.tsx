import React from 'react'

// Force SSR and disable prerender/caching for the landing segment to avoid
// Next.js clientReferenceManifest copy issues on Vercel.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function LandingSegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}


