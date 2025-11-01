'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BarChart3, TrendingUp, Clock, ShoppingBag, DollarSign } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts'

interface CorrelationAnalysisPanelProps {
  dateRange: {
    start: string
    end: string
  }
}

export default function CorrelationAnalysisPanel({ dateRange }: CorrelationAnalysisPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['correlations', dateRange.start, dateRange.end],
    queryFn: () => api.getCorrelations({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    )
  }

  const analyses = data.analyses || {}
  const insights = data.insights || []

  // Process discount impact
  const discountData = (analyses.discount_impact || []).map((d: any) => ({
    range: d.discount_range || 'N/A',
    avgOrderValue: parseFloat(d.avg_order_value || 0),
    orderCount: parseInt(d.order_count || 0),
    totalRevenue: parseFloat(d.total_revenue || 0),
  }))

  // Process day of week pattern
  const dowData = (analyses.day_of_week_pattern || []).map((d: any) => ({
    day: d.day_name || 'N/A',
    orderCount: parseInt(d.order_count || 0),
    avgOrderValue: parseFloat(d.avg_order_value || 0),
    totalRevenue: parseFloat(d.total_revenue || 0),
  }))

  // Process hourly pattern
  const hourlyData = (analyses.hourly_pattern || []).map((d: any) => ({
    hour: `${d.hour}h`,
    period: d.period || 'N/A',
    orderCount: parseInt(d.order_count || 0),
    avgOrderValue: parseFloat(d.avg_order_value || 0),
    avgPartySize: parseFloat(d.avg_party_size || 0),
  }))

  // Process channel comparison
  const channelData = (analyses.channel_comparison || []).map((d: any) => ({
    name: d.channel_name || 'N/A',
    type: d.channel_type || 'N/A',
    orderCount: parseInt(d.order_count || 0),
    avgOrderValue: parseFloat(d.avg_order_value || 0),
    totalRevenue: parseFloat(d.total_revenue || 0),
  }))

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <span>Insights Principais</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="font-semibold text-gray-900">{insight.title}</p>
                <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount Impact */}
      {discountData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <span>Impacto de Descontos no Valor do Pedido</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={discountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="orderCount" fill="#3b82f6" name="Quantidade de Pedidos" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgOrderValue"
                stroke="#10b981"
                name="Ticket Médio (R$)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of Week Pattern */}
      {dowData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Padrão por Dia da Semana</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orderCount" fill="#3b82f6" name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly Pattern */}
      {hourlyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Padrão por Hora do Dia</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="orderCount" fill="#3b82f6" name="Pedidos" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgOrderValue"
                stroke="#10b981"
                name="Ticket Médio (R$)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Channel Comparison */}
      {channelData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <span>Comparação por Canal</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Canal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pedidos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ticket Médio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Receita Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {channelData.map((channel: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{channel.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{channel.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(channel.orderCount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(channel.avgOrderValue)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(channel.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

