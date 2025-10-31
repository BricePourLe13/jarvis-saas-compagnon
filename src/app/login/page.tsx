"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import JarvisAvatar from '@/components/common/JarvisAvatar'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Style pour forcer les champs à rester blancs même avec autofill
const inputStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #111827 !important;
    box-shadow: 0 0 0 30px white inset !important;
  }
`

let createClient: any = null
async function loadSupabaseClient() {
  if (!createClient) {
    const supabaseModule = await import('@/lib/supabase-singleton')
    createClient = supabaseModule.getSupabaseSingleton
  }
  return createClient()
}

// Composant avec formes fluides modernes
const ModernFluidShapes = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grande forme fluide principale */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '70%',
          height: '80%',
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.6) 0%, rgba(209, 213, 219, 0.4) 50%, rgba(229, 231, 235, 0.3) 100%)',
          borderRadius: '50% 30% 60% 40%',
          filter: 'blur(1px)'
        }}
        animate={{
          borderRadius: [
            '50% 30% 60% 40%',
            '40% 60% 30% 50%',
            '60% 40% 50% 30%',
            '50% 30% 60% 40%'
          ],
          rotate: [0, 10, -5, 0],
          scale: [1, 1.05, 0.98, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Forme fluide secondaire */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '60%',
          height: '70%',
          background: 'linear-gradient(225deg, rgba(107, 114, 128, 0.4) 0%, rgba(156, 163, 175, 0.3) 60%, rgba(209, 213, 219, 0.2) 100%)',
          borderRadius: '40% 50% 30% 60%',
          filter: 'blur(2px)'
        }}
        animate={{
          borderRadius: [
            '40% 50% 30% 60%',
            '60% 30% 50% 40%',
            '30% 60% 40% 50%',
            '40% 50% 30% 60%'
          ],
          rotate: [0, -15, 8, 0],
          scale: [1, 0.95, 1.03, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      />

      {/* Forme fluide accent */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '20%',
          width: '50%',
          height: '60%',
          background: 'linear-gradient(45deg, rgba(229, 231, 235, 0.5) 0%, rgba(243, 244, 246, 0.3) 100%)',
          borderRadius: '60% 40% 50% 30%',
          filter: 'blur(1.5px)'
        }}
        animate={{
          borderRadius: [
            '60% 40% 50% 30%',
            '30% 50% 40% 60%',
            '50% 30% 60% 40%',
            '60% 40% 50% 30%'
          ],
          rotate: [0, 12, -8, 0],
          scale: [1, 1.08, 0.94, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Petites formes flottantes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${15 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            width: `${40 + i * 8}px`,
            height: `${40 + i * 8}px`,
            background: `linear-gradient(${45 + i * 60}deg, rgba(${156 - i * 10}, ${163 - i * 8}, ${175 - i * 12}, ${0.4 - i * 0.05}) 0%, rgba(${209 + i * 8}, ${213 + i * 6}, ${219 + i * 4}, ${0.2 - i * 0.02}) 100%)`,
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}
          animate={{
            y: [0, -20 - i * 5, 0],
            x: [0, Math.sin(i) * 15, 0],
            scale: [1, 1.2 + i * 0.1, 1],
            opacity: [0.4 - i * 0.05, 0.7 - i * 0.08, 0.4 - i * 0.05]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
        />
      ))}

      {/* Formes géométriques subtiles */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15%',
          left: '30%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(156, 163, 175, 0.2) 100%)',
          borderRadius: '20px',
          transform: 'rotate(45deg)'
        }}
        animate={{
          rotate: [45, 135, 225, 315, 45],
          scale: [1, 1.1, 0.9, 1.05, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '25%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(225deg, rgba(156, 163, 175, 0.4) 0%, rgba(209, 213, 219, 0.2) 100%)',
          borderRadius: '50%'
        }}
        animate={{
          scale: [1, 1.3, 0.8, 1],
          opacity: [0.4, 0.7, 0.3, 0.4]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />

      {/* Éléments de profondeur */}
      <motion.div
        style={{
          position: 'absolute',
          top: '40%',
          left: '10%',
          width: '120px',
          height: '40px',
          background: 'linear-gradient(90deg, rgba(107, 114, 128, 0.2) 0%, rgba(156, 163, 175, 0.1) 100%)',
          borderRadius: '20px',
          transform: 'rotate(25deg)',
          filter: 'blur(2px)'
        }}
        animate={{
          x: [0, 30, -15, 0],
          rotate: [25, 35, 15, 25]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Particules de lumière */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            width: '4px',
            height: '4px',
            backgroundColor: '#d1d5db',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(209, 213, 219, 0.6)'
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Gradient overlay pour unifier */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(248, 249, 250, 0.3) 70%, rgba(248, 249, 250, 0.6) 100%)"
        }}
      />
    </div>
  )
}

// Composant illustration JARVIS (côté gauche)
const JarvisIllustration = () => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background avec pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgb(249, 250, 251) 0%, rgb(229, 231, 235) 50%, rgb(209, 213, 219) 100%)"
        }}
      />
      
      <ModernFluidShapes />
      
      {/* Avatar JARVIS central avec composant réutilisable */}
      <div className="relative z-10 h-full">
        <JarvisAvatar 
          size={200}
          showText={true}
          title="Intelligence Platform"
          description="Analyse conversationnelle et insights analytiques pour salles de sport"
          variant="default"
          status="idle"
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (!captchaToken) {
        setError('Veuillez compléter le CAPTCHA')
        setLoading(false)
        return
      }

      const supabase = await loadSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: captchaToken
        }
      })
      
      if (error) { 
        setError(error.message)
        setLoading(false)
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha()
          setCaptchaToken(null)
        }
        return 
      }
      
      if (data.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'franchise_owner' || userProfile?.role === 'franchise_admin'
        if (isAdmin) {
          try {
            // @ts-ignore
            const factors = await (supabase.auth as any).mfa?.listFactors?.()
            const hasTotp = Array.isArray(factors?.data?.totp) && factors.data.totp.length > 0
            if (!hasTotp) {
              router.push('/auth/mfa')
              return
            }

            router.push('/auth/mfa/challenge')
            return
          } catch {}
        }

        setSuccess(true)

        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: inputStyles }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* Côté gauche - Avatar JARVIS */}
        <div className="hidden lg:block">
          <JarvisIllustration />
        </div>
        
        {/* Côté droit - Formulaire */}
        <div className="flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-[400px]">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="space-y-6 mb-10 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <p className="text-2xl font-extrabold text-gray-900 tracking-[4px]">
                    JARVIS
                  </p>
                </motion.div>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Bienvenue
                  </h1>
                  <p className="text-gray-600 text-base">
                    Connectez-vous à votre espace
                  </p>
                </div>
              </div>

              {/* Formulaire */}
              <form 
                onSubmit={handleLogin}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              >
                {/* Champs cachés pour tromper l'autocomplétion */}
                <input 
                  type="text" 
                  name="username" 
                  autoComplete="username" 
                  style={{ display: 'none' }} 
                  tabIndex={-1}
                />
                <input 
                  type="password" 
                  name="password" 
                  autoComplete="current-password" 
                  style={{ display: 'none' }} 
                  tabIndex={-1}
                />
                
                <div className="space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                      >
                        <div className="bg-red-50 border border-red-300 rounded-xl p-3 w-full">
                          <p className="text-red-600 text-sm text-center">
                            {error}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      className="w-full bg-white border border-gray-300 rounded-xl h-[50px] px-4 text-[15px] text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-400"
                      style={{ 
                        backgroundColor: '#ffffff',
                        WebkitTextFillColor: '#111827'
                      }}
                      autoComplete="off"
                      autoFocus={false}
                      name="email_field_unique"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-300 rounded-xl h-[50px] px-4 text-[15px] text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-400"
                      style={{ 
                        backgroundColor: '#ffffff',
                        WebkitTextFillColor: '#111827'
                      }}
                      autoComplete="new-password"
                      name="password_field_unique"
                      required
                    />
                  </div>

                  {/* hCaptcha */}
                  <div className="flex justify-center w-full">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "59b4e250-bc3c-4940-bf1c-38b0883a1a14"}
                      onVerify={(token) => setCaptchaToken(token)}
                      onError={(err) => setCaptchaToken(null)}
                      onExpire={() => setCaptchaToken(null)}
                      onLoad={() => {}}
                      theme="light"
                      size="normal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[50px] bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-[15px] transition-all duration-200 relative overflow-hidden disabled:opacity-70"
                  >
                    {loading ? (
                      success ? (
                        <div className="flex items-center justify-center space-x-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, ease: "backOut" }}
                          >
                            <div className="w-5 h-5 border-2 border-white rounded-full relative">
                              <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                              >
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <motion.path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                  />
                                </svg>
                              </motion.div>
                            </div>
                          </motion.div>
                          <span className="text-sm font-semibold">
                            Connecté ! Redirection...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </motion.div>
                          <span className="ml-2 text-sm opacity-90">
                            Connexion...
                          </span>
                        </div>
                      )
                    ) : (
                      "Se connecter"
                    )}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <p className="text-center text-gray-400 text-xs mt-8 tracking-wide">
                PLATEFORME SÉCURISÉE
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
