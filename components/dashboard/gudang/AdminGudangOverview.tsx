'use client'

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { Package, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface AdminGudangOverviewProps {
  inventoryStats: {
    totalSku: number
    criticalStock: number
    normalStock: number
  }
  recentActivity: {
    inboundToday: number
    outboundToday: number
  }
}

export default function AdminGudangOverview({ inventoryStats, recentActivity }: AdminGudangOverviewProps) {
  const stockChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      sparkline: { enabled: false }
    },
    labels: ['Kritis/Hampir Habis', 'Hampir Stok', 'Stok Aman'],
    colors: ['#f43f5e', '#f59e0b', '#10b981'],
    legend: { show: false },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '80%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total SKU',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 600,
              formatter: () => inventoryStats.totalSku.toString()
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              offsetY: 4
            }
          }
        }
      }
    },
    tooltip: { enabled: true }
  }

  const stockSeries = [
    inventoryStats.criticalStock,
    0, // Placeholder if we had "warning" state separately
    inventoryStats.normalStock
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Status Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800">Kesehatan Inventori</h3>
            <Package size={18} className="text-slate-400" />
          </div>
          
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-full max-w-[180px]">
              <Chart options={stockChartOptions} series={stockSeries} type="donut" width="100%" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                Stok Kritis
              </div>
              <span className="font-bold text-slate-700">{inventoryStats.criticalStock} SKU</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Stok Aman
              </div>
              <span className="font-bold text-slate-700">{inventoryStats.normalStock} SKU</span>
            </div>
          </div>
          
          <Link 
            href="/dashboard/gudang" 
            className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-colors"
          >
            Lihat Detail Inventori
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Activity Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-3 w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Inbound Hari Ini</p>
              <h4 className="text-3xl font-black text-slate-800">{recentActivity.inboundToday}</h4>
              <p className="text-xs text-slate-500 mt-2">Penerimaan barang masuk dari supplier</p>
            </div>
            <Link 
              href="/dashboard/gudang/inbound" 
              className="mt-6 flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline"
            >
              Mulai Penerimaan <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-3 w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <TrendingDown size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outbound Hari Ini</p>
              <h4 className="text-3xl font-black text-slate-800">{recentActivity.outboundToday}</h4>
              <p className="text-xs text-slate-500 mt-2">Persiapan pengiriman ke pelanggan</p>
            </div>
            <Link 
              href="/dashboard/gudang/outbound" 
              className="mt-6 flex items-center gap-2 text-orange-600 text-xs font-bold hover:underline"
            >
              Proses Pengiriman <ArrowRight size={14} />
            </Link>
          </div>

          {/* Critical Alerts Widget */}
          <div className="sm:col-span-2 bg-rose-50/50 p-5 rounded-3xl border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">
                  {inventoryStats.criticalStock > 0 
                    ? `Ada ${inventoryStats.criticalStock} produk yang butuh restock!`
                    : "Semua stok dalam kondisi aman."
                  }
                </p>
                <p className="text-xs text-rose-700/70">
                  Segera buat laporan restock untuk menghindari kekosongan barang.
                </p>
              </div>
            </div>
            {inventoryStats.criticalStock > 0 && (
              <Link 
                href="/dashboard/gudang"
                className="px-4 py-2 bg-white text-rose-600 text-xs font-bold rounded-xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors"
              >
                Cek Barang
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
