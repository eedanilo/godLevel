'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
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

interface TrendForecastPanelProps {
  dateRange: {
    start: string
    end: string
  }
}

export default function TrendForecastPanel({ dateRange }: TrendForecastPanelProps) {
  const [metric, setMetric] = useState('revenue')
  const [daysBack, setDaysBack] = useState(30)
  const [forecastDays, setForecastDays] = useState(7)

  const { data, isLoading } = useQuery({
    queryKey: ['trend_forecast', metric, daysBack, forecastDays],
    queryFn: () => api.getTrendForecast({
      metric: metric,
      days_back: daysBack,
      forecast_days: forecastDays,
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

  const historical = data.historical_data || []
  const forecast = data.forecast || []
  const analysis = data.analysis || {}
  const insights = data.insights || []

  // Combine historical and forecast
  const chartData = [
    ...historical.map((h: any) => ({
      date: h.date,
      actual: h.actual_value,
      trend: h.trend_line,
      type: 'historical',
    })),
    ...forecast.map((f: any) => ({
      date: f.date,
      forecast: f.predicted_value,
      type: 'forecast',
    })),
  ]

  const getTrendIcon = () => {
    switch (analysis.trend) {
      case 'increasing':
        return <TrendingUp className="w-6 h-6 text-green-600" />
      case 'decreasing':
        return <TrendingDown className="w-6 h-6 text-red-600" />
      default:
        return <Activity className="w-6 h-6 text-blue-600" />
    }
  }

  const getTrendColor = () => {
    switch (analysis.trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const getQualityColor = () => {
    switch (analysis.model_quality) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const metricLabels: Record<string, string> = {
    revenue: 'Receita',
    orders: 'Pedidos',
    avg_ticket: 'Ticket Médio',
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Métrica</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="revenue">Receita</option>
              <option value="orders">Pedidos</option>
              <option value="avg_ticket">Ticket Médio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período Histórico</label>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dias de Previsão</label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={21}>21 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className={`px-3 py-2 rounded border ${getQualityColor()}`}>
              <p className="text-xs font-medium">Qualidade: {analysis.model_quality || 'N/A'}</p>
              <p className="text-xs mt-1">R²: {(analysis.r_squared || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {getTrendIcon()}
            <span>
              Tendência: {analysis.trend === 'increasing' ? 'Crescendo' : analysis.trend === 'decreasing' ? 'Declinando' : 'Estável'}
            </span>
          </span>
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Variação Diária</p>
            <p className={`text-xl font-bold mt-1 ${getTrendColor()}`}>
              {analysis.trend === 'increasing' ? '+' : ''}
              {metric === 'revenue' ? formatCurrency(analysis.daily_change || 0) : formatNumber(analysis.daily_change || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Variação Percentual</p>
            <p className={`text-xl font-bold mt-1 ${getTrendColor()}`}>
              {analysis.percent_change_per_day >= 0 ? '+' : ''}
              {(analysis.percent_change_per_day || 0).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">R² (Confiabilidade)</p>
            <p className={`text-xl font-bold mt-1 ${
              analysis.r_squared >= 0.7 ? 'text-green-600' : analysis.r_squared >= 0.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(analysis.r_squared || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Qualidade do Modelo</p>
            <p className={`text-xl font-bold mt-1 ${
              analysis.model_quality === 'good' ? 'text-green-600' : analysis.model_quality === 'fair' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysis.model_quality === 'good' ? 'Boa' : analysis.model_quality === 'fair' ? 'Média' : 'Baixa'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Previsão de {metricLabels[metric] || metric}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => 
                  metric === 'revenue' ? formatCurrency(value) : formatNumber(value)
                }
              />
              <Legend />
              <ReferenceLine 
                x={historical.length > 0 ? historical[historical.length - 1].date : ''} 
                stroke="#666" 
                strokeDasharray="3 3" 
                label="Agora"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Valor Real"
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Linha de Tendência"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Previsão"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Forecast Table */}
      {forecast.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previsões Futuras</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Previsão {metricLabels[metric] || metric}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecast.map((f: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{f.date}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {metric === 'revenue' 
                        ? formatCurrency(f.predicted_value)
                        : formatNumber(f.predicted_value)
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
          <div className="space-y-2">
            {insights.map((insight: string, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-900">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

