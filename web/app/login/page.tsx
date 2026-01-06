'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Loader2, ArrowRight, Eye, EyeOff, Wand2 } from 'lucide-react'
import zxcvbn from 'zxcvbn'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Password Strength & UX State
  const [passwordScore, setPasswordScore] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const checkStrength = (val: string) => {
      if (val) {
          const result = zxcvbn(val, [name, email]) 
          setPasswordScore(result.score)
          setPasswordFeedback(result.feedback.warning || result.feedback.suggestions[0] || '')
      } else {
          setPasswordScore(0)
          setPasswordFeedback('')
      }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setPassword(val)
      checkStrength(val)
  }

  const generateStrongPassword = (e: React.MouseEvent) => {
      e.preventDefault()
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
      const length = 16
      let newPass = ""
      // Use crypto for security
      const randomValues = new Uint32Array(length)
      crypto.getRandomValues(randomValues)
      
      for (let i = 0; i < length; i++) {
          newPass += chars[randomValues[i] % chars.length]
      }
      
      setPassword(newPass)
      checkStrength(newPass)
      setShowPassword(true) // Show the generated password
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        if (passwordScore < 3) {
            throw new Error("Password is too weak. Please choose a stronger password.")
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        })
        if (error) throw error
        // Auto sign in or show message
        setError('Check your email to confirm sign up (if enabled).')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper for strength bars
  const getStrengthColor = (score: number) => {
      if (score === 0) return 'bg-zinc-700'
      if (score < 2) return 'bg-red-500'
      if (score < 3) return 'bg-yellow-500'
      if (score < 4) return 'bg-green-400'
      return 'bg-green-500'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0E0C25]">
       {/* Minimal Background Decor */}
       <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className={cn(
        "w-full max-w-sm relative z-10 flex flex-col items-center",
      )}>
        {/* Logo */}
        <Link href="/">
          <img src="/domi_icon.png" alt="Domi" className="w-12 h-12 mb-8 hover:scale-105 transition-transform" />
        </Link>

        {/* Dynamic Title */}
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3 text-center">
            {isSignUp ? "Sign up for free" : "Welcome back"}
        </h1>

        <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors mb-10"
        >
            {isSignUp ? "Already have an account? Sign in." : "Don't have an account? Sign up."}
        </button>

        <form onSubmit={handleAuth} className="w-full space-y-5">
          {isSignUp && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                <input
                type="text"
                placeholder="Example User"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                required={isSignUp}
                />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1">Email</label>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                {isSignUp && (
                    <button 
                        onClick={generateStrongPassword}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        type="button"
                    >
                        <Wand2 className="w-3 h-3" /> Generate Strong Password
                    </button>
                )}
            </div>
            
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium pr-10"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {/* Password Strength Meter */}
            {isSignUp && password && (
                <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex gap-1 h-1">
                        {[0, 1, 2, 3].map((i) => (
                            <div 
                                key={i}
                                className={cn(
                                    "h-full flex-1 rounded-full transition-all duration-300",
                                    i < passwordScore ? getStrengthColor(passwordScore) : "bg-white/10"
                                )}
                            />
                        ))}
                    </div>
                    {passwordFeedback && (
                        <p className="text-[10px] text-zinc-400">{passwordFeedback}</p>
                    )}
                    <p className="text-[10px] text-zinc-500">
                        Tip: Use a password manager to generate a strong, unique password.
                    </p>
                </div>
            )}
          </div>

          {error && (
             <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
               {error}
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (isSignUp && passwordScore < 3)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create account' : 'Sign in'}
              </>
            )}
          </button>
        </form>

        {/* Footer info (Minimal) */}
        <p className="mt-12 text-[10px] text-zinc-600 text-center max-w-xs leading-relaxed">
            By clicking "{isSignUp ? 'Create account' : 'Sign in'}", you acknowledge that you have read and agree to our <a href="#" className="underline hover:text-zinc-500">Terms of Service</a> and <a href="#" className="underline hover:text-zinc-500">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
