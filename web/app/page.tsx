
import Link from "next/link";
import { ArrowRight, Check, LayoutDashboard, Sparkles, Scissors, LayoutGrid, Bot, Zap, Tag, BrainCircuit } from "lucide-react";
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

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
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
        
        <p className="mt-4 text-xs text-zinc-500">No credit card required</p>

        {/* Curved Line Graphic Section */}


      </main>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent mb-6">
                  Your second brain, visualized.
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                  Domi isn't just a bookmark manager. It's a complete operating system for your digital memory.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Scissors className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Smart Capture</h3>
                  <p className="text-zinc-400 leading-relaxed">
                      Don't just save links. Capture the specific context with area selection screenshots and text highlights directly from your browser.
                  </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                      <LayoutGrid className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Visual Dashboard</h3>
                  <p className="text-zinc-400 leading-relaxed">
                      Forget messy lists. Your content is organized into a beautiful masonry gallery, making it easy to browse and rediscover.
                  </p>
              </div>

               {/* Feature 3 */}
               <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                      <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">AI Interaction</h3>
                  <p className="text-zinc-400 leading-relaxed">
                      Chat with your saved content. Ask questions, summarize articles, and extract insights using our advanced AI integration.
                  </p>
              </div>
          </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 relative z-10 bg-gradient-to-b from-transparent to-black/40">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">The Domi Workflow</h2>
                  <p className="text-zinc-400 text-lg">From discovery to mastery in three steps.</p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-16 h-16 rounded-full bg-[#0E0C25] border-2 border-indigo-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                          <Zap className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">1. Snap</h3>
                      <p className="text-zinc-400 text-sm max-w-xs">
                          See something inspiring? Use the Chrome extension to capture URLs, images, text, or any selected area instantly.
                      </p>
                  </div>

                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 -z-0" />

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-16 h-16 rounded-full bg-[#0E0C25] border-2 border-purple-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                          <Tag className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">2. Organize</h3>
                      <p className="text-zinc-400 text-sm max-w-xs">
                          Domi automatically processes your content, extracting metadata and generating tags for effortless sorting.
                      </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-16 h-16 rounded-full bg-[#0E0C25] border-2 border-pink-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                          <BrainCircuit className="w-6 h-6 text-pink-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">3. Flow</h3>
                      <p className="text-zinc-400 text-sm max-w-xs">
                          Retrieve your knowledge instantly when you need it. Use it to build, create, and inspire your next project.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-indigo-900/20 to-transparent p-12 rounded-3xl border border-indigo-500/20 backdrop-blur-sm">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your memory?</h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                  Join users who are supercharging their productivity with Domi today.
              </p>
              
              <div className="flex justify-center">
                  <Link href="/login">
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-14 px-10 rounded-full transition-all shadow-[0_0_40px_-10px_rgba(93,93,255,0.6)] flex items-center gap-2 text-lg">
                          Get started for free
                      </button>
                  </Link>
              </div>
          </div>
      </section>
      
      {/* Footer Simple */}
      <footer className="border-t border-white/5 mt-20 py-12 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Domi Inc. Curated by You.</p>
      </footer>
    </div>
  );
}
