"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Menu } from 'lucide-react'
import type { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import NavbarAttendance from './NavbarAttendance'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Navbar({
  profile,
  attendance,
}: {
  profile: Pick<Profile, 'full_name' | 'role'>
  attendance?: { check_in: string | null; check_out: string | null }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <Menu size={20} />
        </button>
        <p className="hidden md:block text-sm text-slate-400">{today}</p>
      </div>

      <div className="flex items-center gap-3 relative">
        <NavbarAttendance initialData={attendance} />

        <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-1.5 py-1 hover:bg-slate-50"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
            {getInitials(profile.full_name)}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-900 leading-tight">{profile.full_name}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{profile.role.replace('_', ' ')}</p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-14 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut size={14} className="text-slate-500" />
              <span>{signingOut ? 'Keluar...' : 'Logout'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
