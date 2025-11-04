'use client'

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

  // Remover duplicatas baseado no nome do canal
  const uniqueChannels = new Map<string, ChannelComparison>()
  for (const channel of data) {
    const key = channel.channel_name.trim().toLowerCase()
    if (!uniqueChannels.has(key)) {
      uniqueChannels.set(key, channel)
    } else {
      // Se já existe, manter o que tem maior receita
      const existing = uniqueChannels.get(key)!
      if (channel.total_revenue > existing.total_revenue) {
        uniqueChannels.set(key, channel)
      }
    }
  }
  
  const uniqueData = Array.from(uniqueChannels.values())

  const chartData = uniqueData.map((channel) => ({
    canal: channel.channel_name,
    pedidos: channel.total_orders,
    receita: parseFloat(channel.total_revenue.toString()),
    ticket_medio: parseFloat(channel.avg_ticket.toString()),
    porcentagem: channel.revenue_percentage || 0,
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Participação dos Canais no Faturamento</h3>
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {uniqueData.map((channel, index) => (
            <div key={`${channel.id}-${index}`} className="border rounded-lg p-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Gráfico de Participação</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ canal, porcentagem }) => `${canal}: ${porcentagem.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="porcentagem"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${value.toFixed(1)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Comparação de Receita</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="canal" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'porcentagem') {
                    return `${value.toFixed(1)}%`
                  }
                  if (name === 'receita') {
                    return formatCurrency(value)
                  }
                  if (typeof value === 'number') {
                    return value < 1000 ? value : formatCurrency(value)
                  }
                  return value
                }}
              />
              <Legend />
              <Bar dataKey="receita" fill="#3b82f6" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

