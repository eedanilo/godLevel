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
  revenue_percentage?: number
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
    porcentagem: channel.revenue_percentage || 0,
  }))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Canais</h3>
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((channel) => (
            <div key={channel.id} className="border rounded-lg p-3">
              <div className="text-sm text-gray-600">{channel.channel_name}</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(channel.total_revenue)}
              </div>
              {channel.revenue_percentage !== undefined && (
                <div className="text-sm text-gray-500">
                  {channel.revenue_percentage.toFixed(1)}% do total
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="canal" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === 'porcentagem') {
                return `${value.toFixed(1)}%`
              }
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

