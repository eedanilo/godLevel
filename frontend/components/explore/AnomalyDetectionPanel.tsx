'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

export default function AnomalyDetectionPanel() {
  const [daysBack, setDaysBack] = useState(30)
  const [sensitivity, setSensitivity] = useState(2.0)

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies', daysBack, sensitivity],
    queryFn: () => api.getAnomalies({
      days_back: daysBack,
      sensitivity: sensitivity,
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

  const anomalies = data.anomalies || []
  const normalDays = data.normal_days || []
  const summary = data.summary || {}

  // Prepare chart data
  const chartData = [
    ...anomalies.map((a: any) => ({
      date: a.date,
      orders: a.order_count,
      revenue: a.revenue,
      isAnomaly: true,
      anomalyTypes: a.anomaly_types || [],
    })),
    ...normalDays.map((n: any) => ({
      date: n.date,
      orders: n.order_count,
      revenue: n.revenue,
      isAnomaly: false,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Calculate average for reference line
  const avgOrders = chartData.reduce((sum, d) => sum + d.orders, 0) / chartData.length
  const avgRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período (dias)</label>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sensibilidade</label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={1.0}>Alta (1.0σ)</option>
              <option value={1.5}>Média-Alta (1.5σ)</option>
              <option value={2.0}>Média (2.0σ)</option>
              <option value={2.5}>Média-Baixa (2.5σ)</option>
              <option value={3.0}>Baixa (3.0σ)</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{formatNumber(anomalies.length)}</span> anomalias encontradas
              <br />
              <span className="text-xs">
                Taxa: {summary.anomaly_rate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anomalias Detectadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(summary.anomalies_found || 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dias Analisados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(summary.days_analyzed || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Anomalias</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(summary.anomaly_rate || 0).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume de Pedidos ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={avgOrders} stroke="#666" strokeDasharray="3 3" label="Média" />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Pedidos"
                dot={(props: any) => {
                  const isAnomaly = chartData[props.index]?.isAnomaly
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={isAnomaly ? 5 : 3}
                      fill={isAnomaly ? '#ef4444' : '#3b82f6'}
                      stroke={isAnomaly ? '#dc2626' : '#2563eb'}
                      strokeWidth={isAnomaly ? 2 : 1}
                    />
                  )
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies List */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomalias Detectadas</h3>
          <div className="space-y-3">
            {anomalies.map((anomaly: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  anomaly.severity === 'high'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{anomaly.date}</h4>
                      {anomaly.severity === 'high' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-600">Pedidos</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatNumber(anomaly.order_count)} {anomaly.order_deviation || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Receita</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(anomaly.revenue)} {anomaly.revenue_deviation || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tipos</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(anomaly.anomaly_types || []).map((type: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs font-medium bg-white rounded border border-gray-300"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

