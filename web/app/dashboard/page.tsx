
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Search, Settings, Loader2 } from 'lucide-react'

// Mock Data for MVP
const MOCK_CLIPS = [
  { id: 1, type: 'image', title: 'Neon City', src: 'https://images.unsplash.com/photo-1514525253440-b393452e8d2e?auto=format&fit=crop&w=500&q=80', tags: ['Inspiration', 'Cyberpunk'] },
  { id: 2, type: 'text', title: 'Design Principles', content: 'Good design is as little design as possible.', tags: ['Quotes', 'Design'] },
  { id: 3, type: 'url', title: 'Next.js Documentation', src: 'https://nextjs.org', description: 'The React Framework for the Web', tags: ['Dev', 'Docs'] },
  { id: 4, type: 'image', title: 'Abstract Shapes', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80', tags: ['Art', '3D'] },
  { id: 5, type: 'text', title: 'Todo List', content: '- Buy milk\n- Walk dog\n- Code Domi', tags: ['Personal'] },
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
        } else {
            setUser(user)
        }
        setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-background/50 backdrop-blur-md py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Domi</h1>
          
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors cursor-text w-64">
            <Search className="w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search your mind..." className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-full" />
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20" />
        </div>
      </header>

      {/* Masonry Feed (Simulated with Columns for now) */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {MOCK_CLIPS.map((clip) => (
          <div key={clip.id} className="break-inside-avoid mb-6 group">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer">
              
              {clip.type === 'image' && (
                <div className="relative">
                   <img src={clip.src} alt={clip.title} className="w-full h-auto object-cover" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              )}
              
              {clip.type === 'text' && (
                  <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent">
                      <p className="font-serif text-lg text-white/90 leading-relaxed">"{clip.content}"</p>
                  </div>
              )}

              {clip.type === 'url' && (
                  <div className="h-32 bg-zinc-900 flex items-center justify-center text-zinc-600">
                      <span className="text-4xl font-bold opacity-20">URL</span>
                  </div>
              )}

              <div className="p-4">
                <h3 className="font-medium text-white mb-2 group-hover:text-indigo-400 transition-colors">{clip.title}</h3>
                {clip.description && <p className="text-xs text-zinc-500 mb-3">{clip.description}</p>}
                
                <div className="flex flex-wrap gap-2">
                    {clip.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-white/5 px-2 py-1 rounded-md">{tag}</span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Card */}
        <div className="break-inside-avoid mb-6 border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer h-64">
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Add new memory</span>
        </div>
      </div>
    </div>
  )
}
