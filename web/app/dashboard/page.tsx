'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    LayoutGrid, List, Plus, Search, LogOut, Settings, 
    MoreVertical, Trash, ExternalLink, X, Image as ImageIcon,
    FileText, Link as LinkIcon, StickyNote, FolderPlus, FolderMinus,
    ChevronDown, Filter, Check, CheckSquare, Ghost, Loader2, User, Copy, Pencil, Upload, Folder, ChevronRight, ImageOff,
    Sparkles, Send, MessageSquare, RefreshCw, Sun, Moon, Laptop
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { z } from 'zod'

// --- Validation Schemas ---
const ClipSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    tags: z.string().max(200, "Tags string is too long").optional(), // Comma separated
    url: z.string().url("Invalid URL format").optional().or(z.literal('')),
})

const GroupSchema = z.object({
    title: z.string().min(1, "Group Name is required").max(50, "Group Name is too long")
})

// --- Mock Data ---
const MOCK_CLIPS = []
const MOCK_GROUPS = []

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const { setTheme, theme } = useTheme()
  
  // Supabase & Router
  const supabase = createClient()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)
  
  // Validation State
  const [formErrors, setFormErrors] = useState<string[]>([])

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
  const [isMainUrlHovered, setIsMainUrlHovered] = useState(false)
  
  // Add Existing to Group State
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false)
  const [addToGroupTab, setAddToGroupTab] = useState<'create' | 'existing'>('create')
  const [existingToGroupSelection, setExistingToGroupSelection] = useState<Set<string>>(new Set())

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'link' | 'image' | 'note' | 'pdf'>('link')
  const [newItemForm, setNewItemForm] = useState({ url: '', title: '', description: '', content: '', tags: '', file: null as File | null, groupId: '' })
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null) // Stores ID of item being deleted (or 'current' for modal)

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Reset chat state when a new clip is selected
  useEffect(() => {
    if (selectedClip) {
        setIsChatOpen(false)
        setChatMessages([])
        setChatInput('')
    }
  }, [selectedClip])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedClip) return
    
    const userMsg = chatInput
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatInput('')
    setIsChatLoading(true)

    // Scroll to bottom
    setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('https://ebynzdfllhomhlcraogx.supabase.co/functions/v1/chat-with-clip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                messages: [...chatMessages, { role: 'user', content: userMsg }],
                context: selectedClip.content || selectedClip.description || selectedClip.title // Fallbacks
            })
        })
        
        const data = await response.json()
        if (data.error) throw new Error(data.error)

        setChatMessages(prev => [...prev, { role: 'ai', content: data.response }])
    } catch (e: any) {
        setChatMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble thinking about that. " + e.message }])
    } finally {
        setIsChatLoading(false)
        setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }
  
  // File Upload State and Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedItems)
      if (newSelected.has(id)) {
          newSelected.delete(id)
      } else {
          newSelected.add(id)
      }
      setSelectedItems(newSelected)
  }

  const handleBulkDelete = async () => {
      // Stub for later
      console.log('Delete items:', selectedItems)
  }

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
      setIsAddModalOpen(false)
      setFormErrors([])
      setNewItemForm({ url: '', title: '', description: '', content: '', tags: '', file: null, groupId: '' })
      setDragActive(false)
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
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setIsSettingsOpen(false)
        }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
      setLoading(true)
      
      // Fetch Clips
      const { data: clipsData, error: clipsError } = await supabase
          .from('clips')
          .select('*')
          .order('created_at', { ascending: false })

      // Fetch Groups
      const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false })

      if (clipsError) console.error('Error fetching clips:', clipsError)
      if (groupsError) console.error('Error fetching groups:', groupsError)

      const fetchedGroups = groupsData || []
      const fetchedClips = clipsData || []

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
    // Validation
    const result = GroupSchema.safeParse({ title: newGroupTitle })
    if (!result.success) {
        setFormErrors(result.error.issues.map(e => e.message))
        return
    }
    setFormErrors([])

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
      // confirm check removed as it is handled by UI state now

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

  const handleConfirmDelete = async () => {
      if (!deleteConfirmation) return

      if (deleteConfirmation === 'bulk') {
          const ids = Array.from(selectedItems)
          
          if (currentView === 'groups' && !activeGroupFilter) {
               // Bulk Delete Groups
               // 1. Uncategorize
               await supabase.from('clips').update({ group_id: null }).in('group_id', ids)
               // 2. Delete
               const { error } = await supabase.from('groups').delete().in('id', ids)
               
               if (error) {
                   alert('Failed to delete groups: ' + error.message)
               } else {
                   setGroups(groups.filter(g => !selectedItems.has(g.id)))
                   setClips(clips.map(c => selectedItems.has(c.group_id) ? { ...c, group_id: null } : c))
               }
          } else {
              // Bulk Delete Clips
              const { error } = await supabase.from('clips').delete().in('id', ids)
              if (error) {
                  alert('Failed to delete items: ' + error.message)
              } else {
                  setClips(clips.filter(c => !selectedItems.has(c.id)))
                  // Update group counts? Recalculating efficiently might be annoying but let's try
                  const deletedClipObjects = clips.filter(c => selectedItems.has(c.id))
                  const groupCountsToDecrement: Record<string, number> = {}
                  deletedClipObjects.forEach(c => {
                      if (c.group_id) {
                          groupCountsToDecrement[c.group_id] = (groupCountsToDecrement[c.group_id] || 0) + 1
                      }
                  })
                  
                  if (Object.keys(groupCountsToDecrement).length > 0) {
                      setGroups(groups.map(g => ({
                          ...g,
                          count: g.count - (groupCountsToDecrement[g.id] || 0)
                      })))
                  }
              }
          }
          setSelectedItems(new Set())
          setIsSelectionMode(false)
          setDeleteConfirmation(null)
          return
      }

      if (deleteConfirmation === 'bulk-remove-group') {
           const ids = Array.from(selectedItems)
           // Remove from group (set group_id to null)
           const { error } = await supabase.from('clips').update({ group_id: null }).in('id', ids)

           if (error) {
               alert('Failed to remove items: ' + error.message)
           } else {
               setClips(clips.map(c => selectedItems.has(c.id) ? { ...c, group_id: null } : c)) // Assuming we filtered out in view, but updating state correct
               // Update group count
               if (activeGroupFilter) {
                   setGroups(groups.map(g => g.id === activeGroupFilter ? { ...g, count: g.count - ids.length } : g))
               }
           }
           setSelectedItems(new Set())
           setIsSelectionMode(false)
           setDeleteConfirmation(null)
           return
      }

      if (deleteConfirmation === 'current' && selectedClip) {
          // Delete Memory
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
      } else {
          // Delete Group
          const groupId = deleteConfirmation
          
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
      setDeleteConfirmation(null)
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



  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md py-6 px-6 md:px-8 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5">
            <img src="/domi_icon.png" alt="Domi Logo" className="w-7 h-7" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 dark:from-violet-500 dark:to-purple-500 bg-clip-text text-transparent">Domi</h1>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-3 py-1.5 hover:bg-secondary/80 transition-colors cursor-text w-64 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-transparent">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
                type="text" 
                placeholder="Search your mind..." 
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={fetchData}
                disabled={loading}
                className={`p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh Data"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="p-3 border-b border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Appearance</p>
                            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
                                <button 
                                    onClick={() => setTheme("light")} 
                                    className={`flex-1 p-1.5 rounded-md flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Light Mode"
                                >
                                    <Sun className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setTheme("dark")} 
                                    className={`flex-1 p-1.5 rounded-md flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Dark Mode"
                                >
                                    <Moon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setTheme("system")} 
                                    className={`flex-1 p-1.5 rounded-md flex items-center justify-center transition-colors ${theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="System"
                                >
                                    <Laptop className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="relative" ref={profileRef}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-border hover:scale-105 transition-transform flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {!user?.user_metadata?.avatar_url && <User className="w-4 h-4 text-white/50" />}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-border">
                            <p className="text-xs text-muted-foreground font-medium truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                            <button 
                                onClick={handleSignOut}
                                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
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

      <main className="p-6 md:p-8 pt-0">

      {/* View Switcher / Navigation */}
      <div className="flex items-center gap-6 mb-8 border-b border-border pb-1">
        <button 
            onClick={() => { setCurrentView('feed'); setActiveGroupFilter(null) }}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${
                currentView === 'feed' && !activeGroupFilter
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <LayoutGrid className="w-4 h-4" />
            All Memories
        </button>
        <button 
            onClick={() => { setCurrentView('groups'); setActiveGroupFilter(null) }}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${
                currentView === 'groups' 
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <Folder className="w-4 h-4" />
            Groups
        </button>

        {activeGroupFilter && (
             <div className="flex items-center gap-2 pb-3 px-1 text-sm font-medium text-foreground relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-indigo-400">{groups.find(g => g.id === activeGroupFilter)?.title}</span>
                <button 
                    onClick={() => setActiveGroupFilter(null)}
                    className="ml-2 bg-secondary hover:bg-secondary/80 p-0.5 rounded-full transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
             </div>
        )}

        <div className="ml-auto flex items-center gap-3 pb-2">
            {isSelectionMode ? (
                <>
                    {activeGroupFilter && (
                        <button 
                            onClick={() => {
                                if (selectedItems.size > 0) {
                                    setDeleteConfirmation('bulk-remove-group')
                                }
                            }}
                            disabled={selectedItems.size === 0}
                            className="px-4 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from Group"
                        >
                            <FolderMinus className="w-4 h-4" />
                            Remove
                        </button>
                    )}
                    <button 
                        onClick={() => setDeleteConfirmation('bulk')}
                        disabled={selectedItems.size === 0}
                        className="px-4 py-1.5 rounded-lg bg-red-600 !text-white hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash className="w-4 h-4" />
                        Delete {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                    </button>
                    <button 
                        onClick={() => { setIsSelectionMode(false); setSelectedItems(new Set()) }}
                        className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={() => setIsSelectionMode(true)}
                        className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        title="Select Items"
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => {
                            if (currentView === 'groups' && !activeGroupFilter) {
                                setIsGroupModalOpen(true)
                            } else {
                                if (activeGroupFilter) {
                                    setNewItemForm(prev => ({...prev, groupId: activeGroupFilter}))
                                    setIsAddToGroupModalOpen(true)
                                } else {
                                    setNewItemForm(prev => ({...prev, groupId: ''}))
                                    setIsAddModalOpen(true)
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-semibold shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        {currentView === 'groups' && !activeGroupFilter ? 'New Group' : 'Add Memory'}
                    </button>
                </>
            )}
        </div>
      </div>

      {currentView === 'groups' && !activeGroupFilter ? (
          loading ? (
            /* Groups Loading Skeletons */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-card border border-border rounded-2xl animate-pulse relative overflow-hidden flex flex-col items-center justify-center p-6 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/80" />
                        <div className="space-y-2 flex flex-col items-center w-full">
                            <div className="h-4 w-24 bg-secondary/80 rounded" />
                            <div className="h-3 w-12 bg-secondary/50 rounded" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                 ))}
            </div>
          ) : (
          /* Groups Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredGroups.length === 0 && debouncedSearchQuery ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
                      <Folder className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium text-muted-foreground">No groups found for "{debouncedSearchQuery}"</p>
                  </div>
              ) : (
                  <>
                    {filteredGroups.map((group, index) => (
                        <motion.div 
                            key={group.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => { 
                                if (isSelectionMode) {
                                    toggleSelection(group.id)
                                } else {
                                    setActiveGroupFilter(group.id); setCurrentView('feed'); setSearchQuery('') 
                                }
                            }}
                            className={`aspect-square bg-card border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-accent hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative ${selectedItems.has(group.id) ? 'border-indigo-500 bg-indigo-500/10' : 'border-border'}`}
                        >
                                <div className="absolute top-2 right-2 transition-opacity">
                                    {isSelectionMode ? (
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedItems.has(group.id) ? 'bg-indigo-500 border-indigo-500' : 'border-border'}`}>
                                            {selectedItems.has(group.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmation(group.id) }}
                                            className="p-2 opacity-0 group-hover:opacity-100 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                            title="Delete Group"
                                        >
                                            <Trash className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${group.color}-500/10 text-${group.color}-400 group-hover:scale-110 transition-transform`}>
                                    <Folder className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-semibold text-foreground mb-1">{group.title}</h3>
                                    <p className="text-xs text-muted-foreground">{group.count} memories</p>
                                </div>
                        </motion.div>
                    ))}
                    
                    {/* Add Group Card - Only show if not searching or if explicitly desired behavior (leaving it visible during search might be confusing if it doesn't match query, but standard is usually to hide "add" cards during filtering unless specific design) 
                        For now, I will hide "Add Group" if searching to avoid clutter, or keep it as the last item if query is empty.
                    */}

                  </>
              )}
          </div>

      )) : (
      /* Masonry Feed */
      loading ? (
        /* Loading Skeletons */
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
             {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="break-inside-avoid mb-6 bg-card border border-border rounded-2xl animate-pulse relative overflow-hidden flex flex-col">
                    <div className="w-full h-48 bg-secondary/80" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 w-3/4 bg-secondary/80 rounded" />
                        <div className="h-3 w-1/2 bg-secondary/50 rounded" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                </div>
             ))}
        </div>
      ) : clips.length === 0 ? (
          /* Empty State */
          <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-[60vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-3xl bg-white/5"
          >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to your External Brain</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                  Domi helps you capture, organize, and chat with your digital life. 
                  Start by adding your first memory.
              </p>
              <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
              >
                  <Plus className="w-5 h-5" />
                  Create Memory
              </button>
          </motion.div>
      ) : filteredClips.length === 0 ? (
          /* No Search Results or Group Empty */
          activeGroupFilter && !debouncedSearchQuery ? (
               <div className="col-span-full h-[50vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-3xl bg-secondary/20 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                        <FolderPlus className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">This group is empty</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Start building this collection by adding relevant memories.
                    </p>
                    <button 
                        onClick={() => {
                            setNewItemForm(prev => ({...prev, groupId: activeGroupFilter}))
                            setIsAddToGroupModalOpen(true)
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add to Group
                    </button>
               </div>
          ) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No memories found for "{debouncedSearchQuery}"</p>
              <p className="text-sm">Try a different keyword or tag</p>
          </div>
          )
      ) : (
          /* Masonry Feed */
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filteredClips.map((clip, index) => (
                <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                    key={clip.id} 
                    className="break-inside-avoid mb-6 group relative" 
                    onClick={() => { 
                        if (isSelectionMode) {
                            toggleSelection(clip.id)
                        } else {
                            setSelectedClip(clip); setModalImageError(false); setIsEditing(false); setDeleteConfirmation(null); setEditForm({ title: clip.title || '', description: clip.description || '', tags: clip.tags ? clip.tags.join(', ') : '', groupId: clip.group_id || '' }) 
                        }
                    }}
                >
                    {isSelectionMode && (
                        <div className="absolute top-3 right-3 z-10">
                             <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm ${selectedItems.has(clip.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/50 hover:border-white'}`}>
                                {selectedItems.has(clip.id) && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                        </div>
                    )}
                    <div className={`bg-card backdrop-blur-sm border rounded-2xl overflow-hidden hover:border-border/80 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer ${selectedItems.has(clip.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/5' : 'border-border'}`}>
                    
                    {clip.type === 'image' && (
                        <div className="relative">
                            {failedImages.has(clip.id) ? (
                                <div className="w-full aspect-video bg-secondary flex flex-col items-center justify-center text-muted-foreground">
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
                            <p className="font-serif text-lg text-foreground/90 leading-relaxed">"{clip.content}"</p>
                        </div>
                    )}

                    {clip.type === 'url' && (
                        (clip.metadata as any)?.og_image ? (
                             <div className="relative group/url aspect-video bg-black">
                                <img src={(clip.metadata as any).og_image} className="w-full h-full object-cover opacity-80 group-hover/url:opacity-100 transition-opacity" alt="URL Preview" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/50 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover/url:opacity-100 transition-all transform scale-90 group-hover/url:scale-100">
                                        <LinkIcon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <div className="h-32 bg-secondary flex items-center justify-center text-muted-foreground">
                                <span className="text-4xl font-bold opacity-20">URL</span>
                            </div>
                        )
                    )}

                    {clip.type === 'pdf' && (
                        <div className="h-32 bg-red-500/10 flex items-center justify-center text-red-500/50">
                            <FileText className="w-12 h-12" />
                        </div>
                    )}

                    <div className="p-4">
                        <h3 className="font-medium text-foreground mb-2 group-hover:text-indigo-400 transition-colors">{clip.title}</h3>
                        {clip.description && <p className="text-xs text-muted-foreground mb-3">{clip.description}</p>}
                        
                        <div className="flex flex-wrap gap-2">
                            {clip.tags && clip.tags.map((tag: string) => (
                                <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded-md">{tag}</span>
                            ))}
                        </div>
                    </div>
                    </div>

                </motion.div>
            ))}
          </div>
      )) }

       {/* Detail Modal */}
       <AnimatePresence>
       {selectedClip && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={() => setSelectedClip(null)}
            />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-6xl h-[92vh] md:h-[85vh] bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row isolate"
            >
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button 
                        onClick={() => { setSelectedClip(null); setIsChatOpen(false); setChatMessages([]) }}
                        className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-transparent"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-full md:w-3/5 bg-white/30 dark:bg-zinc-900/50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-border relative overflow-hidden">
                     {selectedClip.type === 'image' && (
                        modalImageError ? (
                            <motion.div layout className="flex flex-col items-center justify-center text-muted-foreground">
                                <ImageOff className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium text-muted-foreground">Failed to load image</p>
                            </motion.div>
                        ) : (
                           <motion.img 
                               layout
                               src={selectedClip.src_url} 
                               className="w-full h-full object-contain shadow-2xl rounded-lg" 
                               onError={() => setModalImageError(true)}
                           />
                        )
                     )}
                     
                     {selectedClip.type === 'text' && (
                         <motion.div layout className="max-w-lg max-h-full overflow-y-auto custom-scrollbar p-2">
                            <motion.p layout className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed whitespace-pre-wrap">"{selectedClip.content}"</motion.p>
                         </motion.div>
                     )}

                     {selectedClip.type === 'url' && (
                         <div className="text-center w-full h-full flex flex-col items-center justify-center p-8">
                             {(selectedClip.metadata as any)?.og_image ? (
                                <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl mb-8 relative group border border-border">
                                    <img src={(selectedClip.metadata as any).og_image} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                             ) : (
                                <div className="w-32 h-32 rounded-2xl bg-secondary flex items-center justify-center mb-6 mx-auto shadow-xl">
                                    <span className="text-4xl font-bold text-muted-foreground">URL</span>
                                </div>
                             )}
                             <a 
                               href={selectedClip.src_url} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="underline underline-offset-4 text-lg font-semibold break-all max-w-md line-clamp-2 text-center transition-colors"
                               onMouseEnter={() => setIsMainUrlHovered(true)}
                               onMouseLeave={() => setIsMainUrlHovered(false)}
                               style={{ 
                                   color: theme === 'dark' 
                                     ? (isMainUrlHovered ? '#a5b4fc' : '#818cf8') 
                                     : (isMainUrlHovered ? '#8b5cf6' : '#6d28d9') 
                               }}
                             >
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

                <div className="w-full md:w-2/5 p-8 flex flex-col h-full bg-background relative">
                    
                    {/* Tab Header */}
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl mb-6 mr-12">
                        <button
                             onClick={() => setIsChatOpen(false)}
                             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${!isChatOpen ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider">Details</span>
                        </button>
                        <button
                             onClick={() => setIsChatOpen(true)}
                             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${isChatOpen ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Chat</span>
                        </button>
                    </div>

                    {isChatOpen ? (
                        <>
                             {/* Chat Messages */}
                             <div className="flex-1 overflow-y-auto -mx-8 px-8 space-y-4 custom-scrollbar">
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Ask me anything!</p>
                                            <p className="text-xs mt-1">"Summarize this", "What are the key takeaways?", "Explain like I'm 5"</p>
                                        </div>
                                    </div>
                                )}
                                
                                {chatMessages.map((msg, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                    >
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                            : 'bg-secondary text-foreground rounded-tl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                     <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-secondary rounded-2xl px-4 py-3 rounded-tl-sm flex gap-1 items-center">
                                            <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} />
                                            <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.1 }} />
                                            <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} />
                                        </div>
                                     </div>
                                )}
                                <div ref={chatScrollRef} />
                             </div>

                             {/* Chat Input */}
                             <div className="pt-6 mt-4 border-t border-border">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="ask a question..." 
                                        className="w-full bg-secondary/50 border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                        </>
                    ) : isEditing ? (
                        /* Edit Mode Form */
                        <div className="flex-1 flex flex-col gap-5 animate-in fade-in duration-200">
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                                <input 
                                    type="text" 
                                    value={editForm.title} 
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                                <textarea 
                                    value={editForm.description} 
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    rows={3}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Tags (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={editForm.tags} 
                                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Group</label>
                                <select 
                                    value={editForm.groupId}
                                    onChange={(e) => setEditForm({...editForm, groupId: e.target.value})}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                >
                                    <option value="" className="bg-popover text-foreground">No Group</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id} className="bg-popover text-foreground">{g.title}</option>
                                    ))}
                                </select>
                             </div>
                             
                             <div className="pt-6 mt-auto border-t border-border flex gap-3">
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
                                        className="px-6 bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    
                                    <button 
                                        onClick={() => setDeleteConfirmation('current')}
                                        className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-3 rounded-xl transition-colors border border-red-500/20"
                                        title="Delete Memory"
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <>
                            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                                <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-block px-2 py-1 rounded-md bg-secondary border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {selectedClip.type.toUpperCase()}
                                    </span>
                                    {selectedClip.group_id && (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-400 whitespace-nowrap">
                                            <Folder className="w-3 h-3" />
                                            {groups.find(g => g.id === selectedClip.group_id)?.title}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-4">{selectedClip.title}</h2>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClip.tags && selectedClip.tags.map((tag: string) => (
                                            <span 
                                                key={tag} 
                                                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                                                style={{ 
                                                    backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#ede9fe', 
                                                    color: theme === 'dark' ? '#a5b4fc' : '#6d28d9', 
                                                    borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#ddd6fe' 
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {selectedClip.type === 'url' && (
                                        <div className="flex flex-col gap-3">
                                            {(selectedClip.metadata as any)?.og_image && (
                                                <div className="rounded-xl overflow-hidden border border-border relative group">
                                                    <img src={(selectedClip.metadata as any).og_image} className="w-full h-auto max-h-64 object-cover" alt="Preview" />
                                                    <a href={selectedClip.src_url} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="w-8 h-8 text-white" />
                                                    </a>
                                                </div>
                                            )}
                                            <a 
                                              href={selectedClip.src_url} 
                                              target="_blank" 
                                              className="flex items-center gap-2 text-sm transition-colors truncate w-fit bg-secondary/50 px-3 py-2 rounded-lg border border-border hover:border-[#ddd6fe] dark:hover:border-indigo-500/30"
                                              style={{ color: theme === 'dark' ? '#818cf8' : '#6d28d9' }}
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                <span className="truncate max-w-[300px]">{selectedClip.src_url}</span>
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                        </div>
                                    )}
                                    {selectedClip.description && <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedClip.description}</p>}
                                </div>
                            </div>
                            </div>
                            
                            <div className="pt-6 mt-auto border-t border-border flex gap-3">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-foreground text-background font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Memory
                                </button>
                                <button className="p-3 bg-secondary hover:bg-secondary/80 rounded-xl text-foreground transition-colors border border-border">
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

       {/* Add Memory Modal */}
       {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                onClick={closeAddModal}
            />
            
            <div className="relative w-full max-w-2xl bg-popover border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Add New Memory</h2>
                    <button 
                        onClick={closeAddModal}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-secondary rounded-xl">
                        {(['link', 'image', 'note', 'pdf'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === tab 
                                    ? 'bg-primary text-primary-foreground shadow-lg' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
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
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL</label>
                                <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/article" 
                                        className="bg-transparent border-none outline-none text-foreground placeholder-muted-foreground w-full"
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
                                        dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/50 hover:bg-indigo-500/5'
                                    }`}
                                >
                                     {newItemForm.file ? (
                                        <>
                                            <img src={URL.createObjectURL(newItemForm.file)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Check className="w-8 h-8 mb-2 text-green-400" />
                                                <p className="text-sm font-medium text-foreground">{newItemForm.file.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                            <p className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300">Click to upload or drag and drop</p>
                                            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF</p>
                                        </>
                                    )}
                                </div>
                             </div>
                        )}

                        {activeTab === 'note' && (
                             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note Content</label>
                                <textarea 
                                    placeholder="Write your thoughts..." 
                                    className="w-full h-40 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
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
                                        dragActive ? 'border-red-500 bg-red-500/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-red-500/50 hover:bg-red-500/5'
                                    }`}
                                >
                                    {newItemForm.file ? (
                                        <>
                                            <div className="flex flex-col items-center z-10">
                                                <FileText className="w-8 h-8 mb-2 text-red-400" />
                                                <p className="text-sm font-medium text-foreground">{newItemForm.file.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{(newItemForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                                            <p className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-300">Click to upload PDF</p>
                                            <p className="text-xs text-muted-foreground mt-1">Maximum size 10MB</p>
                                        </>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>



                    {/* Validation Errors */}
                    {formErrors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {formErrors.map((err, i) => (
                                <p key={i} className="text-xs text-red-400 flex items-center gap-2">
                                    <X className="w-3 h-3" /> {err}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                             <input 
                                 type="text" 
                                 placeholder="Give it a name" 
                                 className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.title}
                                 onChange={(e) => setNewItemForm({...newItemForm, title: e.target.value})}
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                             <input 
                                 type="text" 
                                 placeholder="Add a brief description" 
                                 className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.description}
                                 onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})}
                             />
                        </div>
                        <div className="col-span-2 space-y-2">
                             <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                             <input 
                                 type="text" 
                                 placeholder="design, ideas, ..." 
                                 className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                 value={newItemForm.tags}
                                 onChange={(e) => setNewItemForm({...newItemForm, tags: e.target.value})}
                             />
                        </div>
                        <div className="col-span-2 space-y-2">
                             <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group (Optional)</label>
                             <select 
                                 className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                 value={newItemForm.groupId}
                                 onChange={(e) => setNewItemForm({...newItemForm, groupId: e.target.value})}
                             >
                                 <option value="" className="bg-popover">No Group</option>
                                 {groups.map(g => (
                                     <option key={g.id} value={g.id} className="bg-popover">{g.title}</option>
                                 ))}
                             </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/20">
                    <button 
                        onClick={closeAddModal}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={async () => {
        // Validation
        const payload = {
            title: newItemForm.title,
            description: newItemForm.description,
            tags: newItemForm.tags,
            url: newItemForm.url
        }
        const result = ClipSchema.safeParse(payload)
        if (!result.success) {
             setFormErrors(result.error.issues.map(e => e.message))
             return
        }
        setFormErrors([])

        if (!user) return

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

      
        {isGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                 className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                 onClick={() => setIsGroupModalOpen(false)}
             />
             <div className="relative w-full max-w-md bg-popover border border-border rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                 <h2 className="text-xl font-bold text-foreground mb-4">Create New Group</h2>
                 <input 
                    type="text" 
                    placeholder="Group Name" 
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-6"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    autoFocus
                 />
                 <div className="flex justify-end gap-3">
                     <button 
                         onClick={() => setIsGroupModalOpen(false)}
                         className="px-6 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
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
             <div className="relative w-full max-w-2xl bg-popover border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 h-[70vh]">
                 <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        Add to <span className="text-indigo-400">{groups.find(g => g.id === activeGroupFilter)?.title}</span>
                    </h2>
                    <button 
                        onClick={() => setIsAddToGroupModalOpen(false)}
                        className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                     <button 
                        onClick={() => {
                            setIsAddToGroupModalOpen(false)
                            setNewItemForm(prev => ({...prev, groupId: activeGroupFilter}))
                            setIsAddModalOpen(true)
                        }}
                        className="w-full mb-6 p-4 rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 group"
                     >
                        <Plus className="w-5 h-5 text-muted-foreground group-hover:text-indigo-400" />
                        <span className="font-medium text-muted-foreground group-hover:text-foreground">Create a new memory in this group</span>
                     </button>

                     <p className="text-sm text-muted-foreground mb-4 font-medium sticky top-0 bg-popover py-2 z-10">Or select an existing memory:</p>
                     
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
                                className="aspect-square bg-secondary border border-border rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer relative group"
                            >
                                {clip.type === 'image' && <img src={clip.src_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                                {clip.type === 'text' && <div className="p-4 text-xs text-muted-foreground line-clamp-6">{clip.content}</div>}
                                {clip.type === 'url' && (
                                    (clip.metadata as any)?.og_image ? (
                                        <img src={(clip.metadata as any).og_image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground font-bold text-xl">URL</div>
                                    )
                                )}
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
       {/* Delete Confirmation Modal */}
       {deleteConfirmation && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div 
                   className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
                   onClick={() => setDeleteConfirmation(null)}
               />
               <div className="relative w-full max-w-sm bg-popover border border-border rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${deleteConfirmation === 'bulk-remove-group' ? 'bg-orange-500/10' : 'bg-red-500/10'}`}>
                        {deleteConfirmation === 'bulk-remove-group' ? <FolderMinus className="w-8 h-8 text-orange-500" /> : <Trash className="w-8 h-8 text-red-500" />}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {deleteConfirmation === 'bulk-remove-group' ? 'Remove from Group?' : 'Are you sure?'}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        {deleteConfirmation === 'current' 
                            ? "This will permanently delete this memory. This action cannot be undone."
                            : deleteConfirmation === 'bulk-remove-group'
                            ? "These memories will be removed from this group but will remain safe in your 'All Memories'."
                            : deleteConfirmation === 'bulk'
                            ? `This will permanently delete ${selectedItems.size} items. This action cannot be undone.`
                            : "This will delete the group. Any memories inside will be moved to 'All Memories' and kept safe."
                        }
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteConfirmation(null)}
                            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${
                                deleteConfirmation === 'bulk-remove-group' 
                                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' 
                                : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                            }`}
                        >
                            {deleteConfirmation === 'bulk-remove-group' ? 'Yes, Remove' : 'Yes, Delete'}
                        </button>
                    </div>
               </div>
           </div>
       )}

      </main>
    </div>
  )
}
