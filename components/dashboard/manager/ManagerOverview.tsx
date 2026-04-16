'use client'

import ApexChart from '@/components/dashboard/manager/ApexChart'

type RecentProductHistoryItem = {
  id: string
  quantity: number
  created_at: string
  order: {
    id: string
    type: 'INBOUND' | 'OUTBOUND'
    status: 'PENDING' | 'PROCESSING' | 'PACKING' | 'SHIPPED' | 'COMPLETED'
  } | null
  product: {
    sku: string
    name: string
    unit: string
  } | null
}

interface ManagerOverviewProps {
  totalInventoryValue: number
  packingQueue: number
  todayAttendance: number
  totalStaff: number
  roleCounts: Record<string, number>
  orderStatusCounts: Record<string, number>
  recentProductHistory: RecentProductHistoryItem[]
  orderTrend: {
    labels: string[]
    inboundSeries: number[]
    outboundSeries: number[]
  }
}

export default function ManagerOverview({
  totalInventoryValue,
  packingQueue,
  todayAttendance,
  totalStaff,
  roleCounts,
  orderStatusCounts,
  recentProductHistory,
  orderTrend,
}: ManagerOverviewProps) {
  const statusLabelMap: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    PACKING: 'Packing',
    SHIPPED: 'Dikirim',
    COMPLETED: 'Selesai',
  }

  const orderStatusOrder = ['PENDING', 'PROCESSING', 'PACKING', 'SHIPPED', 'COMPLETED']
  const orderStatusLabels = orderStatusOrder.filter((status) => (orderStatusCounts[status] ?? 0) > 0)
  const orderStatusSeries = orderStatusLabels.map((status) => orderStatusCounts[status])

  const typeLabelMap: Record<string, string> = {
    INBOUND: 'Masuk',
    OUTBOUND: 'Keluar',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview Manager Utama</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Ringkasan singkat posisi keuangan, kesehatan operasional gudang, dan performa tim
          berdasarkan data terbaru dari sistem ERP.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Financial Analytics
          </p>
          <h2 className="text-sm font-medium text-slate-700 mb-1">Total Inventory Value</h2>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            Rp {totalInventoryValue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400">Perkiraan nilai persediaan berdasarkan harga grosir.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Operational Efficiency
          </p>
          <h2 className="text-sm font-medium text-slate-700 mb-1">Packing Queue</h2>
          <p className="text-2xl font-bold text-slate-900 mb-1">{packingQueue}</p>
          <p className="text-xs text-slate-400">
            Jumlah order dengan status PENDING / PROCESSING / PACKING.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Human Resource Overview
          </p>
          <h2 className="text-sm font-medium text-slate-700 mb-1">Attendance Today</h2>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {todayAttendance}{' '}
            <span className="text-sm font-normal text-slate-500">/ {totalStaff}</span>
          </p>
          <p className="text-xs text-slate-400">Jumlah staf yang sudah check-in hari ini.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Labor Distribution
              </p>
              <p className="text-sm text-slate-500 mt-1">Persebaran role staf saat ini.</p>
            </div>
          </div>
          <div className="h-56">
            <ApexChart
              type="donut"
              series={Object.values(roleCounts)}
              options={{
                labels: Object.keys(roleCounts),
                legend: { position: 'bottom' },
                dataLabels: { enabled: false },
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Tren Order 7 Hari Terakhir
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Pergerakan order masuk dan keluar berdasarkan tanggal transaksi.
              </p>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Inbound
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Outbound
            </span>
          </div>
          <div className="h-56">
            <ApexChart
              type="line"
              series={[
                {
                  name: 'Inbound',
                  data: orderTrend.inboundSeries,
                },
                {
                  name: 'Outbound',
                  data: orderTrend.outboundSeries,
                },
              ]}
              options={{
                chart: {
                  foreColor: '#334155',
                },
                yaxis: {
                  labels: {
                    style: { colors: '#14191f' },
                  },
                },
                xaxis: {
                  categories: orderTrend.labels,
                  labels: {
                    style: { colors: '#262e3a' },
                  },
                },
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 4 },
                colors: ['#10b981', '#f97316'],
                legend: {
                  position: 'top',
                  labels: {
                    colors: '#334155',
                  },
                },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4 },
                tooltip: {
                  shared: true,
                  intersect: false,
                  custom: ({ series, dataPointIndex }) => {
                    const inbound = series[0]?.[dataPointIndex] ?? 0
                    const outbound = series[1]?.[dataPointIndex] ?? 0
                    const label = orderTrend.labels[dataPointIndex] ?? ''

                    return `
                      <div style="
                        background: #ffffff;
                        color: #0f172a;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 8px 10px;
                        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
                        font-size: 12px;
                        line-height: 1.4;
                      ">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">${label}</div>
                        <div style="display: grid; gap: 4px;">
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <span style="display: inline-flex; align-items: center; gap: 6px; color: #065f46; font-weight: 600;">
                              <span style="width: 8px; height: 8px; border-radius: 9999px; background: #10b981; display: inline-block;"></span>
                              Inbound
                            </span>
                            <span style="color: #0f172a; font-weight: 600;">${inbound}</span>
                          </div>
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <span style="display: inline-flex; align-items: center; gap: 6px; color: #7f1d1d; font-weight: 600;">
                              <span style="width: 8px; height: 8px; border-radius: 9999px; background: #dc2626; display: inline-block;"></span>
                              Outbound
                            </span>
                            <span style="color: #0f172a; font-weight: 600;">${outbound}</span>
                          </div>
                        </div>
                      </div>
                    `
                  },
                },
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Order Status Summary
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Komposisi order berdasarkan status saat ini.
              </p>
            </div>
          </div>
          <div className="h-56">
            {orderStatusSeries.length > 0 ? (
              <ApexChart
                type="pie"
                series={orderStatusSeries}
                options={{
                  labels: orderStatusLabels.map((s) => statusLabelMap[s] ?? s),
                  legend: {
                    position: 'bottom',
                    labels: { colors: '#334155' },
                  },
                  chart: {
                    offsetY: -10, // geser pie ke atas
                  }
                }}
              />
            ) : (
              <p className="text-xs text-slate-400 mt-8 text-center">
                Belum ada data order yang dapat ditampilkan.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Histori Produk Terakhir
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Aktivitas produk terbaru dari order dan item yang baru diproses.
              </p>
            </div>
          </div>

          {recentProductHistory.length === 0 ? (
            <p className="text-xs text-slate-400 mt-4">
              Belum ada histori produk terbaru yang bisa ditampilkan.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-72 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Waktu
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Produk
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Tipe
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentProductHistory.map((item) => {
                      const type = item.order?.type ?? '-'
                      const status = item.order?.status ?? '-'

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                            {new Intl.DateTimeFormat('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(item.created_at))}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {item.product?.sku ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-800">
                            {item.product?.name ?? 'Produk tidak dikenal'}
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {typeLabelMap[type] ?? type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {statusLabelMap[status] ?? status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-800 text-right whitespace-nowrap">
                            {item.quantity} {item.product?.unit ?? 'pcs'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
