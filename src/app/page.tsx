import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'JARVIS Console',
  description: 'Espace SaaS sécurisé JARVIS (dashboard, kiosks, outils IA).',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePage() {
  redirect('/login')
}
