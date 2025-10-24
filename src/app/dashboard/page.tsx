/**
 * 🏠 DASHBOARD PRINCIPAL UNIFIÉ
 * Point d'entrée unique avec vue adaptée au rôle utilisateur
 * REDIRECTION VERS NOUVEAU DASHBOARD V2 (OVERVIEW)
 */

import { redirect } from 'next/navigation'

export default function DashboardRedirect() {
  // Redirection côté serveur (évite les problèmes de state client-side)
  redirect('/dashboard/overview')
}