'use client'

import StatsCard from '@/components/dashboard/StatsCard'
import ApexChart from '@/components/dashboard/manager/ApexChart'

interface HrOverviewProps {
  totalStaff: number
  activeStaff: number
  presentToday: number
  roleCounts: Record<string, number>
}

export default function HrOverview({
  totalStaff,
  activeStaff,
  presentToday,
  roleCounts,
}: HrOverviewProps) {
  const absentToday = Math.max(totalStaff - presentToday, 0)

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

  const presenceLabels = ['Hadir', 'Belum Check-in']
  const presenceSeries = [presentToday, Math.max(absentToday, 0)]

  const roleKeys = Object.keys(roleCounts)
  const roleSeries = Object.values(roleCounts)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview HR</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Ringkasan cepat SDM dan kehadiran hari ini. Untuk detail, gunakan menu SDM,
          Absensi, dan Laporan SDM di sidebar.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan SDM
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Staff"
            value={totalStaff}
            subtitle="semua role"
            accent="indigo"
          />
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Status Kehadiran Hari Ini
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Perbandingan karyawan yang sudah hadir vs belum check-in.
              </p>
            </div>
          </div>
          <div className="h-56">
            {totalStaff > 0 ? (
              <ApexChart
                type="donut"
                series={presenceSeries}
                options={{
                  labels: presenceLabels,
                  legend: { position: 'bottom' },
                  dataLabels: { enabled: false },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400 mt-8 text-center">
                Belum ada data staff yang dapat ditampilkan.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Distribusi Role Staff
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Komposisi karyawan berdasarkan role organisasi.
              </p>
            </div>
          </div>
          <div className="h-56">
            {roleSeries.length > 0 ? (
              <ApexChart
                type="donut"
                series={roleSeries}
                options={{
                  labels: roleKeys.map((r) => roleLabel(r)),
                  legend: { position: 'bottom' },
                  dataLabels: { enabled: false },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400 mt-8 text-center">
                Belum ada data role yang dapat ditampilkan.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
