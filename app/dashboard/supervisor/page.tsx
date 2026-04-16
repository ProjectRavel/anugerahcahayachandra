import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import OrderQueueTable from '@/components/dashboard/OrderQueueTable'
import { Package, Truck, PackageCheck, Clock } from 'lucide-react'
import type { UserRole } from '@/types/database'

type QueueOrderRow = {
  id: string
  type: string
  status: string
  created_at: string
  notes: string | null
  profiles: { full_name: string } | null
  order_items: Array<{ count: number }>
}

export default async function SupervisorDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profileData } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const profile = profileData as { role: UserRole } | null

  const [
    { count: pendingCount },
    { count: processingCount },
    { count: packingCount },
    { count: shippedCount },
    { data: queueOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PROCESSING'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PACKING'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SHIPPED'),
    supabase
      .from('orders')
      .select(
        `
        id, type, status, created_at, notes,
        profiles:created_by (full_name),
        order_items (count)
      `
      )
      .in('status', ['PENDING', 'PROCESSING', 'PACKING', 'SHIPPED'])
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const typedQueueOrders = (queueOrders ?? []) as QueueOrderRow[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Supervisor</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau status operasional gudang secara real-time
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Status Order Hari Ini
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Menunggu"
            value={pendingCount ?? 0}
            subtitle="order baru"
            accent="amber"
            icon={Clock}
          />
          <StatsCard
            title="Diproses"
            value={processingCount ?? 0}
            subtitle="di gudang"
            accent="indigo"
            icon={Package}
          />
          <StatsCard
            title="Packing"
            value={packingCount ?? 0}
            subtitle="sedang dikemas"
            accent="emerald"
            icon={PackageCheck}
          />
          <StatsCard
            title="Dikirim"
            value={shippedCount ?? 0}
            subtitle="dalam perjalanan"
            accent="rose"
            icon={Truck}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Antrean Order Aktif
          </h2>
          <span className="text-xs text-slate-400">{typedQueueOrders.length} order</span>
        </div>
        <OrderQueueTable orders={typedQueueOrders} role={profile?.role} />
      </section>
    </div>
  )
}
