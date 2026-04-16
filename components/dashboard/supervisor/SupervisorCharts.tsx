'use client'

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface SupervisorOverviewProps {
  statusCounts: {
    pending: number
    processing: number
    packing: number
    shipped: number
  }
}

export default function SupervisorCharts({ statusCounts }: SupervisorOverviewProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
    },
    labels: ['Pending', 'Processing', 'Packing', 'Shipped'],
    colors: ['#f59e0b', '#6366f1', '#10b981', '#f43f5e'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Order',
              formatter: () => 
                (statusCounts.pending + statusCounts.processing + statusCounts.packing + statusCounts.shipped).toString(),
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
  }

  const series = [
    statusCounts.pending,
    statusCounts.processing,
    statusCounts.packing,
    statusCounts.shipped,
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-slate-900 mb-6 w-full text-center">Status Antrean Order</h3>
      <div className="w-full max-w-[320px]">
        <Chart options={chartOptions} series={series} type="donut" width="100%" />
      </div>
    </div>
  )
}
