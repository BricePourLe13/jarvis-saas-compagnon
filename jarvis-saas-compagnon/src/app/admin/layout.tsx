import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin JARVIS',
  description: 'Administration de la plateforme JARVIS',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 