'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Truck,
  PackageCheck,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react'

const MENU_BY_ROLE: Record<
  UserRole,
  Array<{ label: string; href: string; icon: React.ElementType }>
> = {
  MANAGER: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Laporan', href: '/dashboard/manager', icon: BarChart3 },
    { label: 'Produk', href: '/dashboard/gudang', icon: Package },
    { label: 'Order', href: '/dashboard/supervisor', icon: ClipboardList },
    { label: 'SDM', href: '/dashboard/hr', icon: Users },
    { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  ],
  SUPERVISOR: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Antrean Order', href: '/dashboard/supervisor', icon: ClipboardList },
    { label: 'Produk', href: '/dashboard/gudang', icon: Package },
  ],
  ADMIN_GUDANG: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Inventori', href: '/dashboard/gudang', icon: Package },
    { label: 'Penerimaan', href: '/dashboard/gudang/inbound', icon: Truck },
    { label: 'Pengiriman', href: '/dashboard/gudang/outbound', icon: PackageCheck },
  ],
  PACKING: [
    { label: 'Tugas Packing', href: '/dashboard/packing', icon: PackageCheck },
    { label: 'Outbound', href: '/dashboard/packing/outbound', icon: Truck },
  ],
  HR: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Manajemen Staff', href: '/dashboard/hr', icon: Users },
    { label: 'Absensi', href: '/dashboard/hr/attendance', icon: ClipboardList },
    { label: 'Laporan SDM', href: '/dashboard/hr/reports', icon: BarChart3 },
  ],
}

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const menus = MENU_BY_ROLE[role] ?? []
  const activeHref =
    menus
      .filter(
        (item) =>
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
            <Image
              src="/acc-logo.png"
              alt="Logo PT ACC"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">ACC ERP</p>
            <p className="text-[10px] text-slate-400 leading-tight">Internal Dashboard</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium tracking-wide uppercase">
          {role.replace('_', ' ')}
        </span>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {menus.map((item) => {
          const isActive = item.href === activeHref
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
              <Icon
                size={17}
                className={cn(
                  'shrink-0',
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">v1.0.0 
 PT ACC</p>
      </div>
    </aside>
  )
}
