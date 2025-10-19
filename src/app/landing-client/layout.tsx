import { Metadata } from 'next'

// Structured Data pour SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'JARVIS',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    description: 'Programme pilote gratuit - 5 places exclusives',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '12',
  },
  description: 'IA conversationnelle pour salles de sport. Réduit le churn de 30% et augmente la satisfaction de 40%.',
  operatingSystem: 'Web',
  softwareVersion: '1.0',
  author: {
    '@type': 'Organization',
    name: 'JARVIS Group',
    url: 'https://jarvis-group.net',
  },
}

export const metadata: Metadata = {
  title: 'JARVIS - Démo IA Conversationnelle | Salles de Sport',
  description: 'Testez JARVIS en 3 minutes. IA vocale révolutionnaire pour salles de sport. Détection churn, analytics IA, automatisation.',
}

export default function LandingClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  )
}




