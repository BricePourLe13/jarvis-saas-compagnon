'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Lock, Palette } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'appearance', label: 'Apparence', icon: Palette },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérer votre compte et vos préférences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Informations de profil</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Préférences de notification</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Alertes email</p>
                  <p className="text-sm text-gray-400">Recevoir des alertes par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Sécurité du compte</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Apparence</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-white mb-4">Thème</p>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-black/60 border-2 border-white/20 rounded-lg text-white hover:border-white/40 transition-colors">
                    Sombre (Actif)
                  </button>
                  <button className="p-4 bg-black/60 border border-white/10 rounded-lg text-gray-400 hover:border-white/20 transition-colors">
                    Clair (Bientôt)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

