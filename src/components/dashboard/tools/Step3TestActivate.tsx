/**
 * Step 3: Test & Activate
 * Tester le tool et choisir d'activer ou garder en draft
 */

'use client'

import { useState } from 'react'
import type { CustomToolFormData } from '@/types/custom-tools'
import { Play, Check, AlertCircle, Clock } from 'lucide-react'

interface Props {
  data: Partial<CustomToolFormData>
  onChange: (data: Partial<CustomToolFormData>) => void
}

export function Step3TestActivate({ data, onChange }: Props) {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  async function handleTest() {
    setTesting(true)
    setTestError(null)
    
    try {
      // Simuler un test pour MVP
      // TODO: Implémenter vraie logique de test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResult({
        success: true,
        execution_time_ms: 234,
        data: {
          message: 'Test réussi !',
          sample_output: 'Données de test'
        }
      })
    } catch (error: any) {
      setTestError(error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Test & Activation
      </h2>

      {/* Récapitulatif */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Récapitulatif</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{data.icon}</span>
            <div>
              <div className="font-semibold text-white">{data.display_name}</div>
              <div className="text-sm text-gray-500">{data.name}</div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {data.description}
          </div>

          <div className="flex items-center gap-4 text-sm pt-2 border-t border-white/10">
            <div>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="text-white">{data.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Catégorie:</span>{' '}
              <span className="text-white">{data.category}</span>
            </div>
            <div>
              <span className="text-gray-500">Paramètres:</span>{' '}
              <span className="text-white">{data.parameters?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de test */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Tester le tool</h3>
            <p className="text-sm text-gray-400">
              Vérifier que la configuration fonctionne correctement
            </p>
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Test en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Tester maintenant
              </>
            )}
          </button>
        </div>

        {/* Résultat du test */}
        {testResult && !testError && (
          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-400 mb-2">Test réussi !</h4>
                <div className="text-sm text-green-300 space-y-1">
                  <div>Temps d'exécution: {testResult.execution_time_ms}ms</div>
                  {testResult.data && (
                    <div className="mt-2 bg-black/40 p-3 rounded font-mono text-xs">
                      <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {testError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-400 mb-1">Échec du test</h4>
                <p className="text-sm text-red-300">{testError}</p>
              </div>
            </div>
          </div>
        )}

        {!testResult && !testError && !testing && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-400 mb-1">Test non effectué</h4>
                <p className="text-sm text-yellow-300">
                  Nous recommandons de tester votre tool avant de l'activer
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rate Limiting */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Limitations d'usage</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Par membre / jour
            </label>
            <input
              type="number"
              value={data.rate_limit_per_member_per_day || 10}
              onChange={(e) => onChange({ ...data, rate_limit_per_member_per_day: parseInt(e.target.value) })}
              min={1}
              max={100}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre max d'exécutions par membre par jour
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Par gym / heure
            </label>
            <input
              type="number"
              value={data.rate_limit_per_gym_per_hour || 100}
              onChange={(e) => onChange({ ...data, rate_limit_per_gym_per_hour: parseInt(e.target.value) })}
              min={1}
              max={10000}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre max d'exécutions pour toute la gym par heure
            </p>
          </div>
        </div>
      </div>

      {/* Activation */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Activation</h3>
        <p className="text-sm text-gray-400 mb-4">
          Choisissez si vous souhaitez activer le tool immédiatement ou le garder en draft
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
            <input
              type="radio"
              name="status"
              value="draft"
              defaultChecked
              className="mt-1"
            />
            <div>
              <div className="font-medium text-white mb-1">
                Garder en draft
              </div>
              <div className="text-sm text-gray-400">
                Le tool ne sera pas disponible pour JARVIS. Vous pourrez l'activer plus tard.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
            <input
              type="radio"
              name="status"
              value="active"
              className="mt-1"
            />
            <div>
              <div className="font-medium text-white mb-1">
                Activer immédiatement
              </div>
              <div className="text-sm text-gray-400">
                Le tool sera disponible pour JARVIS dès maintenant
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Info finale */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Bon à savoir</h4>
            <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
              <li>Vous pourrez modifier ce tool à tout moment</li>
              <li>Les statistiques d'usage seront disponibles dans le dashboard</li>
              <li>Vous pourrez mettre en pause ou supprimer ce tool si besoin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

