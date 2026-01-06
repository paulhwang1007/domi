"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ProfileDropdown({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-indigo-500/20"
      >
        {!user?.user_metadata?.avatar_url && <User className="w-5 h-5 text-white/90" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#0E0C25]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs text-zinc-400 font-medium truncate">{user?.email}</p>
          </div>
          
          <div className="p-1">
             <Link href="/dashboard" className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
             </Link>
             <button 
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
            >
                <LogOut className="w-4 h-4" />
                Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
