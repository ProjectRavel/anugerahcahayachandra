import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import OrderQueueTable from '@/components/dashboard/OrderQueueTable'
import { Package, Truck, PackageCheck, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
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
  const totalActive = (pendingCount ?? 0) + (processingCount ?? 0) + (packingCount ?? 0) + (shippedCount ?? 0)
  const readyForValidation = pendingCount ?? 0
  const readyToComplete = shippedCount ?? 0

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
              <ShieldCheck size={13} />
              Supervisor Control Panel
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-3">Dashboard Supervisor</h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau antrean operasional gudang secara real-time dan lakukan validasi outbound.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Antrean Aktif</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{totalActive}</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-rose-500 font-semibold">Butuh Tindakan</p>
              <p className="text-xl font-bold text-rose-700 mt-1">{readyForValidation + readyToComplete}</p>
            </div>
          </div>
        </div>
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Perlu Validasi</p>
              <p className="text-sm text-amber-800 mt-0.5">
                {readyForValidation} order OUTBOUND masih status PENDING.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Siap Diselesaikan</p>
              <p className="text-sm text-emerald-800 mt-0.5">
                {readyToComplete} order OUTBOUND sudah SHIPPED dan bisa di-complete.
              </p>
            </div>
          </div>
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
