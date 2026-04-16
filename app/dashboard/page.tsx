import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'
import ManagerOverview from '@/components/dashboard/manager/ManagerOverview'
import HrOverview from '@/components/dashboard/hr/HrOverview'
import StatsCard from '@/components/dashboard/StatsCard'
import OrderQueueTable from '@/components/dashboard/OrderQueueTable'
import { CheckCircle2, LayoutDashboard } from 'lucide-react'
import SupervisorCharts from '@/components/dashboard/supervisor/SupervisorCharts'
import AdminGudangOverview from '@/components/dashboard/gudang/AdminGudangOverview'

export default async function DashboardHome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard ACC ERP</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Sesi tidak ditemukan. Silakan login kembali.
        </p>
      </div>
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role?: UserRole } | null
  const role = (profile?.role ?? 'PACKING') as UserRole

  // Overview khusus MANAGER
  if (role === 'MANAGER') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [
      inventoryAgg,
      queueCountAgg,
      attendanceAgg,
      roleDist,
      orderStatusAgg,
      orderTrendAgg,
      recentProductHistoryAgg,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('stock, price_wholesale')
        .returns<{ stock: number; price_wholesale: number }[]>(),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['PENDING', 'PROCESSING', 'PACKING']),
      supabase
        .from('attendance')
        .select('user_id', { count: 'exact', head: true })
        .eq('date', new Date().toISOString().slice(0, 10)),
      supabase
        .from('profiles')
        .select('role'),
      supabase
        .from('orders')
        .select('status'),
      supabase
        .from('orders')
        .select('type, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('order_items')
        .select(
          `
          id, quantity, created_at,
          orders ( id, type, status ),
          products ( sku, name, unit )
        `
        )
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const products = (inventoryAgg.data ?? []) as { stock: number; price_wholesale: number }[]
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.stock || 0) * (Number(p.price_wholesale) || 0),
      0
    )

    const packingQueue = queueCountAgg.count ?? 0
    const todayAttendance = attendanceAgg.count ?? 0
    const roleRows = (roleDist.data ?? []) as { role: string }[]
    const totalStaff = roleRows.length

    const roleCounts: Record<string, number> = {}
    roleRows.forEach((r) => {
      roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1
    })

    const orderStatusRows = (orderStatusAgg.data ?? []) as { status: string }[]
    const orderStatusCounts: Record<string, number> = {}
    orderStatusRows.forEach((row) => {
      orderStatusCounts[row.status] = (orderStatusCounts[row.status] ?? 0) + 1
    })

    const trendDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo)
      date.setDate(sevenDaysAgo.getDate() + index)
      return date
    })

    const trendKeys = trendDates.map((date) => date.toISOString().slice(0, 10))
    const trendLabels = trendDates.map((date) =>
      new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date)
    )

    const trendMap = Object.fromEntries(
      trendKeys.map((key) => [key, { INBOUND: 0, OUTBOUND: 0 }])
    ) as Record<string, { INBOUND: number; OUTBOUND: number }>

    const orderTrendRows = (orderTrendAgg.data ?? []) as {
      type: 'INBOUND' | 'OUTBOUND'
      created_at: string
    }[]

    orderTrendRows.forEach((row) => {
      const dateKey = new Date(row.created_at).toISOString().slice(0, 10)
      if (trendMap[dateKey]) {
        trendMap[dateKey][row.type] += 1
      }
    })

    const orderTrend = {
      labels: trendLabels,
      inboundSeries: trendKeys.map((key) => trendMap[key].INBOUND),
      outboundSeries: trendKeys.map((key) => trendMap[key].OUTBOUND),
    }

    const recentProductHistory = (recentProductHistoryAgg.data ?? []) as {
      id: string
      quantity: number
      created_at: string
      orders: {
        id: string
        type: 'INBOUND' | 'OUTBOUND'
        status: 'PENDING' | 'PROCESSING' | 'PACKING' | 'SHIPPED' | 'COMPLETED'
      } | null
      products: {
        sku: string
        name: string
        unit: string
      } | null
    }[]

    return (
      <ManagerOverview
        totalInventoryValue={totalInventoryValue}
        packingQueue={packingQueue}
        todayAttendance={todayAttendance}
        totalStaff={totalStaff}
        roleCounts={roleCounts}
        orderStatusCounts={orderStatusCounts}
        recentProductHistory={recentProductHistory.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          created_at: item.created_at,
          order: item.orders,
          product: item.products,
        }))}
        orderTrend={orderTrend}
      />
    )
  }

  // Overview khusus HR
  if (role === 'HR') {
    const [profilesRes, attendanceRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .order('full_name', { ascending: true }),
      supabase
        .from('attendance')
        .select('user_id')
        .eq('date', new Date().toISOString().slice(0, 10)),
    ])

    const staff = (profilesRes.data ?? []) as {
      id: string
      full_name: string
      role: UserRole
      status: 'active' | 'inactive'
    }[]
    const attendanceRows = (attendanceRes.data ?? []) as { user_id: string }[]
    const attendanceSet = new Set(attendanceRows.map((r) => r.user_id))

    const totalStaff = staff.length
    const activeStaff = staff.filter((s) => s.status === 'active').length
    const presentToday = attendanceSet.size

    const roleCounts: Record<string, number> = {}
    staff.forEach((s) => {
      roleCounts[s.role] = (roleCounts[s.role] ?? 0) + 1
    })

    return (
      <HrOverview
        totalStaff={totalStaff}
        activeStaff={activeStaff}
        presentToday={presentToday}
        roleCounts={roleCounts}
      />
    )
  }

  // Overview khusus SUPERVISOR
  if (role === 'SUPERVISOR') {
    const [
      { count: pendingCount },
      { count: processingCount },
      { count: packingCount },
      { count: shippedCount },
      { data: queueOrders },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PROCESSING'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PACKING'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'SHIPPED'),
      supabase
        .from('orders')
        .select(
          `
          id, type, status, created_at, notes,
          profiles:created_by (full_name),
          order_items (count)
        `
        )
        .in('status', ['PENDING', 'PROCESSING', 'PACKING', 'SHIPPED'])
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    type QueueOrderRow = {
      id: string
      type: string
      status: string
      created_at: string
      notes: string | null
      profiles: { full_name: string } | null
      order_items: Array<{ count: number }>
    }

    const activeOrders = (queueOrders ?? []) as QueueOrderRow[]

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview Supervisor</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau antrean dan validasi operasional gudang.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Status Antrean
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <StatsCard title="Pending" value={pendingCount ?? 0} subtitle="order baru" accent="amber" />
                <StatsCard
                  title="Processing"
                  value={processingCount ?? 0}
                  subtitle="siap dipacking"
                  accent="indigo"
                />
                <StatsCard
                  title="Packing"
                  value={packingCount ?? 0}
                  subtitle="sedang dikemas"
                  accent="emerald"
                />
                <StatsCard title="Shipped" value={shippedCount ?? 0} subtitle="menunggu complete" accent="rose" />
              </div>
            </section>
          </div>

          <div>
            <SupervisorCharts
              statusCounts={{
                pending: pendingCount ?? 0,
                processing: processingCount ?? 0,
                packing: packingCount ?? 0,
                shipped: shippedCount ?? 0,
              }}
            />
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Antrean Order Aktif
            </h2>
            <span className="text-xs text-slate-400">{activeOrders.length} order</span>
          </div>
          <OrderQueueTable orders={activeOrders} role={role} />
        </section>
      </div>
    )
  }

  // Default untuk role lain (PACKING, ADMIN_GUDANG)
  const isGudang = role === 'ADMIN_GUDANG'

  let gudangStats = null
  if (isGudang) {
    const jakartaToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
    }).format(new Date())
    const dayStart = new Date(`${jakartaToday}T00:00:00+07:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const [stockRes, inboundAgg, outboundAgg] = await Promise.all([
      supabase.from('v_product_stock_status').select('stock_status'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'INBOUND')
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString()),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'OUTBOUND')
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString()),
    ])

    if (stockRes.data) {
      const stats = stockRes.data as Array<{ stock_status: string }>
      const total = stats.length
      const critical = stats.filter((s) => s.stock_status !== 'AMAN').length

      gudangStats = {
        inventory: {
          totalSku: total,
          criticalStock: critical,
          normalStock: total - critical,
        },
        activity: {
          inboundToday: inboundAgg.count ?? 0,
          outboundToday: outboundAgg.count ?? 0,
        },
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-4">
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard ACC ERP</h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Selamat datang di sistem ERP PT Anugerah Cahaya Chandra. Pantau inventori dan 
            lakukan pergerakan barang hari ini.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 pt-4 lg:pt-0">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1 text-[10px]">Status</p>
              <p className="text-sm font-bold text-slate-900">Aktif</p>
            </div>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1 text-[10px]">Role</p>
              <p className="text-sm font-bold text-slate-900">{role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {isGudang && gudangStats && (
        <AdminGudangOverview 
          inventoryStats={gudangStats.inventory} 
          recentActivity={gudangStats.activity} 
        />
      )}
    </div>
  )
}
