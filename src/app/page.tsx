import { Metadata } from 'next'
import { redirect } from 'next/navigation'

// SEO Metadata
export const metadata: Metadata = {
  title: 'JARVIS - IA Conversationnelle pour Salles de Sport | Réduisez le Churn de 30%',
  description: 'JARVIS transforme vos salles de sport avec une IA conversationnelle révolutionnaire. Détection churn 60j avant, +40% satisfaction, 70% questions automatisées. Programme pilote gratuit - 5 places.',
  keywords: 'IA salle de sport, assistant virtuel fitness, churn prédiction, analytics gym, JARVIS, OpenAI gym',
  authors: [{ name: 'JARVIS Group' }],
  creator: 'JARVIS Group',
  publisher: 'JARVIS Group',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://jarvis-group.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'JARVIS - IA Conversationnelle pour Salles de Sport',
    description: 'Réduisez le churn de 30% et augmentez la satisfaction de 40% avec JARVIS, l\'IA conversationnelle pour salles de sport.',
    url: 'https://jarvis-group.net',
    siteName: 'JARVIS Group',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JARVIS - IA pour Salles de Sport',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JARVIS - IA Conversationnelle pour Salles de Sport',
    description: 'Réduisez le churn de 30% avec JARVIS. Programme pilote gratuit.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Static generation avec revalidation
export const revalidate = 3600 // 1 heure

export default function HomePage() {
  // Redirection vers login (landing séparé dans repo dédié)
  redirect('/login')
}
