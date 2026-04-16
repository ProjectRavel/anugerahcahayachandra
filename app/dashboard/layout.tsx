import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'
import type { Profile } from '@/types/database'

type LayoutProfile = Pick<Profile, 'id' | 'full_name' | 'role'>
type AttendanceSnapshot = { check_in: string | null; check_out: string | null }

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()
  const profile = profileData as LayoutProfile | null

  if (!profile) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('check_in, check_out')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()
  const attendance = attendanceData as AttendanceSnapshot | null

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar role={profile.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar profile={profile} attendance={attendance || undefined} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
