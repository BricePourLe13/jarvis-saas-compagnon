import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import { AlertCircle, TrendingUp, Users, Brain } from 'lucide-react'

async function getUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component, ignore
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.role) {
    redirect('/login')
  }

  return { user, profile }
}

export default async function InsightsPage() {
  const { profile } = await getUser()

  const placeholderFeatures = [
    {
      icon: AlertCircle,
      title: 'Détection Churn',
      description: 'Identification automatique des adhérents à risque 60 jours avant',
      status: 'En développement',
    },
    {
      icon: TrendingUp,
      title: 'Analyses Prédictives',
      description: 'Prédiction de tendances et recommandations personnalisées par IA',
      status: 'Planifié',
    },
    {
      icon: Users,
      title: 'Satisfaction Membres',
      description: 'Analyse sentiment et NPS automatique depuis conversations JARVIS',
      status: 'Planifié',
    },
    {
      icon: Brain,
      title: 'Insights ML',
      description: 'Modèles machine learning pour optimiser opérations et rétention',
      status: 'Recherche',
    },
  ]

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Insights & Analytics"
        description="Intelligence artificielle et analytics prédictifs pour votre salle"
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Module IA en développement
                </h3>
                <p className="text-sm text-blue-700">
                  Les insights alimentés par intelligence artificielle seront progressivement
                  déployés dans les prochaines semaines. Vous serez notifié lors de chaque
                  nouvelle fonctionnalité disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {placeholderFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white border border-border rounded-lg p-6 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">
                          {feature.title}
                        </h3>
                        <span className="badge-info text-xs">
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

