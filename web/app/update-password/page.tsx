'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Loader2, Eye, EyeOff, Lock, Check, ArrowRight, Wand2 } from 'lucide-react'
import zxcvbn from 'zxcvbn'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Password Strength State
  const [passwordScore, setPasswordScore] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // optional: check if session exists, if not redirect to login
    // The reset link should automatically log the user in.
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.replace('/login')
        }
    }
    checkSession()
  }, [router, supabase.auth])

  const checkStrength = (val: string) => {
    if (val) {
        const result = zxcvbn(val) 
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
  
  // Helper for strength bars
  const getStrengthColor = (score: number) => {
      if (score === 0) return 'bg-zinc-700'
      if (score < 2) return 'bg-red-500'
      if (score < 3) return 'bg-yellow-500'
      if (score < 4) return 'bg-green-400'
      return 'bg-green-500'
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
        if (passwordScore < 3) {
            throw new Error("Password is too weak. Please choose a stronger password.")
        }
        
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) throw error

        setSuccess(true)
        setTimeout(() => {
            router.push('/dashboard')
        }, 3000)

    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsLoading(false)
    }
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

        {/* Title */}
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3 text-center">
            Update Password
        </h1>
        <p className="text-zinc-400 text-sm mb-10 text-center max-w-[280px]">
            Enter your new password below to secure your account.
        </p>

        {success ? (
            <div className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    Your password has been changed successfully. Redirecting you to the dashboard...
                </p>
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting...
                </div>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                >
                    Go to Dashboard immediately <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        ) : (
            <form onSubmit={handleUpdatePassword} className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400 ml-1">New Password</label>
                    <button 
                        onClick={generateStrongPassword}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        type="button"
                    >
                        <Wand2 className="w-3 h-3" /> Generate Strong Password
                    </button>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium pr-10"
                        required
                        autoFocus
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
                {password && (
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
                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center animate-in fade-in">
                {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || passwordScore < 3}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
            >
                {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                'Update Password'
                )}
            </button>
            </form>
        )}
      </div>
    </div>
  )
}
