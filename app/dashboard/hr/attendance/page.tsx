import { createClient } from '@/lib/supabase/server'

type StaffRow = {
  id: string
  full_name: string | null
  role: string
  status: string | null
}

export default async function HrAttendancePage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [profilesRes, attendanceRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .order('full_name', { ascending: true }),
    supabase
      .from('attendance')
      .select('user_id, check_in, check_out, date')
      .eq('date', today)
      .order('check_in', { ascending: true }),
  ])

  const staff = (profilesRes.data ?? []) as StaffRow[]
  const attendanceRows = (attendanceRes.data ?? []) as {
    user_id: string
    check_in: string | null
    check_out: string | null
    date: string
  }[]

  const attendanceByUser = new Map<string, (typeof attendanceRows)[number]>()
  attendanceRows.forEach((row) => {
    attendanceByUser.set(row.user_id, row)
  })

  const totalStaff = staff.length
  const presentToday = attendanceRows.length
  const notPresent = totalStaff - presentToday

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Absensi Hari Ini</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Rekap kehadiran karyawan untuk tanggal {today}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Total Staff
          </p>
          <p className="text-2xl font-bold text-slate-900">{totalStaff}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Hadir Hari Ini
          </p>
          <p className="text-2xl font-bold text-emerald-700">{presentToday}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Belum Check-in
          </p>
          <p className="text-2xl font-bold text-amber-700">{notPresent > 0 ? notPresent : 0}</p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Detail Kehadiran
          </h2>
          <span className="text-xs text-slate-400">{presentToday} hadir</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Check-in</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Check-out</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada karyawan yang melakukan check-in hari ini.
                  </td>
                </tr>
              ) : (
                staff
                  .filter((s) => attendanceByUser.has(s.id))
                  .map((s) => {
                    const row = attendanceByUser.get(s.id)!
                    const checkIn = row.check_in
                      ? new Date(row.check_in).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'
                    const checkOut = row.check_out
                      ? new Date(row.check_out).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'

                    return (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 text-xs text-slate-700">{s.full_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">{s.role}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">{checkIn}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">{checkOut}</td>
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
