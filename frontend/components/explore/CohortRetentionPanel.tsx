'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Users, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export default function CohortRetentionPanel() {
  const [cohortMonths, setCohortMonths] = useState(6)

  const { data, isLoading } = useQuery({
    queryKey: ['cohort_retention', cohortMonths],
    queryFn: () => api.getCohortRetention({
      cohort_months: cohortMonths,
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

  const cohorts = data.cohorts || []
  const summary = data.summary || {}
  const avgRetention = summary.average_retention_by_month || {}

  const getColor = (rate: number) => {
    if (rate >= 50) return 'bg-green-500'
    if (rate >= 30) return 'bg-yellow-500'
    if (rate >= 10) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getTextColor = (rate: number) => {
    if (rate >= 50) return 'text-green-900'
    if (rate >= 30) return 'text-yellow-900'
    if (rate >= 10) return 'text-orange-900'
    return 'text-red-900'
  }

  // Find max months to display
  const maxMonths = Math.max(...cohorts.map((c: any) => 
    Math.max(...(c.retention_by_month || []).map((m: any) => m.month))
  ), cohortMonths)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Meses de Análise:</label>
            <select
              value={cohortMonths}
              onChange={(e) => setCohortMonths(parseInt(e.target.value))}
              className="border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={9}>9 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{formatNumber(cohorts.length)}</span> coortes analisadas
          </div>
        </div>
      </div>

      {/* Cohort Retention Heatmap */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary-600" />
          <span>Tabela de Retenção por Cohorte</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cohorte</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Tamanho</th>
                {Array.from({ length: maxMonths + 1 }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cohorts.map((cohort: any, idx: number) => {
                const retentionMap: Record<number, number> = {}
                ;(cohort.retention_by_month || []).forEach((m: any) => {
                  retentionMap[m.month] = m.retention_rate
                })

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {cohort.cohort_month}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {formatNumber(cohort.cohort_size)}
                    </td>
                    {Array.from({ length: maxMonths + 1 }, (_, month) => {
                      const rate = retentionMap[month] || (month === 0 ? 100 : 0)
                      return (
                        <td
                          key={month}
                          className={`px-2 py-3 text-center text-xs font-semibold ${getColor(rate)} ${getTextColor(rate)}`}
                        >
                          {month === 0 ? '100%' : rate > 0 ? `${rate.toFixed(1)}%` : '-'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Average Retention */}
      {Object.keys(avgRetention).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span>Retenção Média por Mês</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(avgRetention)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([month, rate]) => (
                <div key={month} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Mês {month}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof rate === 'number' ? `${rate.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

