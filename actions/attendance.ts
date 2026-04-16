'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
type AttendanceUpdate = Database['public']['Tables']['attendance']['Update']

export async function checkIn(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tidak terautentikasi.' }

  const today = new Date().toISOString().split('T')[0]

  const existingRes = (await supabase
    .from('attendance')
    .select('id, check_in')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()) as unknown as {
    data: Pick<AttendanceRow, 'id' | 'check_in'> | null
  }
  const existing = existingRes.data

  if (existing?.check_in) {
    return { success: false, error: 'Anda sudah melakukan check-in hari ini.' }
  }

  const payload: AttendanceInsert = {
    user_id: user.id,
    date: today,
    check_in: new Date().toISOString(),
  }
  const upsertRes = (await supabase.from('attendance').upsert(payload as never)) as unknown as {
    error: { message: string } | null
  }
  const { error } = upsertRes

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function checkOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tidak terautentikasi.' }

  const today = new Date().toISOString().split('T')[0]

  const updatePayload: AttendanceUpdate = { check_out: new Date().toISOString() }
  const updateRes = (await supabase
    .from('attendance')
    .update(updatePayload as never)
    .eq('user_id', user.id)
    .eq('date', today)
    .is('check_out', null)) as unknown as {
    error: { message: string } | null
  }
  const { error } = updateRes

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
