/**
 * Step 2: Technical Configuration
 * Configuration selon le type de tool (API REST, MCP Supabase, Webhook)
 */

'use client'

import { useState } from 'react'
import type { 
  CustomToolFormData, 
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter 
} from '@/types/custom-tools'
import { Plus, Trash2, HelpCircle } from 'lucide-react'

interface Props {
  data: Partial<CustomToolFormData>
  onChange: (data: Partial<CustomToolFormData>) => void
}

export function Step2Configuration({ data, onChange }: Props) {
  function handleConfigChange(field: string, value: any) {
    onChange({
      ...data,
      config: {
        ...data.config,
        [field]: value
      }
    })
  }

  function handleParametersChange(params: ToolParameter[]) {
    onChange({ ...data, parameters: params })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Configuration technique
      </h2>

      {/* Config selon type */}
      {data.type === 'api_rest' && (
        <ApiRestConfigForm
          config={data.config as Partial<ApiRestConfig>}
          onChange={handleConfigChange}
        />
      )}

      {data.type === 'mcp_supabase' && (
        <McpSupabaseConfigForm
          config={data.config as Partial<McpSupabaseConfig>}
          onChange={handleConfigChange}
        />
      )}

      {data.type === 'webhook' && (
        <WebhookConfigForm
          config={data.config as Partial<WebhookConfig>}
          onChange={handleConfigChange}
        />
      )}

      {/* Paramètres (commun à tous) */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <ParametersEditor
          parameters={data.parameters || []}
          onChange={handleParametersChange}
        />
      </div>

      {/* Variables disponibles */}
      <VariablesHelp />
    </div>
  )
}

// ============================================
// API REST CONFIG
// ============================================

function ApiRestConfigForm({
  config,
  onChange
}: {
  config: Partial<ApiRestConfig>
  onChange: (field: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      {/* URL Endpoint */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          URL Endpoint <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={config.endpoint || ''}
          onChange={(e) => onChange('endpoint', e.target.value)}
          placeholder="https://api.example.com/reservations"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-sm"
        />
      </div>

      {/* HTTP Method */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Méthode HTTP
        </label>
        <select
          value={config.method || 'POST'}
          onChange={(e) => onChange('method', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      {/* Headers */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Headers HTTP
        </label>
        <KeyValueEditor
          values={config.headers || {}}
          onChange={(headers) => onChange('headers', headers)}
          placeholder={{ key: 'Authorization', value: 'Bearer {{gym.api_key}}' }}
        />
      </div>

      {/* Body Template */}
      {config.method !== 'GET' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Body Template (JSON)
          </label>
          <textarea
            value={typeof config.body_template === 'string' ? config.body_template : JSON.stringify(config.body_template || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange('body_template', parsed)
              } catch {
                onChange('body_template', e.target.value)
              }
            }}
            placeholder={`{\n  "email": "{{member.email}}",\n  "course": "{{args.course_name}}"\n}`}
            rows={8}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-sm resize-none"
          />
        </div>
      )}

      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Timeout (ms)
        </label>
        <input
          type="number"
          value={config.timeout_ms || 10000}
          onChange={(e) => onChange('timeout_ms', parseInt(e.target.value))}
          min={1000}
          max={60000}
          step={1000}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>
    </div>
  )
}

// ============================================
// MCP SUPABASE CONFIG
// ============================================

function McpSupabaseConfigForm({
  config,
  onChange
}: {
  config: Partial<McpSupabaseConfig>
  onChange: (field: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      {/* Query Template */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Query SQL <span className="text-red-400">*</span>
        </label>
        <textarea
          value={config.query_template || ''}
          onChange={(e) => onChange('query_template', e.target.value)}
          placeholder={`SELECT * FROM gym_classes\nWHERE gym_id = '{{gym.id}}'\nAND date = '{{args.date}}'`}
          rows={6}
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-sm resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          ⚠️ Seules les requêtes SELECT sont autorisées pour des raisons de sécurité
        </p>
      </div>

      {/* Max Rows */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nombre max de résultats
        </label>
        <input
          type="number"
          value={config.max_rows || 100}
          onChange={(e) => onChange('max_rows', parseInt(e.target.value))}
          min={1}
          max={1000}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>
    </div>
  )
}

// ============================================
// WEBHOOK CONFIG
// ============================================

function WebhookConfigForm({
  config,
  onChange
}: {
  config: Partial<WebhookConfig>
  onChange: (field: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          URL Webhook <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={config.url || ''}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="https://hooks.zapier.com/hooks/catch/xxx"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-sm"
        />
      </div>

      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Méthode
        </label>
        <select
          value={config.method || 'POST'}
          onChange={(e) => onChange('method', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
      </div>

      {/* Payload Template */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Payload Template (JSON) <span className="text-red-400">*</span>
        </label>
        <textarea
          value={typeof config.payload_template === 'string' ? config.payload_template : JSON.stringify(config.payload_template || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange('payload_template', parsed)
            } catch {
              onChange('payload_template', e.target.value)
            }
          }}
          placeholder={`{\n  "member_name": "{{member.first_name}}",\n  "event": "{{args.event_type}}"\n}`}
          rows={8}
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-sm resize-none"
        />
      </div>
    </div>
  )
}

// ============================================
// PARAMETERS EDITOR
// ============================================

function ParametersEditor({
  parameters,
  onChange
}: {
  parameters: ToolParameter[]
  onChange: (params: ToolParameter[]) => void
}) {
  function addParameter() {
    onChange([
      ...parameters,
      {
        name: '',
        type: 'string',
        description: '',
        required: false
      }
    ])
  }

  function updateParameter(index: number, field: keyof ToolParameter, value: any) {
    const updated = [...parameters]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  function removeParameter(index: number) {
    onChange(parameters.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Paramètres du tool</h3>
          <p className="text-sm text-gray-400">
            Quels arguments JARVIS doit-il demander à l'utilisateur ?
          </p>
        </div>
        <button
          onClick={addParameter}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all border border-white/10"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {parameters.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
          <p className="text-gray-400">Aucun paramètre défini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parameters.map((param, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="grid grid-cols-12 gap-3">
                {/* Name */}
                <div className="col-span-3">
                  <label className="block text-xs text-gray-400 mb-1">Nom</label>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => updateParameter(index, 'name', e.target.value)}
                    placeholder="course_name"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select
                    value={param.type}
                    onChange={(e) => updateParameter(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-5">
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={param.description}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                    placeholder="Nom du cours (ex: yoga, pilates)"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                {/* Required */}
                <div className="col-span-1 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
                    />
                    <span className="text-xs text-gray-400">Requis</span>
                  </label>
                </div>

                {/* Delete */}
                <div className="col-span-1 flex items-end">
                  <button
                    onClick={() => removeParameter(index)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// KEY-VALUE EDITOR (pour headers)
// ============================================

function KeyValueEditor({
  values,
  onChange,
  placeholder
}: {
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  placeholder?: { key: string; value: string }
}) {
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(
    Object.entries(values).map(([key, value]) => ({ key, value }))
  )

  function handleChange() {
    const newValues: Record<string, string> = {}
    entries.forEach(({ key, value }) => {
      if (key.trim()) {
        newValues[key] = value
      }
    })
    onChange(newValues)
  }

  function addEntry() {
    setEntries([...entries, { key: '', value: '' }])
  }

  function updateEntry(index: number, field: 'key' | 'value', value: string) {
    const updated = [...entries]
    updated[index][field] = value
    setEntries(updated)
    handleChange()
  }

  function removeEntry(index: number) {
    const updated = entries.filter((_, i) => i !== index)
    setEntries(updated)
    handleChange()
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={entry.key}
            onChange={(e) => updateEntry(index, 'key', e.target.value)}
            placeholder={placeholder?.key || 'Header-Name'}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
          />
          <input
            type="text"
            value={entry.value}
            onChange={(e) => updateEntry(index, 'value', e.target.value)}
            placeholder={placeholder?.value || 'value'}
            className="flex-[2] px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
          />
          <button
            onClick={() => removeEntry(index)}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      
      <button
        onClick={addEntry}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm"
      >
        + Ajouter une entrée
      </button>
    </div>
  )
}

// ============================================
// VARIABLES HELP
// ============================================

function VariablesHelp() {
  const variables = [
    { key: '{{member.id}}', description: 'ID du membre' },
    { key: '{{member.email}}', description: 'Email du membre' },
    { key: '{{member.first_name}}', description: 'Prénom' },
    { key: '{{member.last_name}}', description: 'Nom de famille' },
    { key: '{{gym.id}}', description: 'ID de la salle' },
    { key: '{{gym.name}}', description: 'Nom de la salle' },
    { key: '{{gym.api_key}}', description: 'Clé API (si configurée)' },
    { key: '{{args.xxx}}', description: 'Arguments du tool (ex: {{args.date}})' }
  ]

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-400 mb-2">Variables disponibles</h4>
          <p className="text-sm text-blue-300 mb-3">
            Utilisez ces variables dans vos templates pour injecter des données dynamiques :
          </p>
          <div className="grid grid-cols-2 gap-2">
            {variables.map((v) => (
              <div key={v.key} className="flex items-start gap-2">
                <code className="text-xs bg-black/40 px-2 py-1 rounded text-blue-300 font-mono">
                  {v.key}
                </code>
                <span className="text-xs text-blue-200">→ {v.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

