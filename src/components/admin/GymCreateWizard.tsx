'use client'

import { useState } from 'react'
import { X, Building2, User, Monitor, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

type WizardStep = 'gym_info' | 'manager' | 'kiosk' | 'summary'

interface GymFormData {
  // Step 1: Gym Info
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  opening_hours: string

  // Step 2: Manager
  manager_option: 'new' | 'existing'
  manager_email: string
  manager_name: string
  manager_phone: string
  existing_manager_id: string

  // Step 3: Kiosk
  kiosk_count: number
  kiosk_position: string
  jarvis_voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
}

interface GymCreateWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function GymCreateWizard({ isOpen, onClose, onSuccess }: GymCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('gym_info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<GymFormData>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    opening_hours: '',
    manager_option: 'new',
    manager_email: '',
    manager_name: '',
    manager_phone: '',
    existing_manager_id: '',
    kiosk_count: 1,
    kiosk_position: 'Entrée principale',
    jarvis_voice: 'shimmer'
  })

  if (!isOpen) return null

  const steps: { id: WizardStep; title: string; icon: any }[] = [
    { id: 'gym_info', title: 'Informations Salle', icon: Building2 },
    { id: 'manager', title: 'Gérant', icon: User },
    { id: 'kiosk', title: 'Configuration Kiosk', icon: Monitor },
    { id: 'summary', title: 'Récapitulatif', icon: Check }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/admin/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'gym_info':
        return formData.name && formData.address && formData.city && formData.postal_code
      case 'manager':
        if (formData.manager_option === 'new') {
          return formData.manager_email && formData.manager_name
        } else {
          return formData.existing_manager_id
        }
      case 'kiosk':
        return formData.kiosk_count > 0
      case 'summary':
        return true
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Créer une nouvelle salle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all
                      ${isActive ? 'bg-primary border-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-muted border-border text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`
                      text-sm font-medium hidden md:block
                      ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Gym Info */}
          {currentStep === 'gym_info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nom de la salle *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: FitGym Paris 15"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="12 rue de la République"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Paris"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="75015"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email contact
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@fitgym-paris15.fr"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 2: Manager */}
          {currentStep === 'manager' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData({ ...formData, manager_option: 'new' })}
                  className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                    formData.manager_option === 'new'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground mb-1">Inviter nouveau gérant</div>
                  <div className="text-sm text-muted-foreground">
                    Envoyer une invitation par email
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, manager_option: 'existing' })}
                  className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                    formData.manager_option === 'existing'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground mb-1">Gérant existant</div>
                  <div className="text-sm text-muted-foreground">
                    Assigner un gérant déjà inscrit
                  </div>
                </button>
              </div>

              {formData.manager_option === 'new' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email du gérant *
                    </label>
                    <input
                      type="email"
                      value={formData.manager_email}
                      onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                      placeholder="gerant@example.com"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.manager_name}
                      onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.manager_phone}
                      onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                    💡 Un email d'invitation sera automatiquement envoyé au gérant avec un lien pour créer son compte.
                  </div>
                </div>
              )}

              {formData.manager_option === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sélectionner un gérant
                  </label>
                  <select
                    value={formData.existing_manager_id}
                    onChange={(e) => setFormData({ ...formData, existing_manager_id: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Sélectionner --</option>
                    {/* TODO: Charger liste gérants dynamiquement */}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Kiosk */}
          {currentStep === 'kiosk' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre de kiosks
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.kiosk_count}
                  onChange={(e) => setFormData({ ...formData, kiosk_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Position du kiosk principal
                </label>
                <select
                  value={formData.kiosk_position}
                  onChange={(e) => setFormData({ ...formData, kiosk_position: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Entrée principale">Entrée principale</option>
                  <option value="Vestiaires">Vestiaires</option>
                  <option value="Zone cardio">Zone cardio</option>
                  <option value="Zone musculation">Zone musculation</option>
                  <option value="Accueil">Accueil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Voix de JARVIS
                </label>
                <select
                  value={formData.jarvis_voice}
                  onChange={(e) => setFormData({ ...formData, jarvis_voice: e.target.value as any })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="alloy">Alloy (Neutre)</option>
                  <option value="echo">Echo (Masculin)</option>
                  <option value="fable">Fable (Britannique)</option>
                  <option value="onyx">Onyx (Profond)</option>
                  <option value="nova">Nova (Féminin)</option>
                  <option value="shimmer">Shimmer (Doux) - Recommandé</option>
                </select>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                ✅ Les codes de provisioning seront générés automatiquement et envoyés au gérant par email.
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 'summary' && (
            <div className="space-y-6">
              <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Informations Salle</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="text-foreground font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span className="text-foreground">{formData.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ville:</span>
                      <span className="text-foreground">{formData.city} {formData.postal_code}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-3">Gérant</h3>
                  <div className="space-y-2 text-sm">
                    {formData.manager_option === 'new' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground">Nouveau gérant (invitation)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="text-foreground">{formData.manager_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nom:</span>
                          <span className="text-foreground">{formData.manager_name}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="text-foreground">Gérant existant</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-3">Configuration Kiosk</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="text-foreground">{formData.kiosk_count} kiosk(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="text-foreground">{formData.kiosk_position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voix JARVIS:</span>
                      <span className="text-foreground capitalize">{formData.jarvis_voice}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400">
                ⚠️ Une fois créée, la salle sera immédiatement activée et le gérant recevra ses accès par email.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          {currentStep !== 'summary' ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Créer la salle
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

