'use client'

import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E0C25] relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl relative z-10 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-zinc-400 mb-8">
                Your email has been successfully confirmed. You can now sign in to your account.
            </p>

            <Link 
                href="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
                Continue to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    </div>
  )
}
