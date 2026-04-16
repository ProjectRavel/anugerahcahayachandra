'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markOutboundShippedAction, moveToPackingAction } from '@/actions/orders'
import type { OrderStatus } from '@/types/database'

type OutboundOrderRow = {
  id: string
  status: OrderStatus | string
  created_at: string
  notes: string | null
  profiles: { full_name: string } | null
  order_items: Array<{ count: number }>
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  PACKING: { label: 'Packing', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  SHIPPED: { label: 'Shipped', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
}

export default function OutboundQueueTable({ orders }: { orders: OutboundOrderRow[] }) {
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  )

  async function run(
    orderId: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) {
    setLoadingId(orderId)
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        setNotification({ type: 'success', msg: successMsg })
      } else {
        setNotification({ type: 'error', msg: result.error ?? 'Terjadi kesalahan.' })
      }
      setLoadingId(null)
      setTimeout(() => setNotification(null), 4000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {notification && (
        <div
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-100'
          )}
        >
          {notification.msg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ID Order
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dibuat Oleh
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Items
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Waktu
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Catatan
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => {
              const statusKey = order.status as OrderStatus
              const status = STATUS_CONFIG[statusKey] ?? {
                label: String(order.status),
                className: 'bg-slate-100 text-slate-700 border-slate-200',
              }

              const isLoading = loadingId === order.id
              const canStartPacking = order.status === 'PROCESSING'
              const canMarkShipped = order.status === 'PACKING'

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium border',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{order.profiles?.full_name ?? '-'}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {order.order_items?.[0]?.count ?? 0} produk
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {new Intl.DateTimeFormat('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(order.created_at))}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[360px] truncate">
                    {order.notes ?? '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {canStartPacking && (
                      <button
                        onClick={() => run(order.id, () => moveToPackingAction(order.id), 'Order masuk ke status PACKING.')}
                        disabled={isLoading}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : 'Mulai Packing'}
                      </button>
                    )}

                    {canMarkShipped && (
                      <button
                        onClick={() =>
                          run(order.id, () => markOutboundShippedAction(order.id), 'Order ditandai SHIPPED.')
                        }
                        disabled={isLoading}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : 'Tandai Shipped'}
                      </button>
                    )}

                    {!canStartPacking && !canMarkShipped && (
                      <span className="text-xs text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              )
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Tidak ada outbound yang perlu diproses.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
