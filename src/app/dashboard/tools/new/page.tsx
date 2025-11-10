/**
 * Dashboard: Create New Custom Tool
 * Formulaire en 3 étapes pour créer un tool personnalisé
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGymContext } from '@/contexts/GymContext'
import type { CustomToolFormData, ToolType, ToolCategory } from '@/types/custom-tools'
import { validateCustomTool } from '@/lib/custom-tools/validators'
import { TOOL_TEMPLATES, getTemplateById, applyTemplate } from '@/lib/custom-tools/templates'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'

// Steps components
import { Step1BasicInfo } from '@/components/dashboard/tools/Step1BasicInfo'
import { Step2Configuration } from '@/components/dashboard/tools/Step2Configuration'
import { Step3TestActivate } from '@/components/dashboard/tools/Step3TestActivate'

export default function NewToolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentGym } = useGymContext()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [toolData, setToolData] = useState<Partial<CustomToolFormData>>({
    type: 'api_rest',
    category: 'action',
    icon: '🔧',
    parameters: [],
    auth_type: 'none',
    auth_config: { type: 'none' },
    rate_limit_per_member_per_day: 10,
    rate_limit_per_gym_per_hour: 100,
    test_cases: [],
    config: {}
  })
  const [errors, setErrors] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Charger template si fourni dans URL
  useEffect(() => {
    const templateId = searchParams?.get('template')
    if (templateId && currentGym?.id) {
      const template = getTemplateById(templateId)
      if (template) {
        const applied = applyTemplate(template, currentGym.id)
        setToolData({
          name: applied.name,
          display_name: applied.display_name,
          description: applied.description,
          category: applied.category as ToolCategory,
          icon: applied.icon,
          type: applied.type,
          config: applied.config,
          parameters: applied.parameters,
          auth_type: applied.auth_type,
          auth_config: applied.auth_config,
          rate_limit_per_member_per_day: applied.rate_limit_per_member_per_day,
          rate_limit_per_gym_per_hour: applied.rate_limit_per_gym_per_hour,
          test_cases: applied.test_cases
        })
      }
    }
  }, [searchParams, currentGym?.id])

  const steps = [
    { number: 1, title: 'Informations de base', description: 'Nom, description, type' },
    { number: 2, title: 'Configuration technique', description: 'Paramètres selon le type' },
    { number: 3, title: 'Test & Activation', description: 'Valider et activer' }
  ]

  function handleNext() {
    // Valider step actuel
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    
    setErrors([])
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleCreate()
    }
  }

  function handleBack() {
    setErrors([])
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        const errors: string[] = []
        if (!toolData.name) errors.push('Le nom est requis')
        if (!toolData.display_name) errors.push('Le nom affiché est requis')
        if (!toolData.description) errors.push('La description est requise')
        if (!toolData.type) errors.push('Le type est requis')
        return { valid: errors.length === 0, errors }
      
      case 2:
        // Validation config selon type
        return validateCustomTool(toolData as CustomToolFormData)
      
      case 3:
        return { valid: true, errors: [] }
      
      default:
        return { valid: true, errors: [] }
    }
  }

  async function handleCreate() {
    setCreating(true)
    
    try {
      const response = await fetch('/api/dashboard/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: currentGym?.id,
          tool_data: toolData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push('/dashboard/tools')
      } else {
        setErrors([data.error || 'Erreur lors de la création'])
      }
    } catch (error: any) {
      setErrors([error.message || 'Erreur réseau'])
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-white">Créer un nouveau tool</h1>
        <p className="text-gray-400 mt-2">
          Personnalisez JARVIS avec vos propres actions
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.number
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : currentStep === step.number
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-white/5 border-white/20 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                
                {/* Label */}
                <div className="ml-3">
                  <div className={`font-medium ${
                    currentStep >= step.number ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              
              {/* Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-all ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Erreurs de validation</h3>
              <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-8">
        {currentStep === 1 && (
          <Step1BasicInfo
            data={toolData}
            onChange={setToolData}
          />
        )}
        
        {currentStep === 2 && (
          <Step2Configuration
            data={toolData}
            onChange={setToolData}
          />
        )}
        
        {currentStep === 3 && (
          <Step3TestActivate
            data={toolData}
            onChange={setToolData}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </button>
        
        <button
          onClick={handleNext}
          disabled={creating}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Création...
            </>
          ) : currentStep === 3 ? (
            <>
              <Check className="h-4 w-4" />
              Créer le tool
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

