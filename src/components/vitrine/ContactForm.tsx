'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseSingleton } from '@/lib/supabase-singleton';

interface ContactFormProps {
  leadType?: 'pilot' | 'demo' | 'contact';
  className?: string;
}

export default function ContactForm({ leadType = 'pilot', className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Récupération IP et User Agent côté client
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      
      // Insertion dans Supabase
      const supabase = getSupabaseSingleton();
      const { error } = await supabase
        .from('contact_leads')
        .insert([{ 
          ...formData, 
          lead_type: leadType,
          user_agent: userAgent
        }]);
      
      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error(error.message);
      }
      
      setStatus('success');
      
      // Reset form après 3 secondes
      setTimeout(() => {
        setFormData({
          full_name: '',
          email: '',
          company_name: '',
          phone: '',
          message: ''
        });
        setStatus('idle');
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur envoi formulaire:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'loading': return '⏳ Envoi en cours...';
      case 'success': return '✅ Demande envoyée !';
      case 'error': return '❌ Erreur - Réessayer';
      default: return leadType === 'pilot' ? '🚀 Candidater au programme pilote' : '📩 Envoyer ma demande';
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`space-y-4 ${className}`}
    >
      {/* Nom complet */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-neutral-300 mb-2">
          Nom complet <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Jean Dupont"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
          Email professionnel <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="jean.dupont@fitness-club.fr"
        />
      </div>

      {/* Nom de la salle */}
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-neutral-300 mb-2">
          Nom de votre salle de sport
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Fitness Club Paris 15"
        />
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-2">
          Téléphone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="06 12 34 56 78"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-2">
          Votre message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Parlez-nous de votre salle et de vos besoins..."
        />
      </div>

      {/* Message d'erreur */}
      {status === 'error' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Message de succès */}
      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
        >
          ✅ Merci ! Votre demande a été envoyée avec succès. Nous vous recontacterons sous 24h.
        </motion.div>
      )}

      {/* Bouton Submit */}
      <motion.button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className={`
          w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
          ${status === 'success' 
            ? 'bg-green-600 text-white cursor-default' 
            : status === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-white text-black hover:bg-neutral-100 hover:shadow-xl'
          }
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
        whileHover={status === 'idle' || status === 'error' ? { scale: 1.02 } : {}}
        whileTap={status === 'idle' || status === 'error' ? { scale: 0.98 } : {}}
      >
        {getButtonText()}
      </motion.button>

      {/* RGPD Notice */}
      <p className="text-xs text-neutral-500 text-center">
        En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour vous recontacter. 
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression.
      </p>
    </motion.form>
  );
}

