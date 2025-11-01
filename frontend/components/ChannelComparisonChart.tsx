'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChannelComparison {
  id: number
  channel_name: string
  channel_type: string
  total_orders: number
  total_revenue: number
  avg_ticket: number
  total_delivery_fee: number
  avg_delivery_time: number
}

interface ChannelComparisonChartProps {
  data: ChannelComparison[]
  isLoading?: boolean
}

export default function ChannelComparisonChart({ data, isLoading }: ChannelComparisonChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Canais</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.map((channel) => ({
    canal: channel.channel_name,
    pedidos: channel.total_orders,
    receita: parseFloat(channel.total_revenue.toString()),
    ticket_medio: parseFloat(channel.avg_ticket.toString()),
  }))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Canais</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="canal" />
          <YAxis />
          <Tooltip 
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return value < 1000 ? value : formatCurrency(value)
              }
              return value
            }}
          />
          <Legend />
          <Bar dataKey="pedidos" fill="#ef4444" name="Pedidos" />
          <Bar dataKey="receita" fill="#dc2626" name="Receita (R$)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

