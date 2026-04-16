'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { completeInboundAction, startInboundProcessingAction } from '@/actions/orders'
import type { OrderStatus } from '@/types/database'

export default function InboundOrderActions({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus | string
}) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function run(action: () => Promise<{ success: boolean; error?: string }>, successText: string) {
    setMsg(null)
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        setMsg({ kind: 'success', text: successText })
      } else {
        setMsg({ kind: 'error', text: result.error ?? 'Terjadi kesalahan.' })
      }
      setTimeout(() => setMsg(null), 3500)
    })
  }

  const canStart = status === 'PENDING'
  const canComplete = status === 'PROCESSING'

  return (
    <div className="flex items-center justify-end gap-2">
      {msg && (
        <span
          className={cn(
            'text-[11px] font-medium',
            msg.kind === 'success' ? 'text-emerald-700' : 'text-rose-700'
          )}
        >
          {msg.text}
        </span>
      )}

      {canStart && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => startInboundProcessingAction(orderId), 'Inbound diproses.')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
            'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          Mulai Proses
        </button>
      )}

      {canComplete && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => completeInboundAction(orderId), 'Inbound selesai. Stok diperbarui.')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
            'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          Complete
        </button>
      )}

      {!canStart && !canComplete && <span className="text-xs text-slate-300">-</span>}
    </div>
  )
}
