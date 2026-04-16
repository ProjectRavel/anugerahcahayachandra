import { createClient } from '@/lib/supabase/server'

type StaffRow = {
  id: string
  role: string
  status: 'active' | 'inactive'
}

export default async function HrReportsPage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const start = new Date(today)
  start.setDate(start.getDate() - 6)
  const startStr = start.toISOString().slice(0, 10)

  const [profilesRes, attendanceRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, status')
      .order('role', { ascending: true }),
    supabase
      .from('attendance')
      .select('user_id, date')
      .gte('date', startStr)
      .lte('date', todayStr),
  ])

  const staff = (profilesRes.data ?? []) as StaffRow[]
  const attendance = (attendanceRes.data ?? []) as { user_id: string; date: string }[]

  const headcountByRole: Record<string, { total: number; active: number }> = {}
  staff.forEach((s) => {
    if (!headcountByRole[s.role]) {
      headcountByRole[s.role] = { total: 0, active: 0 }
    }
    headcountByRole[s.role].total += 1
    if (s.status === 'active') {
      headcountByRole[s.role].active += 1
    }
  })

  const attendanceByDate: Record<string, number> = {}
  attendance.forEach((row) => {
    attendanceByDate[row.date] = (attendanceByDate[row.date] ?? 0) + 1
  })

  const totalStaff = staff.length || 1
  const days: string[] = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'Manager'
      case 'SUPERVISOR':
        return 'Supervisor'
      case 'ADMIN_GUDANG':
        return 'Admin Gudang'
      case 'PACKING':
        return 'Packing'
      case 'HR':
        return 'HR'
      default:
        return role
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan SDM</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Rekap headcount per role dan tren kehadiran 7 hari terakhir.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Headcount per Role
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Role</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Aktif</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(headcountByRole).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada data staff.
                  </td>
                </tr>
              ) : (
                Object.entries(headcountByRole).map(([role, hc]) => (
                  <tr key={role} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-700">{roleLabel(role)}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{hc.total}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{hc.active}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Kehadiran 7 Hari Terakhir
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tanggal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Hadir</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">%</th>
              </tr>
            </thead>
            <tbody>
              {days.map((date) => {
                const present = attendanceByDate[date] ?? 0
                const percent = Math.round((present / totalStaff) * 100)

                return (
                  <tr key={date} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {new Date(date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{present}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{percent}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
