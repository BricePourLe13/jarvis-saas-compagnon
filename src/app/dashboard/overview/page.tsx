'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MetricCard } from '@/components/dashboard-v2/MetricCard'
import { AlertCard } from '@/components/dashboard-v2/AlertCard'
import { Users, Activity, DollarSign, TrendingUp, AlertTriangle, UserPlus } from 'lucide-react'

/**
 * PAGE OVERVIEW - Dashboard principal
 * Vue d'ensemble d'une salle
 */

export default function OverviewPage() {
  // TODO: Récupérer les vraies données via secure-queries
  
  const metrics = [
    {
      label: 'Membres actifs',
      value: 245,
      icon: Users,
      iconColor: 'primary' as const,
      trend: { value: '+12%', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Sessions ce mois',
      value: 1234,
      icon: Activity,
      iconColor: 'success' as const,
      trend: { value: '+8%', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Revenus mensuels',
      value: '32 450€',
      icon: DollarSign,
      iconColor: 'success' as const,
      trend: { value: '+5%', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Taux de rétention',
      value: '94%',
      icon: TrendingUp,
      iconColor: 'info' as const,
      trend: { value: '-2%', direction: 'down' as const, isPositive: false },
      badge: { label: 'Attention', variant: 'warning' as const },
    },
  ]
  
  const alerts = [
    {
      priority: 'urgent' as const,
      title: '5 membres à risque de churn élevé',
      description: 'Détection automatique basée sur la baisse de fréquentation (>50% vs mois dernier)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
      actions: [
        { label: 'Voir détails', onClick: () => console.log('Voir'), variant: 'primary' as const },
        { label: 'Créer mission', onClick: () => console.log('Créer'), variant: 'secondary' as const },
      ],
    },
    {
      priority: 'warning' as const,
      title: '12 membres inactifs depuis 7 jours',
      description: 'Aucune visite enregistrée la semaine dernière',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
      actions: [
        { label: 'Envoyer rappel', onClick: () => console.log('Rappel') },
      ],
    },
    {
      priority: 'info' as const,
      title: 'Pic de fréquentation prévu demain 18h',
      description: 'Basé sur l\'historique des dernières semaines',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
    },
  ]
  
  return (
    <DashboardShell
      user={{
        name: 'Brice Pradet',
        email: 'brice@jarvis.com',
        role: 'Super Admin',
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vue d'ensemble
        </h1>
        <p className="text-gray-600">
          PowerGym Lyon - Performance en temps réel
        </p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      
      {/* Alerts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Alertes prioritaires
          </h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir tout →
          </button>
        </div>
        
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <AlertCard key={index} {...alert} />
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Inviter un staff</p>
              <p className="text-sm text-gray-500">Gérer l'équipe</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Générer rapport</p>
              <p className="text-sm text-gray-500">Hebdomadaire</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Créer mission</p>
              <p className="text-sm text-gray-500">Suivi membre</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}

