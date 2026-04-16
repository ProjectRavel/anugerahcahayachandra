'use client'

import Chart from 'react-apexcharts'
import type { ApexOptions, ApexAxisChartSeries, ApexNonAxisChartSeries } from 'apexcharts'

interface ApexChartProps {
  type: 'line' | 'bar' | 'area' | 'donut' | 'pie'
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  options?: ApexOptions
}

export default function ApexChart({ type, series, options }: ApexChartProps) {
  return (
    <Chart
      type={type}
      series={series as any}
      options={{
        chart: {
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        grid: { borderColor: '#e2e8f0' },
        ...options,
      }}
      height="100%"
      width="100%"
    />
  )
}
