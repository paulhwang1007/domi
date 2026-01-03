
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Settings, Loader2, LogOut, User, X, ExternalLink, Copy, Check, Pencil, Link as LinkIcon, Image as ImageIcon, StickyNote, FileText, Upload, LayoutGrid, Folder, ChevronRight, ImageOff, Trash } from 'lucide-react'



export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [clips, setClips] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<'feed' | 'groups'>('feed')
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null)
  
  // Group Creation State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedClip, setSelectedClip] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '', groupId: '' })
  
  // Image Error State
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [modalImageError, setModalImageError] = useState(false)
  
  // Add Existing to Group State
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false)

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'link' | 'image' | 'note' | 'pdf'>('link')
  const [newItemForm, setNewItemForm] = useState({ url: '', title: '', description: '', content: '', tags: '', file: null as File | null, groupId: '' })
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
      setNewItemForm({ url: '', title: '', description: '', content: '', tags: '', file: null, groupId: '' })
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
            fetchData()
        }
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

  const fetchData = async () => {
      setLoading(true)
      const [clipsRes, groupsRes] = await Promise.all([
          supabase.from('clips').select('*').order('created_at', { ascending: false }),
          supabase.from('groups').select('*').order('created_at', { ascending: false })
      ])

      const fetchedGroups = groupsRes.data || []
      const fetchedClips = clipsRes.data || []

      // Calculate counts manually for now
      const groupsWithCounts = fetchedGroups.map(group => ({
          ...group,
          count: fetchedClips.filter((c: any) => c.group_id === group.id).length
      }))

      setClips(fetchedClips)
      setGroups(groupsWithCounts)
      setLoading(false)
  }

  const handleCreateGroup = async () => {
    if (!newGroupTitle.trim()) return
    const color = ['indigo', 'emerald', 'purple', 'rose', 'orange'][Math.floor(Math.random() * 5)]
    
    const { data, error } = await supabase.from('groups').insert({
        title: newGroupTitle,
        color: color,
        user_id: user.id
    }).select().single()

    if (data) {
        setGroups([{ ...data, count: 0 }, ...groups])
        setNewGroupTitle('')
        setIsGroupModalOpen(false)
    }
  }

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!confirm('Are you sure you want to delete this group? Memories will be kept but uncategorized.')) return

      // 1. Uncategorize clips
      const { error: updateError } = await supabase.from('clips').update({ group_id: null }).eq('group_id', groupId)
      if (updateError) {
          alert('Failed to update memories: ' + updateError.message)
          return
      }

      // 2. Delete group
      const { error: deleteError } = await supabase.from('groups').delete().eq('id', groupId)
      if (deleteError) {
          alert('Failed to delete group: ' + deleteError.message)
          return
      }

      // Update local state
      setGroups(groups.filter(g => g.id !== groupId))
      setClips(clips.map(c => c.group_id === groupId ? { ...c, group_id: null } : c))
  }


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
      // Group Filter
      if (activeGroupFilter && clip.group_id !== activeGroupFilter) {
          return false
      }

      if (!debouncedSearchQuery) return true
      const query = debouncedSearchQuery.toLowerCase()
      
      // Tag Search
      if (query.startsWith('#')) {
          const tagQuery = query.slice(1)
          return clip.tags && clip.tags.some((tag: string) => tag.toLowerCase().includes(tagQuery))
      }

      // Universal Search
      return (
          clip.title.toLowerCase().includes(query) ||
          (clip.description && clip.description.toLowerCase().includes(query)) ||
          (clip.type === 'text' && clip.content?.toLowerCase().includes(query)) ||
          (clip.tags && clip.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      )
  })

  // Filter Groups
  const filteredGroups = groups.filter(group => {
      if (!debouncedSearchQuery) return true
      return group.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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

      {/* View Switcher / Navigation */}
      <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-1">
        <button 
            onClick={() => { setCurrentView('feed'); setActiveGroupFilter(null) }}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${
                currentView === 'feed' && !activeGroupFilter
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
            <LayoutGrid className="w-4 h-4" />
            All Memories
        </button>
        <button 
            onClick={() => { setCurrentView('groups'); setActiveGroupFilter(null) }}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${
                currentView === 'groups' 
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
            <Folder className="w-4 h-4" />
            Groups
        </button>

        {activeGroupFilter && (
             <div className="flex items-center gap-2 pb-3 px-1 text-sm font-medium text-white relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                <ChevronRight className="w-4 h-4 text-zinc-600" />
                <span className="text-indigo-400">{groups.find(g => g.id === activeGroupFilter)?.title}</span>
                <button 
                    onClick={() => setActiveGroupFilter(null)}
                    className="ml-2 bg-white/10 hover:bg-white/20 p-0.5 rounded-full transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
             </div>
        )}
      </div>

      {currentView === 'groups' && !activeGroupFilter ? (
          /* Groups Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredGroups.length === 0 && debouncedSearchQuery ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-500 animate-in fade-in duration-300">
                      <Folder className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium text-white/50">No groups found for "{debouncedSearchQuery}"</p>
                  </div>
              ) : (
                  <>
                    {filteredGroups.map(group => (
                        <div 
                            key={group.id} 
                            onClick={() => { setActiveGroupFilter(group.id); setCurrentView('feed'); setSearchQuery('') }}
                            className="aspect-square bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative"
                        >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleDeleteGroup(group.id, e)}
                                        className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                        title="Delete Group"
                                    >
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${group.color}-500/10 text-${group.color}-400 group-hover:scale-110 transition-transform`}>
                                    <Folder className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-semibold text-white mb-1">{group.title}</h3>
                                    <p className="text-xs text-zinc-500">{group.count} memories</p>
                                </div>
                        </div>
                    ))}
                    
                    {/* Add Group Card - Only show if not searching or if explicitly desired behavior (leaving it visible during search might be confusing if it doesn't match query, but standard is usually to hide "add" cards during filtering unless specific design) 
                        For now, I will hide "Add Group" if searching to avoid clutter, or keep it as the last item if query is empty.
                    */}
                    {!debouncedSearchQuery && (
                        <div 
                            className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                            onClick={() => setIsGroupModalOpen(true)}
                        >
                            <Plus className="w-8 h-8" />
                            <span className="text-sm font-medium">New Group</span>
                        </div>
                    )}
                  </>
              )}
          </div>
      ) : (
      /* Masonry Feed */
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredClips.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-500 animate-in fade-in duration-300">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium text-white/50">No memories found for "{debouncedSearchQuery}"</p>
                <p className="text-sm">Try a different keyword or tag</p>
            </div>
        ) : (
            filteredClips.map((clip) => (
            <div key={clip.id} className="break-inside-avoid mb-6 group" onClick={() => { setSelectedClip(clip); setModalImageError(false); setIsEditing(false); setEditForm({ title: clip.title || '', description: clip.description || '', tags: clip.tags ? clip.tags.join(', ') : '', groupId: clip.group_id || '' }) }}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer">
                
                {clip.type === 'image' && (
                    <div className="relative">
                        {failedImages.has(clip.id) ? (
                            <div className="w-full aspect-video bg-white/5 flex flex-col items-center justify-center text-zinc-600">
                                <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs font-medium">Image not found</span>
                            </div>
                        ) : (
                            <img 
                                src={clip.src_url} 
                                alt={clip.title || 'Clip'} 
                                className="w-full h-auto object-cover" 
                                onError={() => setFailedImages(prev => new Set(prev).add(clip.id))}
                            />
                        )}
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
                        {clip.tags && clip.tags.map((tag: string) => (
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
            onClick={() => {
                if (activeGroupFilter) {
                    setIsAddToGroupModalOpen(true)
                } else {
                    setIsAddModalOpen(true)
                }
            }}
            className="break-inside-avoid mb-6 border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer h-64"
        >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">{activeGroupFilter ? 'Add existing memory' : 'Add new memory'}</span>
        </div>
      </div>
      )}

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
                        modalImageError ? (
                            <div className="flex flex-col items-center justify-center text-zinc-600">
                                <ImageOff className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium text-zinc-500">Failed to load image</p>
                            </div>
                        ) : (
                           <img 
                               src={selectedClip.src_url} 
                               className="w-full h-full object-contain shadow-2xl rounded-lg" 
                               onError={() => setModalImageError(true)}
                           />
                        )
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
                             <a href={selectedClip.src_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 text-lg">
                                 {selectedClip.src_url}
                             </a>
                         </div>
                     )}

                     {selectedClip.type === 'pdf' && (
                        <iframe 
                            src={selectedClip.src_url} 
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

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400">Group</label>
                                <select 
                                    value={editForm.groupId}
                                    onChange={(e) => setEditForm({...editForm, groupId: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                >
                                    <option value="" className="bg-[#0E0C25]">No Group</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id} className="bg-[#0E0C25]">{g.title}</option>
                                    ))}
                                </select>
                             </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <>
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-block px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                        {selectedClip.type.toUpperCase()}
                                    </span>
                                    {selectedClip.group_id && (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-400 whitespace-nowrap">
                                            <Folder className="w-3 h-3" />
                                            {groups.find(g => g.id === selectedClip.group_id)?.title}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedClip.title}</h2>
                                {selectedClip.description && <p className="text-zinc-400 leading-relaxed">{selectedClip.description}</p>}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClip.tags && selectedClip.tags.map((tag: string) => (
                                            <span key={tag} className="text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {selectedClip.type === 'url' && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Source</h3>
                                        <a href={selectedClip.src_url} target="_blank" className="flex items-center gap-2 text-sm text-white hover:text-indigo-400 transition-colors truncate">
                                            <ExternalLink className="w-4 h-4" />
                                            {selectedClip.src_url}
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
                                    onClick={async () => {
                                        // Save Logic (Supabase Update)
                                        const tagsArray = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
                                        const { data: updatedClip, error } = await supabase.from('clips').update({
                                            title: editForm.title,
                                            description: editForm.description,
                                            tags: tagsArray,
                                            group_id: editForm.groupId || null
                                        }).eq('id', selectedClip.id).select().single()
                                        
                                        if (updatedClip) {
                                            setSelectedClip(updatedClip)
                                            // Update groups count logic
                                            const oldGroup = groups.find(g => g.id === selectedClip.group_id)
                                            const newGroup = groups.find(g => g.id === editForm.groupId)
                                            
                                            if (selectedClip.group_id !== editForm.groupId) {
                                                const updatedGroups = groups.map(g => {
                                                    if (g.id === oldGroup?.id) return {...g, count: g.count - 1}
                                                    if (g.id === newGroup?.id) return {...g, count: g.count + 1}
                                                    return g
                                                })
                                                setGroups(updatedGroups)
                                            }
                                            
                                            // Update clips list too
                                            setClips(clips.map(c => c.id === updatedClip.id ? updatedClip : c))
                                        }

                                        setIsEditing(false)
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </button>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) return
                                            
                                            const { error } = await supabase.from('clips').delete().eq('id', selectedClip.id)
                                            
                                            if (error) {
                                                alert('Failed to delete: ' + error.message)
                                                return
                                            }

                                            // Update local state
                                            setClips(clips.filter(c => c.id !== selectedClip.id))
                                            
                                            // Update group count if applicable
                                            if (selectedClip.group_id) {
                                                setGroups(groups.map(g => g.id === selectedClip.group_id ? {...g, count: g.count - 1} : g))
                                            }
                                            
                                            setSelectedClip(null)
                                        }}
                                        className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-colors border border-red-500/20"
                                        title="Delete Memory"
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </div>
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
                        <div className="col-span-2 space-y-2">
                             <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Group (Optional)</label>
                             <select 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                 value={newItemForm.groupId}
                                 onChange={(e) => setNewItemForm({...newItemForm, groupId: e.target.value})}
                             >
                                 <option value="" className="bg-[#0E0C25]">No Group</option>
                                 {groups.map(g => (
                                     <option key={g.id} value={g.id} className="bg-[#0E0C25]">{g.title}</option>
                                 ))}
                             </select>
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
                        onClick={async () => {
                            // Determine Clip Type and Source
                            const type = activeTab === 'link' ? 'url' : (activeTab === 'note' ? 'text' : activeTab)
                            let src_url = newItemForm.url
                            
                            // NOTE: File Upload to Storage Bucket would happen here.
                            // For MVP without storage setup yet, we'll just mock the URL for uploaded files or use a placeholder.
                            if ((activeTab === 'image' || activeTab === 'pdf') && newItemForm.file) {
                                if (!user) return

                                try {
                                    const file = newItemForm.file
                                    const fileExt = file.name.split('.').pop()
                                    const fileName = `${user.id}/${Date.now()}.${fileExt}`
                                    
                                    const { data: uploadData, error: uploadError } = await supabase.storage
                                        .from('domi-uploads')
                                        .upload(fileName, file)

                                    if (uploadError) {
                                        console.error('Upload Error:', uploadError)
                                        alert('Failed to upload file.')
                                        return
                                    }

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('domi-uploads')
                                        .getPublicUrl(fileName)
                                    
                                    src_url = publicUrl
                                } catch (e) {
                                    console.error('File processing error:', e)
                                    alert('Error processing file')
                                    return
                                }
                            }

                            if (!user) {
                                console.error('No user found')
                                return
                            }

                            const tagsArray = newItemForm.tags.split(',').map(t => t.trim()).filter(Boolean)

                            console.log('Attempting create with:', { type, title: newItemForm.title, tags: tagsArray, user: user.id })

                            const { data, error } = await supabase.from('clips').insert({
                                type: type,
                                title: newItemForm.title || `${type} memory`,
                                content: newItemForm.content,
                                src_url: src_url,
                                description: newItemForm.description,
                                tags: tagsArray,
                                group_id: newItemForm.groupId || null,
                                user_id: user.id
                            }).select().single()
                            
                            if (error) {
                                console.error('SUPABASE ERROR:', error)
                                alert('Error: ' + error.message)
                            }
                            
                            if (data) {
                                console.log('SUCCESS:', data)
                                setClips([data, ...clips])
                                
                                // Update group count
                                if (newItemForm.groupId) {
                                    setGroups(groups.map(g => g.id === newItemForm.groupId ? {...g, count: g.count + 1} : g))
                                }
                                
                                setNewItemForm({ url: '', title: '', description: '', content: '', tags: '', file: null, groupId: '' })
                                setIsAddModalOpen(false)
                            }
                        }}
                        className="px-8 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.02]"
                    >
                        Create Memory
                    </button>
                </div>
            </div>
        </div>
      )}

      
      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                 className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                 onClick={() => setIsGroupModalOpen(false)}
             />
             <div className="relative w-full max-w-md bg-[#0E0C25] border border-white/10 rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                 <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
                 <input 
                    type="text" 
                    placeholder="Group Name" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-6"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    autoFocus
                 />
                 <div className="flex justify-end gap-3">
                     <button 
                         onClick={() => setIsGroupModalOpen(false)}
                         className="px-6 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                         onClick={handleCreateGroup}
                         className="px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                     >
                         Create
                     </button>
                 </div>
             </div>
        </div>

      )}

      {/* Add Existing to Group Modal */}
      {isAddToGroupModalOpen && activeGroupFilter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                 className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                 onClick={() => setIsAddToGroupModalOpen(false)}
             />
             <div className="relative w-full max-w-2xl bg-[#0E0C25] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 h-[70vh]">
                 <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">
                        Add to <span className="text-indigo-400">{groups.find(g => g.id === activeGroupFilter)?.title}</span>
                    </h2>
                    <button 
                        onClick={() => setIsAddToGroupModalOpen(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                     <p className="text-sm text-zinc-500 mb-4">Select a memory to move to this group:</p>
                     
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {clips.filter(c => c.group_id !== activeGroupFilter).map(clip => (
                            <div 
                                key={clip.id}
                                onClick={async () => {
                                    // Move clip logic
                                    const { error } = await supabase.from('clips').update({ group_id: activeGroupFilter }).eq('id', clip.id)
                                    if (error) return // Handle error

                                    const oldGroup = groups.find(g => g.id === clip.group_id)
                                    const newGroup = groups.find(g => g.id === activeGroupFilter)

                                    const updatedGroups = groups.map(g => {
                                        if (g.id === oldGroup?.id) return {...g, count: g.count - 1}
                                        if (g.id === newGroup?.id) return {...g, count: g.count + 1}
                                        return g
                                    })
                                    setGroups(updatedGroups)
                                    setClips(clips.map(c => c.id === clip.id ? {...c, group_id: activeGroupFilter} : c) as any)
                                    setIsAddToGroupModalOpen(false)
                                }}
                                className="aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer relative group"
                            >
                                {clip.type === 'image' && <img src={clip.src_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                                {clip.type === 'text' && <div className="p-4 text-xs text-white/70 line-clamp-6">{clip.content}</div>}
                                {clip.type === 'url' && <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600 font-bold text-xl">URL</div>}
                                {clip.type === 'pdf' && <div className="w-full h-full flex items-center justify-center bg-red-500/10 text-red-500/50"><FileText className="w-8 h-8" /></div>}
                                
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs font-medium text-white truncate">{clip.title}</p>
                                </div>
                            </div>
                        ))}
                        {clips.filter(c => c.group_id !== activeGroupFilter).length === 0 && (
                            <div className="col-span-full py-12 text-center text-zinc-500">
                                <p>No other memories available to add.</p>
                            </div>
                        )}
                     </div>
                 </div>
             </div>
        </div>
      )}
    </div>
  )
}
