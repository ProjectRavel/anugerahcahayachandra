'use client'

import { useMemo, useState, useTransition } from 'react'
import { createOrder } from '@/actions/orders'
import { cn } from '@/lib/utils'

type ProductOption = {
  id: string
  sku: string
  name: string
  stock: number
  unit: 'pcs' | 'dus'
}

type LineItem = {
  product_id: string
  quantity: number
}

export default function CreateOrderForm({
  type,
  products,
  onCreated,
}: {
  type: 'INBOUND' | 'OUTBOUND'
  products: ProductOption[]
  onCreated?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ product_id: '', quantity: 1 }])
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const productById = useMemo(() => {
    const map = new Map<string, ProductOption>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  function updateItem(index: number, next: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...next } : it)))
  }

  function addRow() {
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }])
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function sanitizeItems(list: LineItem[]) {
    return list
      .filter((it) => it.product_id && Number.isFinite(it.quantity))
      .map((it) => ({
        product_id: it.product_id,
        quantity: Math.max(1, Math.floor(it.quantity)),
      }))
  }

  async function onSubmit() {
    setMessage(null)

    const payloadItems = sanitizeItems(items)
    if (payloadItems.length === 0) {
      setMessage({ kind: 'error', text: 'Minimal pilih 1 produk.' })
      return
    }

    const fd = new FormData()
    fd.set('type', type)
    fd.set('notes', notes)
    fd.set('items', JSON.stringify(payloadItems))

    startTransition(async () => {
      const result = await createOrder(fd)
      if (result?.success) {
        setMessage({ kind: 'success', text: 'Order berhasil dibuat.' })
        setNotes('')
        setItems([{ product_id: '', quantity: 1 }])
        onCreated?.()
      } else {
        setMessage({ kind: 'error', text: result?.error ?? 'Terjadi kesalahan.' })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">
          Tambah Order {type === 'INBOUND' ? 'Inbound' : 'Outbound'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Input item dan quantity. Stok akan berubah saat status order di-set ke <span className="font-semibold">COMPLETED</span>.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            'px-5 py-3 text-sm border-b',
            message.kind === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-100'
          )}
        >
          {message.text}
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opsional, misal: Supplier A / Batch #1"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Items</span>
            <button
              type="button"
              onClick={addRow}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              + Tambah baris
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it, index) => {
              const p = it.product_id ? productById.get(it.product_id) : undefined

              return (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    <select
                      value={it.product_id}
                      onChange={(e) => updateItem(index, { product_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    >
                      <option value="">Pilih produk...</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.sku} — {prod.name} (stok: {prod.stock} {prod.unit})
                        </option>
                      ))}
                    </select>
                    {p && type === 'OUTBOUND' && it.quantity > p.stock && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        Qty melebihi stok saat ini. Saat complete, sistem bisa menolak jika stok tidak cukup.
                      </p>
                    )}
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={items.length <= 1}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-semibold border',
                        items.length <= 1
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                      aria-label="Hapus baris"
                      title="Hapus baris"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className={cn(
              'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isPending ? 'Menyimpan...' : 'Buat Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
