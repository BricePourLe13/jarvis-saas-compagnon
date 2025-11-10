/**
 * Step 1: Basic Information
 * Nom, description, type, catégorie du tool
 */

'use client'

import type { CustomToolFormData, ToolType, ToolCategory } from '@/types/custom-tools'
import { validateToolName, validateToolDescription } from '@/types/custom-tools'

interface Props {
  data: Partial<CustomToolFormData>
  onChange: (data: Partial<CustomToolFormData>) => void
}

export function Step1BasicInfo({ data, onChange }: Props) {
  const toolTypes: Array<{ value: ToolType; label: string; description: string; icon: string }> = [
    {
      value: 'api_rest',
      label: 'API REST',
      description: 'Appel vers une API externe (GET, POST, etc.)',
      icon: '🌐'
    },
    {
      value: 'mcp_supabase',
      label: 'Base de données',
      description: 'Query SQL sur votre base Supabase (SELECT only)',
      icon: '🗄️'
    },
    {
      value: 'webhook',
      label: 'Webhook',
      description: 'POST vers un webhook (Zapier, Make, n8n)',
      icon: '🔗'
    }
  ]

  const categories: Array<{ value: ToolCategory; label: string; icon: string }> = [
    { value: 'booking', label: 'Réservation', icon: '📅' },
    { value: 'info', label: 'Information', icon: 'ℹ️' },
    { value: 'action', label: 'Action', icon: '⚡' },
    { value: 'analytics', label: 'Statistiques', icon: '📊' },
    { value: 'communication', label: 'Communication', icon: '💬' },
    { value: 'other', label: 'Autre', icon: '🔧' }
  ]

  const icons = ['🔧', '📅', '💬', '📊', '⚡', 'ℹ️', '🗄️', '🌐', '🔗', '💊', '🥤', '🧖', '🎯', '📋', '✅']

  function handleChange(field: keyof CustomToolFormData, value: any) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Informations de base
      </h2>

      {/* Nom technique */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nom technique <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="reserve_yoga_class"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <p className="text-xs text-gray-500 mt-1">
          En snake_case (lettres minuscules, chiffres et underscores uniquement)
        </p>
        {data.name && validateToolName(data.name) && (
          <p className="text-xs text-red-400 mt-1">{validateToolName(data.name)}</p>
        )}
      </div>

      {/* Nom affiché */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nom affiché <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.display_name || ''}
          onChange={(e) => handleChange('display_name', e.target.value)}
          placeholder="Réserver cours de yoga"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <p className="text-xs text-gray-500 mt-1">
          Nom tel qu'affiché dans l'interface
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Permet aux adhérents de réserver une place dans un cours collectif"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Description utilisée par l'IA pour comprendre quand utiliser ce tool (10-500 caractères)
        </p>
        {data.description && validateToolDescription(data.description) && (
          <p className="text-xs text-red-400 mt-1">{validateToolDescription(data.description)}</p>
        )}
      </div>

      {/* Type de tool */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Type de tool <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          {toolTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleChange('type', type.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                data.type === type.value
                  ? 'bg-white/10 border-white/30 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-semibold text-white mb-1">{type.label}</div>
              <div className="text-xs text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Catégorie
        </label>
        <div className="grid grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleChange('category', cat.value)}
              className={`p-3 rounded-lg border transition-all text-center ${
                data.category === cat.value
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xs text-white">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Icône */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Icône
        </label>
        <div className="flex flex-wrap gap-2">
          {icons.map((icon) => (
            <button
              key={icon}
              onClick={() => handleChange('icon', icon)}
              className={`w-12 h-12 rounded-lg border transition-all text-2xl ${
                data.icon === icon
                  ? 'bg-white/10 border-white/30 scale-110'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:scale-105'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

