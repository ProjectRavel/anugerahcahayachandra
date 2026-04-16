import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import OutboundQueueTable from '@/components/dashboard/packing/OutboundQueueTable'

type OutboundRow = {
  id: string
  status: string
  created_at: string
  notes: string | null
  profiles: { full_name: string } | null
  order_items: Array<{ count: number }>
}

export default async function PackingOutboundPage() {
  const supabase = await createClient()

  const [{ data: rows }, { data: statusRows }] = await Promise.all([
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
      .in('status', ['PROCESSING', 'PACKING', 'SHIPPED'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('orders')
      .select('status')
      .eq('type', 'OUTBOUND')
      .in('status', ['PROCESSING', 'PACKING', 'SHIPPED']),
  ])

  const orders = (rows ?? []) as OutboundRow[]

  const statusCounts: Record<string, number> = {}
  ;((statusRows ?? []) as { status: string }[]).forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  })

  const processing = statusCounts.PROCESSING ?? 0
  const packing = statusCounts.PACKING ?? 0
  const shipped = statusCounts.SHIPPED ?? 0
  const total = processing + packing + shipped

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Outbound (Packing)</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Proses order outbound yang sudah divalidasi Supervisor (status PROCESSING), lanjutkan ke PACKING
          dan SHIPPED.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Total" value={total} subtitle="perlu diproses" accent="indigo" />
          <StatsCard title="Processing" value={processing} subtitle="siap dipacking" accent="indigo" />
          <StatsCard title="Packing" value={packing} subtitle="sedang dikemas" accent="emerald" />
          <StatsCard title="Shipped" value={shipped} subtitle="menunggu complete" accent="rose" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Antrean Outbound
          </h2>
          <span className="text-xs text-slate-400">{orders.length} order</span>
        </div>

        <OutboundQueueTable orders={orders} />
      </section>
    </div>
  )
}
