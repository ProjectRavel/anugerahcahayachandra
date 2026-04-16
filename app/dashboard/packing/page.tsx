import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import OutboundQueueTable from '@/components/dashboard/packing/OutboundQueueTable'

type OutboundTaskRow = {
  id: string
  status: string
  created_at: string
  notes: string | null
  profiles: { full_name: string } | null
  order_items: Array<{ count: number }>
}

export default async function PackingTaskPage() {
  const supabase = await createClient()

  const [taskRowsRes, statusRowsRes, todayRowsRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        `
        id, status, created_at, notes,
        profiles:created_by (full_name),
        order_items (count)
      `
      )
      .eq('type', 'OUTBOUND')
      .in('status', ['PROCESSING', 'PACKING'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('orders')
      .select('status')
      .eq('type', 'OUTBOUND')
      .in('status', ['PROCESSING', 'PACKING']),
    supabase
      .from('orders')
      .select('id')
      .eq('type', 'OUTBOUND')
      .eq('status', 'SHIPPED')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  const taskRows = (taskRowsRes.data ?? []) as OutboundTaskRow[]
  const statusRows = (statusRowsRes.data ?? []) as { status: string }[]

  const statusCounts: Record<string, number> = {}
  statusRows.forEach((row) => {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
  })

  const waitingToPack = statusCounts.PROCESSING ?? 0
  const inPacking = statusCounts.PACKING ?? 0
  const totalTasks = waitingToPack + inPacking
  const shippedToday = (todayRowsRes.data ?? []).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tugas Packing</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Fokus pada outbound yang siap dipacking (PROCESSING) dan yang sedang dikerjakan (PACKING).
          Setelah selesai kemas, tandai menjadi SHIPPED.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan Kerja
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Total Tugas" value={totalTasks} subtitle="perlu ditindak" accent="indigo" />
          <StatsCard
            title="Siap Dipacking"
            value={waitingToPack}
            subtitle="status processing"
            accent="amber"
          />
          <StatsCard
            title="Sedang Packing"
            value={inPacking}
            subtitle="status packing"
            accent="emerald"
          />
          <StatsCard
            title="Shipped Hari Ini"
            value={shippedToday}
            subtitle="sudah dikirim"
            accent="rose"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Antrean Tugas Aktif
          </h2>
          <span className="text-xs text-slate-400">{taskRows.length} order</span>
        </div>

        <OutboundQueueTable orders={taskRows} />
      </section>
    </div>
  )
}
