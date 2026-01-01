
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0E0C25]">
       {/* Minimal Background Decor */}
       <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className={cn(
        "w-full max-w-sm relative z-10 flex flex-col items-center",
        // Removed card styling for minimalist look
      )}>
        {/* Logo */}
        <Link href="/">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white to-zinc-400 flex items-center justify-center mb-8 shadow-lg shadow-white/10 cursor-pointer hover:scale-105 transition-transform">
             <LayoutDashboard className="text-black w-5 h-5" />
          </div>
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
            <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
              required
            />
          </div>

          {error && (
             <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
               {error}
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5d5dff] hover:bg-[#4b4be6] text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
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
