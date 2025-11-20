import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JARVIS Kiosk',
  description: 'Interface vocale JARVIS pour salles de sport',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
  },
  other: {
    'Permissions-Policy': 'microphone=(self), camera=(self), display-capture=(self), autoplay=(self), encrypted-media=(self), fullscreen=(self), picture-in-picture=(self)',
  },
}

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

