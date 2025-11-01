'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Database, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
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
} from 'recharts'

interface DataProfilingPanelProps {
  dateRange: {
    start: string
    end: string
  }
}

export default function DataProfilingPanel({ dateRange }: DataProfilingPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['sales_profile', dateRange.start, dateRange.end],
    queryFn: () => api.getSalesProfile({
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

  const profile = data
  const summary = profile.summary || {}
  const revenueStats = profile.revenue_stats || {}
  const distribution = profile.distribution || []
  const insights = profile.insights || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Registros</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(summary.total_records || 0)}
              </p>
            </div>
            <Database className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vendas Completas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(summary.completed_sales || 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Cancelamento</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(summary.cancellation_rate || 0).toFixed(1)}%
              </p>
            </div>
            {summary.cancellation_rate > 10 ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lojas Únicas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(summary.unique_stores || 0)}
              </p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Revenue Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas de Receita</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Média</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueStats.mean || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mediana</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueStats.median || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mínimo</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueStats.min || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Máximo</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueStats.max || 0)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Valores Atípicos (Outliers)</p>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(revenueStats.outliers || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">
            Limites: {formatCurrency(revenueStats.outlier_bounds?.lower || 0)} - {formatCurrency(revenueStats.outlier_bounds?.upper || 0)}
          </p>
        </div>
      </div>

      {/* Distribution Histogram */}
      {distribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Receita</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Quantidade de Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
          <div className="space-y-3">
            {insights.map((insight: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : insight.type === 'positive'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {insight.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{insight.title}</p>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
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

