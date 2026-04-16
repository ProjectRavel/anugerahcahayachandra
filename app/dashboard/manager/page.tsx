import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import { BarChart3, Package, Truck, CheckCircle2 } from 'lucide-react'

type OrdersTodayRow = {
  id: string
  type: 'INBOUND' | 'OUTBOUND'
  status: 'PENDING' | 'PROCESSING' | 'PACKING' | 'SHIPPED' | 'COMPLETED'
  profiles: { full_name: string } | null
  order_items: Array<{
    quantity: number
    products: { sku: string; name: string; price_wholesale: number } | null
  }>
  created_at: string
}

export default async function ManagerReportsPage() {
  const supabase = await createClient()

  const jakartaToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  const dayStart = new Date(`${jakartaToday}T00:00:00+07:00`)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const { data: ordersToday } = await supabase
    .from('orders')
    .select(
      `
      id, type, status, created_at,
      profiles:created_by (full_name),
      order_items (
        quantity,
        products (sku, name, price_wholesale)
      )
    `
    )
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())
    .order('created_at', { ascending: false })

  const rows = (ordersToday ?? []) as OrdersTodayRow[]
  const ordersWithSummary = rows.map((order) => {
    const totalQty = order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const totalValue = order.order_items.reduce(
      (sum, item) => sum + (item.quantity || 0) * Number(item.products?.price_wholesale || 0),
      0
    )
    const productSummary =
      order.order_items.length === 0
        ? '-'
        : order.order_items
            .map((item) => `${item.products?.name ?? 'Produk tidak dikenal'} x${item.quantity}`)
            .join(', ')

    return {
      ...order,
      totalQty,
      totalValue,
      productSummary,
    }
  })

  const totalOrders = ordersWithSummary.length
  const inboundOrders = ordersWithSummary.filter((r) => r.type === 'INBOUND').length
  const outboundOrders = ordersWithSummary.filter((r) => r.type === 'OUTBOUND').length
  const completedOrders = ordersWithSummary.filter((r) => r.status === 'COMPLETED').length
  const totalQtyAll = ordersWithSummary.reduce((sum, order) => sum + order.totalQty, 0)
  const totalValueAll = ordersWithSummary.reduce((sum, order) => sum + order.totalValue, 0)

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
        <div className="grid gap-4 md:grid-cols-5">
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
          <StatsCard
            title="Total Nilai"
            value={`Rp ${totalValueAll.toLocaleString('id-ID')}`}
            subtitle={`${totalQtyAll.toLocaleString('id-ID')} barang`}
            accent="indigo"
            icon={BarChart3}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Detail Order Hari Ini
          </h2>
          <span className="text-xs text-slate-400">{ordersWithSummary.length} order</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Waktu</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Order ID</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipe</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dibuat oleh</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Detail Barang</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Qty</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {ordersWithSummary.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada order yang dibuat hari ini.
                  </td>
                </tr>
              ) : (
                ordersWithSummary.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{order.profiles?.full_name ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[320px]" title={order.productSummary}>
                      <p className="line-clamp-2">{order.productSummary}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right tabular-nums whitespace-nowrap">
                      {order.totalQty.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right tabular-nums whitespace-nowrap">
                      Rp {order.totalValue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  )
}
