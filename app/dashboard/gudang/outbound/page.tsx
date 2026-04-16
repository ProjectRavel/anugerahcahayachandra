import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import StatsCard from '@/components/dashboard/StatsCard'
import CreateOrderForm from '@/components/dashboard/gudang/CreateOrderForm'

type OrderRow = {
  id: string
  type: 'INBOUND' | 'OUTBOUND'
  status: string
  created_at: string
  notes: string | null
  profiles: { full_name: string } | null
  order_items: Array<{ count: number }>
}

type ProductRow = {
  id: string
  sku: string
  name: string
  stock: number
  unit: 'pcs' | 'dus'
}

export default async function OutboundPage() {
  const supabase = (await createClient()) as SupabaseClient<Database>

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentRole: string | null = null
  if (user) {
    const { data: profile } = (await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()) as unknown as { data: { role: string } | null }

    currentRole = profile?.role ?? null
  }

  const canCreateOutbound = currentRole === 'ADMIN_GUDANG'

  const [{ data: rows }, { data: statusRows }, { data: productRows }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        `
        id, type, status, created_at, notes,
        profiles:created_by (full_name),
        order_items (count)
      `
      )
      .eq('type', 'OUTBOUND')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('orders').select('status').eq('type', 'OUTBOUND'),
    supabase.from('products').select('id, sku, name, stock, unit').order('name', { ascending: true }),
  ])

  const orders = (rows ?? []) as OrderRow[]
  const products = (productRows ?? []) as ProductRow[]

  const statusCounts: Record<string, number> = {}
  ;((statusRows ?? []) as { status: string }[]).forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  })

  const totalOrders = Object.values(statusCounts).reduce((sum, n) => sum + n, 0)
  const pending = statusCounts.PENDING ?? 0
  const processing = statusCounts.PROCESSING ?? 0
  const packing = statusCounts.PACKING ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengiriman (Outbound)</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Pantau dan kelola order outbound (pengiriman) untuk memastikan packing dan pengiriman berjalan.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan Outbound
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Total" value={totalOrders} subtitle="semua status" accent="indigo" />
          <StatsCard title="Pending" value={pending} subtitle="menunggu" accent="amber" />
          <StatsCard title="Processing" value={processing} subtitle="siap dipacking" accent="indigo" />
          <StatsCard title="Packing" value={packing} subtitle="dikemas" accent="emerald" />
        </div>
      </section>

      {canCreateOutbound && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Buat Order Outbound
          </h2>
          <CreateOrderForm type="OUTBOUND" products={products} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Daftar Order Outbound
          </h2>
          <span className="text-xs text-slate-400">{orders.length} order</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Dibuat oleh</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                    Belum ada order outbound.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Intl.DateTimeFormat('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(order.created_at))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                      {order.profiles?.full_name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right whitespace-nowrap">
                      {order.order_items?.[0]?.count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[320px] truncate">
                      {order.notes ?? '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
