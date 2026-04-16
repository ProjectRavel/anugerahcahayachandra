import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import { BarChart3, Package, Truck, CheckCircle2 } from 'lucide-react'

type OrdersTodayRow = {
  id: string
  type: 'INBOUND' | 'OUTBOUND'
  status: 'PENDING' | 'PROCESSING' | 'PACKING' | 'SHIPPED' | 'COMPLETED'
  created_by_name: string | null
  total_items: number
  created_at: string
}

export default async function ManagerReportsPage() {
  const supabase = await createClient()

  const { data: ordersToday } = await supabase
    .from('v_orders_today')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (ordersToday ?? []) as OrdersTodayRow[]

  const totalOrders = rows.length
  const inboundOrders = rows.filter((r) => r.type === 'INBOUND').length
  const outboundOrders = rows.filter((r) => r.type === 'OUTBOUND').length
  const completedOrders = rows.filter((r) => r.status === 'COMPLETED').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Harian</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Ringkasan order yang dibuat hari ini, untuk membantu pengambilan keputusan
          harian oleh manajer.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan Order Hari Ini
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Order"
            value={totalOrders}
            subtitle="semua tipe"
            accent="indigo"
            icon={BarChart3}
          />
          <StatsCard
            title="Inbound"
            value={inboundOrders}
            subtitle="penerimaan barang"
            accent="emerald"
            icon={Package}
          />
          <StatsCard
            title="Outbound"
            value={outboundOrders}
            subtitle="pengiriman pesanan"
            accent="amber"
            icon={Truck}
          />
          <StatsCard
            title="Selesai"
            value={completedOrders}
            subtitle="status COMPLETED"
            accent="rose"
            icon={CheckCircle2}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Detail Order Hari Ini
          </h2>
          <span className="text-xs text-slate-400">{rows.length} order</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Dibuat oleh</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Total Item</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada order yang dibuat hari ini.
                  </td>
                </tr>
              ) : (
                rows.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {String(order.id).slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {order.type}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{order.created_by_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">
                      {order.total_items}
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
