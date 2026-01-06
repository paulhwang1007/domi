
import Link from "next/link";
import { ArrowRight, Check, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/server";
import { ProfileDropdown } from "@/components/profile-dropdown";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0E0C25] text-white selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Top Left Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
        {/* Bottom Right Glow */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          {/* Logo Icon */}
          <img src="/domi_icon.png" alt="Domi Logo" className="w-8 h-8" />
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Domi</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
             <ProfileDropdown user={user} />
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/login" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-600/25">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center max-w-5xl mx-auto">
        
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          <span>Domi 1.0 is now live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          The AI-Powered Memory <br className="hidden md:block" />
          for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400">Web</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
          Capture anything, organize effortlessly, and retrieve instantly with AI-powered context. The second brain designed for your digital life.
        </p>

        {/* CTA Input - Inspired by Circle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
           {user ? (
             <Link href="/dashboard" className="w-full">
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-12 px-6 rounded-lg transition-all shadow-[0_0_40px_-10px_rgba(93,93,255,0.5)] flex items-center justify-center gap-2 text-[15px]">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
             </Link>
           ) : (
             <Link href="/login" className="w-full">
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-12 px-6 rounded-lg transition-all shadow-[0_0_40px_-10px_rgba(93,93,255,0.5)] flex items-center justify-center gap-2 text-[15px]">
                  Get started for free
              </button>
             </Link>
           )}
        </div>
        
        <p className="mt-4 text-xs text-zinc-500">No credit card required • Free plan available</p>

        {/* Curved Line Graphic Section */}
        <div className="w-full max-w-6xl mt-32 relative">
             {/* Gradient Curve SVG - Representing flow */}
             <svg className="w-full h-[200px] md:h-[400px] overflow-visible" viewBox="0 0 1000 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Glow/Blur filter def */}
                <defs>
                   <linearGradient id="line-gradient" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6EE7B7" /> {/* Teal/Green like 'Start' */}
                      <stop offset="0.33" stopColor="#A855F7" /> {/* Purple like 'Engage' */}
                      <stop offset="0.66" stopColor="#F472B6" /> {/* Pink like 'Monetize' */}
                      <stop offset="1" stopColor="#3B82F6" /> {/* Blue like 'Scale' */}
                   </linearGradient>
                </defs>
                
                {/* The Path */}
                <path 
                  d="M0 250 C 250 250, 400 150, 500 100 S 800 50, 1000 0" 
                  stroke="url(#line-gradient)" 
                  strokeWidth="4" 
                  filter="drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))"
                  className="opacity-80"
                />

                {/* Nodes on the path */}
                {/* Start Node */}
                <circle cx="100" cy="245" r="8" fill="#6EE7B7" className="animate-pulse" />
                <circle cx="100" cy="245" r="16" fill="#6EE7B7" fillOpacity="0.2" />

                {/* Engage Node */}
                 <circle cx="450" cy="120" r="8" fill="#A855F7" />
                 <circle cx="450" cy="120" r="16" fill="#A855F7" fillOpacity="0.2" />

                 {/* Scale Node */}
                 <circle cx="800" cy="40" r="8" fill="#3B82F6" />
                 <circle cx="800" cy="40" r="16" fill="#3B82F6" fillOpacity="0.2" />
             </svg>

             {/* Text Labels aligned roughly with nodes */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute left-[5%] bot-[10%] md:top-[65%] text-left max-w-[200px]">
                    <h3 className="text-2xl font-bold text-white mb-2">Capture</h3>
                    <p className="text-sm text-zinc-400">Save images, text, and pages instantly with one click.</p>
                </div>

                <div className="absolute left-[40%] top-[25%] md:top-[30%] text-left max-w-[200px]">
                    <h3 className="text-2xl font-bold text-white mb-2">Organize</h3>
                    <p className="text-sm text-zinc-400">AI automatically tags and categorizes your content.</p>
                </div>

                <div className="absolute right-[10%] top-[0%] md:top-[5%] text-left max-w-[200px]">
                    <h3 className="text-2xl font-bold text-white mb-2">Retrieve</h3>
                    <p className="text-sm text-zinc-400">Find anything with semantic search and context.</p>
                </div>
             </div>
        </div>

      </main>
      
      {/* Footer Simple */}
      <footer className="border-t border-white/5 mt-20 py-12 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Domi Inc. Curated by You.</p>
      </footer>
    </div>
  );
}
