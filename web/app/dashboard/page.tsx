
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Settings, Loader2, LogOut, User, X, ExternalLink, Copy, Check, Pencil, Link as LinkIcon, Image as ImageIcon, StickyNote, FileText, Upload } from 'lucide-react'

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
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [clips, setClips] = useState(MOCK_CLIPS)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedClip, setSelectedClip] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' })
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'link' | 'image' | 'note' | 'pdf'>('link')
  const [newItemForm, setNewItemForm] = useState({ url: '', title: '', description: '', content: '', tags: '', file: null as File | null })
  const supabase = createClient()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)
  
  // File Upload State and Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0]
          setNewItemForm({...newItemForm, file: file, title: newItemForm.title || file.name.split('.')[0] })
      }
  }

  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true)
      } else if (e.type === "dragleave") {
          setDragActive(false)
      }
  }

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0]
          setNewItemForm({...newItemForm, file: file, title: newItemForm.title || file.name.split('.')[0] })
      }
  }

  const triggerFileInput = () => {
      fileInputRef.current?.click()
  }

  const closeAddModal = () => {
      setNewItemForm({ url: '', title: '', description: '', content: '', tags: '', file: null })
      setDragActive(false)
      setIsAddModalOpen(false)
  }

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

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false)
        }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const handleSignOut = async () => {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
  }

  // Debouce Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredClips = clips.filter(clip => {
      if (!debouncedSearchQuery) return true
      const query = debouncedSearchQuery.toLowerCase()
      
      // Tag Search
      if (query.startsWith('#')) {
          const tagQuery = query.slice(1)
          return clip.tags.some(tag => tag.toLowerCase().includes(tagQuery))
      }

      // Universal Search
      return (
          clip.title.toLowerCase().includes(query) ||
          (clip.description && clip.description.toLowerCase().includes(query)) ||
          (clip.type === 'text' && clip.content?.toLowerCase().includes(query)) ||
          clip.tags.some(tag => tag.toLowerCase().includes(query))
      )
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-background/50 backdrop-blur-md py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Domi</h1>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors cursor-text w-64 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-transparent">
            <Search className="w-4 h-4 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Search your mind..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
            </button>
            
            <div className="relative" ref={profileRef}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 hover:scale-105 transition-transform flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                    {!user?.user_metadata?.avatar_url && <User className="w-4 h-4 text-white/50" />}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0E0C25] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-white/5">
                            <p className="text-xs text-zinc-400 font-medium truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                            <button 
                                onClick={handleSignOut}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* Masonry Feed (Simulated with Columns for now) */}
      {/* Masonry Feed (Simulated with Columns for now) */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredClips.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-500 animate-in fade-in duration-300">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium text-white/50">No memories found for "{debouncedSearchQuery}"</p>
                <p className="text-sm">Try a different keyword or tag</p>
            </div>
        ) : (
            filteredClips.map((clip) => (
            <div key={clip.id} className="break-inside-avoid mb-6 group" onClick={() => { setSelectedClip(clip); setIsEditing(false); setEditForm({ title: clip.title, description: clip.description || '', tags: clip.tags.join(', ') }) }}>
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

                {clip.type === 'pdf' && (
                    <div className="h-32 bg-red-500/10 flex items-center justify-center text-red-500/50">
                        <FileText className="w-12 h-12" />
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
            ))
        )}

        {/* Add Card */}
        <div 
            onClick={() => setIsAddModalOpen(true)}
            className="break-inside-avoid mb-6 border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer h-64"
        >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Add new memory</span>
        </div>
      </div>

       {/* Detail Modal */}
       {selectedClip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                onClick={() => setSelectedClip(null)}
            />
            
            <div className="relative w-full max-w-5xl h-[80vh] bg-[#0E0C25] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setSelectedClip(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-full md:w-3/5 bg-black/40 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                     {selectedClip.type === 'image' && (
                        <img src={selectedClip.src} className="w-full h-full object-contain shadow-2xl rounded-lg" />
                     )}
                     
                     {selectedClip.type === 'text' && (
                         <div className="max-w-lg">
                            <p className="font-serif text-2xl md:text-3xl text-white/90 leading-relaxed">"{selectedClip.content}"</p>
                         </div>
                     )}

                     {selectedClip.type === 'url' && (
                         <div className="text-center">
                             <div className="w-32 h-32 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 mx-auto">
                                <span className="text-4xl font-bold text-zinc-600">URL</span>
                             </div>
                             <a href={selectedClip.src} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 text-lg">
                                 {selectedClip.src}
                             </a>
                         </div>
                     )}

                     {selectedClip.type === 'pdf' && (
                        <iframe 
                            src={selectedClip.src} 
                            className="w-full h-full rounded-xl shadow-2xl border-none bg-white"
                            title="PDF Preview"
                        />
                     )}
                </div>

                <div className="w-full md:w-2/5 p-8 flex flex-col h-full bg-[#0E0C25]">
                    {isEditing ? (
                        /* Edit Mode Form */
                        <div className="flex-1 flex flex-col gap-5 animate-in fade-in duration-200">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Edit Details</span>
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400">Title</label>
                                <input 
                                    type="text" 
                                    value={editForm.title} 
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400">Description</label>
                                <textarea 
                                    value={editForm.description} 
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400">Tags (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={editForm.tags} 
                                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                             </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <>
                            <div className="mb-6">
                                <span className="inline-block px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                                    {selectedClip.type.toUpperCase()}
                                </span>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedClip.title}</h2>
                                {selectedClip.description && <p className="text-zinc-400 leading-relaxed">{selectedClip.description}</p>}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClip.tags.map((tag: string) => (
                                            <span key={tag} className="text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {selectedClip.type === 'url' && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Source</h3>
                                        <a href={selectedClip.src} target="_blank" className="flex items-center gap-2 text-sm text-white hover:text-indigo-400 transition-colors truncate">
                                            <ExternalLink className="w-4 h-4" />
                                            {selectedClip.src}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    
                    <div className="pt-6 mt-auto border-t border-white/5 flex gap-3">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => {
                                        // Save Logic (Mock Update)
                                        const updatedClip = {
                                            ...selectedClip,
                                            title: editForm.title,
                                            description: editForm.description,
                                            tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
                                        }
                                        setSelectedClip(updatedClip)
                                        // In real app, we'd update Supabase here
                                        setIsEditing(false)
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </button>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Memory
                                </button>
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors border border-white/10">
                                    <Copy className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

       {/* Add Memory Modal */}
       {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                onClick={closeAddModal}
            />
            
            <div className="relative w-full max-w-2xl bg-[#0E0C25] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Add New Memory</h2>
                    <button 
                        onClick={closeAddModal}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-white/5 rounded-xl">
                        {(['link', 'image', 'note', 'pdf'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === tab 
                                    ? 'bg-indigo-600 text-white shadow-lg' 
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab === 'link' && <LinkIcon className="w-4 h-4" />}
                                {tab === 'image' && <ImageIcon className="w-4 h-4" />}
                                {tab === 'note' && <StickyNote className="w-4 h-4" />}
                                {tab === 'pdf' && <FileText className="w-4 h-4" />}
                                <span className="capitalize">{tab}</span>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Content Inputs */}
                    <div className="min-h-[150px]">
                        {activeTab === 'link' && (
                             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">URL</label>
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                                    <LinkIcon className="w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/article" 
                                        className="bg-transparent border-none outline-none text-white placeholder-zinc-600 w-full"
                                        value={newItemForm.url}
                                        onChange={(e) => setNewItemForm({...newItemForm, url: e.target.value})}
                                        autoFocus
                                    />
                                </div>
                             </div>
                        )}

                        {activeTab === 'image' && (
                             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upload Image</label>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                                <div 
                                    onClick={triggerFileInput}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer h-40 group relative overflow-hidden ${
                                        dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 text-zinc-500 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5'
                                    }`}
                                >
                                    {newItemForm.file ? (
                                        <>
                                            <img src={URL.createObjectURL(newItemForm.file)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Check className="w-8 h-8 mb-2 text-green-400" />
                                                <p className="text-sm font-medium text-white">{newItemForm.file.name}</p>
                                                <p className="text-xs text-zinc-300 mt-1">Click to change</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mb-3 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                                            <p className="text-sm font-medium group-hover:text-indigo-300">Click to upload or drag and drop</p>
                                            <p className="text-xs text-zinc-600 mt-1">SVG, PNG, JPG or GIF</p>
                                        </>
                                    )}
                                </div>
                             </div>
                        )}

                        {activeTab === 'note' && (
                             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Note Content</label>
                                <textarea 
                                    placeholder="Write your thoughts..." 
                                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                                    value={newItemForm.content}
                                    onChange={(e) => setNewItemForm({...newItemForm, content: e.target.value})}
                                    autoFocus
                                />
                             </div>
                        )}

                        {activeTab === 'pdf' && (
                             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upload PDF</label>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept=".pdf" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                                <div 
                                    onClick={triggerFileInput}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer h-40 group relative overflow-hidden ${
                                        dragActive ? 'border-red-500 bg-red-500/10' : 'border-white/10 text-zinc-500 hover:text-white hover:border-red-500/50 hover:bg-red-500/5'
                                    }`}
                                >
                                    {newItemForm.file ? (
                                        <>
                                            <div className="flex flex-col items-center z-10">
                                                <FileText className="w-8 h-8 mb-2 text-red-400" />
                                                <p className="text-sm font-medium text-white">{newItemForm.file.name}</p>
                                                <p className="text-xs text-zinc-300 mt-1">{(newItemForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-8 h-8 mb-3 text-zinc-600 group-hover:text-red-400 transition-colors" />
                                            <p className="text-sm font-medium group-hover:text-red-300">Click to upload PDF</p>
                                            <p className="text-xs text-zinc-600 mt-1">Maximum size 10MB</p>
                                        </>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Title (Optional)</label>
                             <input 
                                 type="text" 
                                 placeholder="Give it a name" 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.title}
                                 onChange={(e) => setNewItemForm({...newItemForm, title: e.target.value})}
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description (Optional)</label>
                             <input 
                                 type="text" 
                                 placeholder="Add a brief description" 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.description}
                                 onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})}
                             />
                        </div>
                        <div className="col-span-2 space-y-2">
                             <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tags</label>
                             <input 
                                 type="text" 
                                 placeholder="design, ideas, ..." 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.tags}
                                 onChange={(e) => setNewItemForm({...newItemForm, tags: e.target.value})}
                             />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20">
                    <button 
                        onClick={closeAddModal}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            // Mock Save logic handling File Object URL
                            let previewSrc = newItemForm.url
                            if ((activeTab === 'image' || activeTab === 'pdf') && newItemForm.file) {
                                previewSrc = URL.createObjectURL(newItemForm.file)
                            }
                            
                            const newClip: any = {
                                id: clips.length + 1,
                                type: activeTab === 'link' ? 'url' : (activeTab === 'note' ? 'text' : activeTab),
                                title: newItemForm.title || 'Untitled Memory',
                                content: newItemForm.content,
                                src: previewSrc || 'https://example.com',
                                description: newItemForm.description || (newItemForm.file ? `Uploaded: ${newItemForm.file.size} bytes` : 'Added manually'),
                                tags: newItemForm.tags.split(',').map(t => t.trim()).filter(Boolean)
                            }
                            setClips([newClip, ...clips])
                            setNewItemForm({ url: '', title: '', description: '', content: '', tags: '', file: null })
                            setIsAddModalOpen(false)
                        }}
                        className="px-8 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.02]"
                    >
                        Create Memory
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
