'use client'

import { useState, useEffect } from 'react'
import { LogIn, LogOut, Clock, CheckCircle2 } from 'lucide-react'
import { checkIn, checkOut } from '@/actions/attendance'
import { cn } from '@/lib/utils'

export default function NavbarAttendance({
  initialData,
}: {
  initialData?: { check_in: string | null; check_out: string | null }
}) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const res = await checkIn()
      if (res.success) {
        setData({ check_in: new Date().toISOString(), check_out: null })
      } else {
        alert(res.error || 'Gagal check-in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!confirm('Apakah Anda yakin ingin check-out?')) return
    setLoading(true)
    try {
      const res = await checkOut()
      if (res.success) {
        setData((prev) => ({ ...prev!, check_out: new Date().toISOString() }))
      } else {
        alert(res.error || 'Gagal check-out')
      }
    } finally {
      setLoading(false)
    }
  }

  const timeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // State: 0 (Belum Absen), 1 (Sedang Bekerja), 2 (Selesai/Sudah Check-out)
  const status = !data?.check_in ? 0 : !data.check_out ? 1 : 2

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 mr-2">
        <Clock size={13} className="text-slate-400" />
        <span className="text-xs font-semibold tabular-nums tracking-tight">{timeStr}</span>
      </div>

      {status === 0 ? (
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-sm shadow-indigo-100"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={14} />
              Absen Masuk
            </>
          )}
        </button>
      ) : status === 1 ? (
        <button
          onClick={handleCheckOut}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 rounded-full text-xs font-bold transition-all border border-rose-100"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
          ) : (
            <>
              <LogOut size={14} />
              Absen Pulang
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
          <CheckCircle2 size={14} />
          Selesai
        </div>
      )}
    </div>
  )
}
