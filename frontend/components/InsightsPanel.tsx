'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Store, Package, Clock, Sparkles } from 'lucide-react'

interface InsightsPanelProps {
  dateRange: {
    start: string
    end: string
  }
}

interface Insight {
  type: 'positive' | 'warning' | 'info'
  category: string
  title: string
  description: string
  question?: string
  change?: number
  data?: any
}

export default function InsightsPanel({ dateRange }: InsightsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['insights', dateRange.start, dateRange.end],
    queryFn: () => api.getInsights({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <span>Insights Automáticos</span>
        </h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const insights: Insight[] = data?.insights || []

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <TrendingUp className="w-5 h-5 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    if (category.includes('loja')) return <Store className="w-4 h-4" />
    if (category.includes('produto')) return <Package className="w-4 h-4" />
    if (category.includes('tempo')) return <Clock className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const groupedInsights = insights.reduce((acc: any, insight: Insight) => {
    const category = insight.category.split('_')[0]
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(insight)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <span>Insights Automáticos</span>
        </h3>
        <span className="text-sm text-gray-500">
          {insights.length} insight{insights.length !== 1 ? 's' : ''} encontrado{insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum insight encontrado para o período selecionado.</p>
          <p className="text-sm mt-2">Os insights são gerados automaticamente baseados em padrões e anomalias nos dados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInsights).map(([category, categoryInsights]: [string, any]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {category === 'loja' ? 'Análise de Lojas' : category === 'produto' ? 'Análise de Produtos' : 'Outros'}
              </h4>
              <div className="space-y-3">
                {categoryInsights.map((insight: Insight, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${getBgColor(insight.type)} transition-shadow hover:shadow-md`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {insight.question && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-blue-600 italic">❓ {insight.question}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-sm font-semibold text-gray-900">{insight.title}</h5>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {getCategoryIcon(insight.category)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        {insight.change !== undefined && (
                          <div className="flex items-center space-x-2 text-xs">
                            {insight.change > 0 ? (
                              <span className="text-green-600 font-medium flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +{insight.change.toFixed(1)}%
                              </span>
                            ) : insight.change < 0 ? (
                              <span className="text-red-600 font-medium flex items-center">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                {insight.change.toFixed(1)}%
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

