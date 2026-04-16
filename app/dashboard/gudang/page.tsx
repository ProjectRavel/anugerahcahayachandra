import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'

type StockStatusRow = {
  id: string
  sku: string
  name: string
  stock: number
  unit: string
  min_stock_threshold: number
  price_retail: number
  price_wholesale: number
  stock_status: string
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: stockRows } = await supabase
    .from('v_product_stock_status')
    .select('*')
    .order('name', { ascending: true })

  const rows = (stockRows ?? []) as StockStatusRow[]

  const totalSku = rows.length
  const outOfStock = rows.filter((r) => r.stock_status === 'HABIS').length
  const nearOut = rows.filter((r) => r.stock_status === 'HAMPIR HABIS').length
  const totalStockValue = rows.reduce((sum, r) => sum + r.stock * Number(r.price_wholesale || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventori Produk</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Daftar produk gudang beserta status stok untuk membantu kontrol persediaan.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ringkasan Stok
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Total SKU" value={totalSku} subtitle="produk aktif" accent="indigo" />
          <StatsCard
            title="Stok Habis"
            value={outOfStock}
            subtitle="butuh restock segera"
            accent="rose"
          />
          <StatsCard
            title="Hampir Habis"
            value={nearOut}
            subtitle="mendekati threshold"
            accent="amber"
          />
          <StatsCard
            title="Nilai Inventori"
            value={`Rp ${totalStockValue.toLocaleString('id-ID')}`}
            subtitle="akumulasi harga grosir"
            accent="emerald"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Detail Stok Per Produk
          </h2>
          <span className="text-xs text-slate-400">{rows.length} produk</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nama Produk</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Stok</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Unit</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Harga Grosir</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nilai Stok</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-400">
                    Belum ada data produk.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.sku}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{p.unit}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right tabular-nums whitespace-nowrap">
                      Rp {Number(p.price_wholesale || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right tabular-nums whitespace-nowrap">
                      Rp {(p.stock * Number(p.price_wholesale || 0)).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          p.stock_status === 'HABIS'
                            ? 'inline-flex px-2 py-0.5 rounded-full border border-rose-100 bg-rose-50 text-rose-700 text-[11px]'
                            : p.stock_status === 'HAMPIR HABIS'
                            ? 'inline-flex px-2 py-0.5 rounded-full border border-amber-100 bg-amber-50 text-amber-700 text-[11px]'
                            : 'inline-flex px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-[11px]'
                        }
                      >
                        {p.stock_status}
                      </span>
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
