'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus, OrderType, UserRole } from '@/types/database'

const VALID_TRANSITIONS_BY_TYPE: Record<OrderType, Record<OrderStatus, OrderStatus[]>> = {
  INBOUND: {
    PENDING: ['PROCESSING'],
    PROCESSING: ['COMPLETED'],
    PACKING: [],
    SHIPPED: [],
    COMPLETED: [],
  },
  OUTBOUND: {
    PENDING: ['PROCESSING'],
    PROCESSING: ['PACKING'],
    PACKING: ['SHIPPED'],
    SHIPPED: ['COMPLETED'],
    COMPLETED: [],
  },
}

async function getCurrentUserRole(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{
  userId: string | null
  role: UserRole | null
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { userId: null, role: null }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()) as unknown as { data: { role: UserRole } | null }

  return { userId: user.id, role: profile?.role ?? null }
}

function canUpdateOrderStatus(params: {
  role: UserRole
  orderType: OrderType
  from: OrderStatus
  to: OrderStatus
}): boolean {
  const { role, orderType, from, to } = params

  const allowedNext = VALID_TRANSITIONS_BY_TYPE[orderType][from]
  if (!allowedNext.includes(to)) return false

  // Supervisor punya akses penuh untuk kedua alur.
  if (role === 'SUPERVISOR') return true

  if (orderType === 'INBOUND') {
    // Admin Gudang boleh menyelesaikan inbound.
    return role === 'ADMIN_GUDANG'
  }

  // OUTBOUND
  if (to === 'COMPLETED') {
    // Khusus outbound: hanya Supervisor yang boleh complete.
    return false
  }

  // Packing memproses outbound operasional.
  return role === 'PACKING' && (from === 'PROCESSING' || from === 'PACKING')
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const ordersTable = supabase.from('orders') as unknown as {
    select: (query: string) => {
      eq: (column: 'id', value: string) => {
        single: () => Promise<{
          data: { id: string; status: OrderStatus; type: OrderType } | null
          error: { message: string } | null
        }>
      }
    }
    update: (values: { status: OrderStatus }) => {
      eq: (column: 'id', value: string) => Promise<{
        error: { message: string; code?: string | null } | null
      }>
    }
  }

  const { userId, role } = await getCurrentUserRole(supabase)
  if (!userId || !role) return { success: false, error: 'Tidak terautentikasi.' }

  const { data: order, error: fetchError } = await ordersTable
    .select('id, status, type')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { success: false, error: 'Order tidak ditemukan.' }
  }

  const orderType = order.type as OrderType
  const fromStatus = order.status as OrderStatus

  const allowedNext = VALID_TRANSITIONS_BY_TYPE[orderType][fromStatus]
  if (!allowedNext.includes(newStatus)) {
    return {
      success: false,
      error: `Tidak bisa mengubah status dari ${order.status} ke ${newStatus}.`,
    }
  }

  // Enforce tambahan: outbound COMPLETED hanya Supervisor.
  if (orderType === 'OUTBOUND' && newStatus === 'COMPLETED' && role !== 'SUPERVISOR') {
    return { success: false, error: 'Hanya Supervisor yang boleh menyelesaikan outbound.' }
  }

  if (!canUpdateOrderStatus({ role, orderType, from: fromStatus, to: newStatus })) {
    return { success: false, error: 'Anda tidak punya izin untuk aksi ini.' }
  }

  const { error: updateError } = await ordersTable
    .update({ status: newStatus })
    .eq('id', orderId)

  if (updateError) {
    if (updateError.code === 'P0001') {
      return {
        success: false,
        error: 'Stok produk tidak mencukupi untuk menyelesaikan order ini.',
      }
    }
    return { success: false, error: updateError.message }
  }

  revalidatePath('/dashboard/supervisor')
  revalidatePath('/dashboard/gudang')
  revalidatePath('/dashboard/gudang/inbound')
  revalidatePath('/dashboard/gudang/outbound')
  revalidatePath('/dashboard/packing/outbound')
  revalidatePath(`/dashboard/orders/${orderId}`)

  return { success: true }
}

// OUTBOUND actions
export async function validateOutboundToProcessingAction(orderId: string) {
  return updateOrderStatus(orderId, 'PROCESSING')
}

export async function moveToPackingAction(orderId: string) {
  return updateOrderStatus(orderId, 'PACKING')
}

export async function markOutboundShippedAction(orderId: string) {
  return updateOrderStatus(orderId, 'SHIPPED')
}

export async function completeOutboundAction(orderId: string) {
  return updateOrderStatus(orderId, 'COMPLETED')
}

// INBOUND actions
export async function startInboundProcessingAction(orderId: string) {
  return updateOrderStatus(orderId, 'PROCESSING')
}

export async function completeInboundAction(orderId: string) {
  return updateOrderStatus(orderId, 'COMPLETED')
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const ordersTable = supabase.from('orders') as unknown as {
    insert: (values: { type: OrderType; notes: string; created_by: string; status: OrderStatus }) => {
      select: (query: string) => {
        single: () => Promise<{
          data: { id: string } | null
          error: { message: string } | null
        }>
      }
    }
  }

  const orderItemsTable = supabase.from('order_items') as unknown as {
    insert: (
      values: Array<{ order_id: string; product_id: string; quantity: number }>
    ) => Promise<{ error: { message: string } | null }>
  }

  const { userId, role } = await getCurrentUserRole(supabase)
  if (!userId || !role) return { success: false, error: 'Tidak terautentikasi.' }

  const type = formData.get('type')
  if (type !== 'INBOUND' && type !== 'OUTBOUND') {
    return { success: false, error: 'Tipe order tidak valid.' }
  }

  // Pembuatan order: Admin Gudang atau Supervisor
  if (role !== 'ADMIN_GUDANG' && role !== 'SUPERVISOR') {
    return { success: false, error: 'Anda tidak punya izin untuk membuat order.' }
  }

  const notesRaw = formData.get('notes')
  const notes = typeof notesRaw === 'string' ? notesRaw : ''

  const itemsRaw = formData.get('items')
  if (typeof itemsRaw !== 'string') {
    return { success: false, error: 'Items tidak valid.' }
  }

  let items: Array<{ product_id: string; quantity: number }>
  try {
    items = JSON.parse(itemsRaw) as Array<{ product_id: string; quantity: number }>
  } catch {
    return { success: false, error: 'Items tidak valid.' }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Minimal harus ada 1 item.' }
  }

  for (const item of items) {
    if (!item || typeof item.product_id !== 'string') {
      return { success: false, error: 'Item tidak valid.' }
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { success: false, error: 'Quantity harus berupa angka bulat > 0.' }
    }
  }

  const { data: order, error: orderError } = await ordersTable
    .insert({ type, notes, created_by: userId, status: 'PENDING' })
    .select('id')
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message }
  }

  const { error: itemsError } = await orderItemsTable.insert(
    items.map((item) => ({ ...item, order_id: order.id }))
  )

  if (itemsError) {
    return { success: false, error: itemsError.message }
  }

  revalidatePath('/dashboard/gudang')
  revalidatePath('/dashboard/gudang/inbound')
  revalidatePath('/dashboard/gudang/outbound')
  revalidatePath('/dashboard/packing/outbound')
  revalidatePath('/dashboard/supervisor')

  return { success: true, orderId: order.id }
}
