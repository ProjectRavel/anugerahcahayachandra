// ============================================================
// FILE: app/dashboard/layout.tsx
// Layout Utama: Sidebar + Navbar
// ============================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar role={profile.role} />

      {/* Konten utama */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}


// ============================================================
// FILE: components/dashboard/Sidebar.tsx
// Sidebar dinamis berdasarkan role
// ============================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'
import {
  LayoutDashboard, Package, ClipboardList, Users,
  Truck, PackageCheck, BarChart3, Settings, ChevronRight,
} from 'lucide-react'

// Definisi menu per role
const MENU_BY_ROLE: Record<UserRole, Array<{ label: string; href: string; icon: React.ElementType }>> = {
  MANAGER: [
    { label: 'Overview',     href: '/dashboard',           icon: LayoutDashboard },
    { label: 'Laporan',      href: '/dashboard/manager',   icon: BarChart3 },
    { label: 'Produk',       href: '/dashboard/gudang',    icon: Package },
    { label: 'Order',        href: '/dashboard/supervisor',icon: ClipboardList },
    { label: 'SDM',          href: '/dashboard/hr',        icon: Users },
    { label: 'Pengaturan',   href: '/dashboard/settings',  icon: Settings },
  ],
  SUPERVISOR: [
    { label: 'Overview',     href: '/dashboard',           icon: LayoutDashboard },
    { label: 'Antrean Order',href: '/dashboard/supervisor',icon: ClipboardList },
    { label: 'Produk',       href: '/dashboard/gudang',    icon: Package },
  ],
  ADMIN_GUDANG: [
    { label: 'Overview',     href: '/dashboard',           icon: LayoutDashboard },
    { label: 'Inventori',    href: '/dashboard/gudang',    icon: Package },
    { label: 'Penerimaan',   href: '/dashboard/gudang/inbound', icon: Truck },
    { label: 'Pengiriman',   href: '/dashboard/gudang/outbound',icon: PackageCheck },
  ],
  PACKING: [
    { label: 'Tugas Packing',href: '/dashboard/packing',  icon: PackageCheck },
    { label: 'Absensi',      href: '/dashboard/packing/attendance', icon: Users },
  ],
  HR: [
    { label: 'Overview',     href: '/dashboard',           icon: LayoutDashboard },
    { label: 'Manajemen Staff', href: '/dashboard/hr',     icon: Users },
    { label: 'Absensi',      href: '/dashboard/hr/attendance', icon: ClipboardList },
    { label: 'Laporan SDM',  href: '/dashboard/hr/reports',icon: BarChart3 },
  ],
}

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const menus = MENU_BY_ROLE[role] ?? []

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">ACC ERP</p>
            <p className="text-[10px] text-slate-400 leading-tight">Internal Dashboard</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-5 pb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium tracking-wide uppercase">
          {role.replace('_', ' ')}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {menus.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={17} className={cn(
                'shrink-0',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
              )} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer sidebar */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">v1.0.0 · PT ACC</p>
      </div>
    </aside>
  )
}


// ============================================================
// FILE: components/dashboard/Navbar.tsx
// Top navigation bar dengan profil user
// ============================================================

import { Bell, Menu } from 'lucide-react'
import type { Profile } from '@/types/database'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Navbar({ profile }: { profile: Pick<Profile, 'full_name' | 'role'> }) {
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date())

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      {/* Kiri: Tombol mobile menu + tanggal */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <Menu size={20} />
        </button>
        <p className="hidden md:block text-sm text-slate-400">{today}</p>
      </div>

      {/* Kanan: Notifikasi + Profil */}
      <div className="flex items-center gap-3">
        {/* Bell notifikasi */}
        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <Bell size={18} />
          {/* Indikator notifikasi belum dibaca */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Profil user */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
            {getInitials(profile.full_name)}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-900 leading-tight">{profile.full_name}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}


// ============================================================
// FILE: components/dashboard/StatsCard.tsx
// Komponen stat card dengan glassmorphism + trend indicator
// ============================================================

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number // persentase, positif = naik, negatif = turun
  icon?: React.ElementType
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const ACCENT_STYLES = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  icon: 'bg-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    icon: 'bg-rose-100' },
}

export default function StatsCard({
  title, value, subtitle, trend, icon: Icon, accent = 'indigo'
}: StatsCardProps) {
  const style = ACCENT_STYLES[accent]
  const isPositive = (trend ?? 0) > 0
  const isNeutral = trend === 0 || trend === undefined

  return (
    <div className={cn(
      // Glassmorphism effect: backdrop blur + semi-transparent bg
      'relative overflow-hidden rounded-2xl p-5',
      'bg-white/70 backdrop-blur-sm',
      'border border-white shadow-sm shadow-slate-200/60',
      'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
    )}>
      {/* Decorative accent blob (glassmorphism detail) */}
      <div className={cn(
        'absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20',
        style.bg
      )} />

      <div className="relative">
        {/* Header: judul + icon */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded-lg', style.icon)}>
              <Icon size={16} className={style.text} />
            </div>
          )}
        </div>

        {/* Nilai utama */}
        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>

        {/* Trend + subtitle */}
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}


// ============================================================
// FILE: app/dashboard/supervisor/page.tsx
// Dashboard Supervisor: Quick Stats + Tabel Antrean Packing
// ============================================================

import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import OrderQueueTable from '@/components/dashboard/OrderQueueTable'
import { Package, Truck, PackageCheck, Clock } from 'lucide-react'

export default async function SupervisorDashboard() {
  const supabase = await createClient()

  // Fetch data paralel untuk performa optimal
  const [
    { count: pendingCount },
    { count: processingCount },
    { count: packingCount },
    { count: shippedCount },
    { data: queueOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PROCESSING'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PACKING'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'SHIPPED'),
    // Ambil order yang sedang aktif beserta nama pembuat
    supabase
      .from('orders')
      .select(`
        id, type, status, created_at, notes,
        profiles:created_by (full_name),
        order_items (count)
      `)
      .in('status', ['PENDING', 'PROCESSING', 'PACKING', 'SHIPPED'])
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Supervisor</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau status operasional gudang secara real-time</p>
      </div>

      {/* Quick Stats Grid */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Status Order Hari Ini
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Menunggu"
            value={pendingCount ?? 0}
            subtitle="order baru"
            accent="amber"
            icon={Clock}
          />
          <StatsCard
            title="Diproses"
            value={processingCount ?? 0}
            subtitle="di gudang"
            accent="indigo"
            icon={Package}
          />
          <StatsCard
            title="Packing"
            value={packingCount ?? 0}
            subtitle="sedang dikemas"
            accent="emerald"
            icon={PackageCheck}
          />
          <StatsCard
            title="Dikirim"
            value={shippedCount ?? 0}
            subtitle="dalam perjalanan"
            accent="rose"
            icon={Truck}
          />
        </div>
      </section>

      {/* Tabel Antrean Packing */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Antrean Order Aktif
          </h2>
          <span className="text-xs text-slate-400">{queueOrders?.length ?? 0} order</span>
        </div>
        <OrderQueueTable orders={queueOrders ?? []} />
      </section>
    </div>
  )
}


// ============================================================
// FILE: components/dashboard/OrderQueueTable.tsx
// Tabel antrean order dengan tombol aksi
// ============================================================

'use client'

import { useState, useTransition } from 'react'
import { moveToPackingAction } from '@/actions/orders'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderType } from '@/types/database'
import { ArrowRight, Loader2 } from 'lucide-react'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING:    { label: 'Menunggu',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PROCESSING: { label: 'Diproses', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PACKING:    { label: 'Packing',  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  SHIPPED:    { label: 'Dikirim',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED:  { label: 'Selesai',  className: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const TYPE_CONFIG: Record<OrderType, { label: string; className: string }> = {
  INBOUND:  { label: 'Masuk', className: 'text-emerald-600' },
  OUTBOUND: { label: 'Keluar', className: 'text-rose-600' },
}

export default function OrderQueueTable({ orders }: { orders: any[] }) {
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  async function handleMoveToPacking(orderId: string) {
    setLoadingId(orderId)
    startTransition(async () => {
      const result = await moveToPackingAction(orderId)
      if (result.success) {
        setNotification({ type: 'success', msg: 'Order berhasil dipindahkan ke Packing.' })
      } else {
        setNotification({ type: 'error', msg: result.error ?? 'Terjadi kesalahan.' })
      }
      setLoadingId(null)
      setTimeout(() => setNotification(null), 4000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Notifikasi inline */}
      {notification && (
        <div className={cn(
          'px-4 py-2.5 text-sm font-medium border-b',
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        )}>
          {notification.msg}
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Order</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dibuat Oleh</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status as OrderStatus]
              const type = TYPE_CONFIG[order.type as OrderType]
              const isLoading = loadingId === order.id
              const canMoveToPacking = order.status === 'PROCESSING'

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* ID (pendek) */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  {/* Tipe */}
                  <td className={cn('py-3.5 px-4 font-semibold text-xs', type.className)}>
                    {type.label}
                  </td>
                  {/* Status badge */}
                  <td className="py-3.5 px-4">
                    <span className={cn(
                      'inline-flex px-2.5 py-1 rounded-full text-xs font-medium border',
                      status.className
                    )}>
                      {status.label}
                    </span>
                  </td>
                  {/* Pembuat */}
                  <td className="py-3.5 px-4 text-slate-700">
                    {order.profiles?.full_name ?? '—'}
                  </td>
                  {/* Jumlah item */}
                  <td className="py-3.5 px-4 text-slate-500">
                    {order.order_items?.[0]?.count ?? 0} produk
                  </td>
                  {/* Waktu */}
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Intl.DateTimeFormat('id-ID', {
                      hour: '2-digit', minute: '2-digit'
                    }).format(new Date(order.created_at))}
                  </td>
                  {/* Aksi */}
                  <td className="py-3.5 px-4 text-right">
                    {canMoveToPacking && (
                      <button
                        onClick={() => handleMoveToPacking(order.id)}
                        disabled={isLoading}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      >
                        {isLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>Ke Packing <ArrowRight size={12} /></>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Tidak ada order aktif saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
