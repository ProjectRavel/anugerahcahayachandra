import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon?: React.ElementType
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const ACCENT_STYLES = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100' },
} as const

export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accent = 'indigo',
}: StatsCardProps) {
  const style = ACCENT_STYLES[accent]
  const isPositive = (trend ?? 0) > 0
  const isNeutral = trend === 0 || trend === undefined

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'bg-white/70 backdrop-blur-sm',
        'border border-white shadow-sm shadow-slate-200/60',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
      )}
    >
      <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20', style.bg)} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded-lg', style.icon)}>
              <Icon size={16} className={style.text} />
            </div>
          )}
        </div>

        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>

        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {isNeutral ? (
                <Minus size={12} />
              ) : isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
