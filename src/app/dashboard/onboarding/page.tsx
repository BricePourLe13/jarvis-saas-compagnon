'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, MapPin, Clock, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/manager/gyms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: 'Salle créée avec succès !',
        description: 'Votre espace est en cours de configuration. Redirection...',
      })

      // Rafraîchir la page pour que le middleware/getUser détecte le nouveau gym_id
      window.location.href = '/dashboard'

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/images/logo_jarvis.png"
            alt="JARVIS Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Bienvenue sur JARVIS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Pour commencer, configurez votre première salle de sport.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <Label htmlFor="name">Nom de la salle</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="pl-10"
                  placeholder="Ex: Fitness Park Lyon 3"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <Label htmlFor="address">Adresse</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="pl-10"
                    placeholder="123 Avenue Jean Jaurès"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="Lyon"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="sm:col-span-3">
                <Label htmlFor="postal_code">Code Postal</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  required
                  placeholder="69003"
                  value={formData.postal_code}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone (Optionnel)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 4 78 ..."
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Ce qui va se passer
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Votre salle sera créée en attente de validation.</li>
                      <li>Un kiosk principal sera automatiquement provisionné.</li>
                      <li>Vous accéderez à votre dashboard de gestion.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Création en cours...
                  </>
                ) : (
                  'Créer ma salle et accéder au dashboard'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

