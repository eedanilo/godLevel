'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export default function ProductAffinityPanel() {
  const [minSupport, setMinSupport] = useState(0.01)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ['product_affinity', minSupport, limit],
    queryFn: () => api.getProductAffinity({
      min_support: minSupport,
      limit: limit,
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

  const rules = data.rules || []
  const recommendations = data.recommendations || []
  const summary = data.summary || {}

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suporte Mínimo ({(minSupport * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1%</span>
              <span>10%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Limite de Resultados</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value={10}>10 resultados</option>
              <option value={20}>20 resultados</option>
              <option value={50}>50 resultados</option>
              <option value={100}>100 resultados</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{formatNumber(rules.length)}</span> regras encontradas
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span>Recomendações de Ação</span>
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.expected_impact === 'high'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Package className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        rec.type === 'bundle' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.type === 'bundle' ? 'Bundle' : 'Upsell'}
                      </span>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-gray-700">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affinity Rules Table */}
      {rules.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <span>Regras de Afinidade de Produtos</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Produto A</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Produto B</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Vezes Juntos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Suporte</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Confiança A→B</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Lift</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Força</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.product_a}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rule.product_b}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {formatNumber(rule.times_bought_together)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {(rule.support * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {(rule.confidence_a_to_b * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                      {rule.lift.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getStrengthColor(rule.strength)}`}
                      >
                        {rule.strength === 'strong' ? 'Forte' : rule.strength === 'moderate' ? 'Moderada' : 'Fraca'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Análise</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Regras Encontradas</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(summary.rules_found || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Suporte Mínimo</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{(summary.min_support_threshold * 100 || 0).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Período</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{summary.analysis_period || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Regras Fortes</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatNumber(rules.filter((r: any) => r.strength === 'strong').length)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

