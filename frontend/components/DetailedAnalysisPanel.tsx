'use client'

import { useQuery } from '@tanstack/react-query'
import { api, DetailedAnalysis } from '@/lib/api'
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, Percent, BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DetailedAnalysisPanelProps {
  entityType: 'store' | 'product' | 'channel'
  entityId: number | null
  entityName: string
  startDate: string
  endDate: string
}

export default function DetailedAnalysisPanel({
  entityType,
  entityId,
  entityName,
  startDate,
  endDate,
}: DetailedAnalysisPanelProps) {
  const { data, isLoading } = useQuery<DetailedAnalysis>({
    queryKey: ['detailed-analysis', entityType, entityId, startDate, endDate],
    queryFn: () => api.getDetailedAnalysis({
      entity_type: entityType,
      entity_id: entityId!,
      start_date: startDate,
      end_date: endDate,
    }),
    enabled: entityId !== null,
  })

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Carregando análise...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Selecione uma {entityType === 'store' ? 'loja' : entityType === 'product' ? 'produto' : 'canal'} para visualizar a análise</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatTime = (seconds: number) => {
    return Math.floor(seconds)
  }

  const getBreakdownLabel = () => {
    if (entityType === 'store') return 'Produtos mais vendidos'
    if (entityType === 'product') return 'Lojas que vendem mais'
    return 'Lojas mais ativas'
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.metrics.total_orders.toLocaleString('pt-BR')}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.metrics.total_revenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.metrics.avg_ticket)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Descontos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.metrics.total_discounts)}</p>
            </div>
            <Percent className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio de Preparo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatTime(data.metrics.avg_production_time)}s</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio de Entrega</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatTime(data.metrics.avg_delivery_time)}s</p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Gráfico de tendências diárias */}
      {data.trends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Tendências Diárias</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'revenue' || name === 'avg_ticket') {
                    return formatCurrency(value)
                  }
                  if (name === 'avg_production_time' || name === 'avg_delivery_time') {
                    return `${formatTime(value)}s`
                  }
                  return value
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="order_count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Pedidos"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Receita"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avg_ticket" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Ticket Médio"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avg_production_time" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Tempo Preparo (s)"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avg_delivery_time" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Tempo Entrega (s)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de tendências por hora */}
      {data.hourly_trends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Tendências por Hora</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Hora', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'revenue') {
                    return formatCurrency(value)
                  }
                  return value
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="order_count" fill="#3b82f6" name="Pedidos" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown */}
      {data.breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{getBreakdownLabel()}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nome
                  </th>
                  {entityType === 'store' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Quantidade
                    </th>
                  )}
                  {entityType !== 'store' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Pedidos
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Receita
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.breakdown.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    {entityType === 'store' && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.quantity?.toLocaleString('pt-BR') || '-'}
                      </td>
                    )}
                    {entityType !== 'store' && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.order_count?.toLocaleString('pt-BR') || '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(item.revenue)}
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

