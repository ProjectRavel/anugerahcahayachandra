import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'

type StaffRow = {
  id: string
  full_name: string
  role: string
  status: 'active' | 'inactive'
  created_at: string
}

type AttendanceRow = {
  user_id: string
}

export default async function HrPage() {
  const supabase = await createClient()

  const [profilesRes, attendanceRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, status, created_at')
      .order('full_name', { ascending: true }),
    supabase
      .from('attendance')
      .select('user_id')
      .eq('date', new Date().toISOString().slice(0, 10)),
  ])

  const staff = (profilesRes.data ?? []) as StaffRow[]
  const attendanceRows = (attendanceRes.data ?? []) as AttendanceRow[]
  const attendanceSet = new Set(attendanceRows.map((r) => r.user_id))

  const totalStaff = staff.length
  const activeStaff = staff.filter((s) => s.status === 'active').length
  const presentToday = attendanceSet.size

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SDM & Absensi</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Ringkasan karyawan dan kehadiran hari ini untuk tim HR dan manajemen.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan SDM
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard title="Total Staff" value={totalStaff} subtitle="semua role" accent="indigo" />
          <StatsCard
            title="Aktif"
            value={activeStaff}
            subtitle="status active"
            accent="emerald"
          />
          <StatsCard
            title="Hadir Hari Ini"
            value={presentToday}
            subtitle="sudah check-in"
            accent="amber"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Daftar Staff
          </h2>
          <span className="text-xs text-slate-400">{staff.length} orang</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Kehadiran Hari Ini</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada data staff.
                  </td>
                </tr>
              ) : (
                staff.map((s) => {
                  const isPresent = attendanceSet.has(s.id)

                  return (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-xs text-slate-700">{s.full_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{s.role}</td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            s.status === 'active'
                              ? 'inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]'
                              : 'inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]'
                          }
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            isPresent
                              ? 'inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px]'
                              : 'inline-flex px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[11px]'
                          }
                        >
                          {isPresent ? 'HADIR' : 'BELUM CHECK-IN'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
