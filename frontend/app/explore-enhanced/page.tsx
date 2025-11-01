'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, subDays } from 'date-fns'
import { BarChart3, TrendingUp, AlertCircle, ShoppingBag, Users, Activity, Database } from 'lucide-react'

import dynamic from 'next/dynamic'

const DataProfilingPanel = dynamic(() => import('@/components/explore/DataProfilingPanel'), { ssr: false })
const CorrelationAnalysisPanel = dynamic(() => import('@/components/explore/CorrelationAnalysisPanel'), { ssr: false })
const CohortRetentionPanel = dynamic(() => import('@/components/explore/CohortRetentionPanel'), { ssr: false })
const AnomalyDetectionPanel = dynamic(() => import('@/components/explore/AnomalyDetectionPanel'), { ssr: false })
const ProductAffinityPanel = dynamic(() => import('@/components/explore/ProductAffinityPanel'), { ssr: false })
const TrendForecastPanel = dynamic(() => import('@/components/explore/TrendForecastPanel'), { ssr: false })
const QueryBuilder = dynamic(() => import('@/components/QueryBuilder'), { ssr: false })

type TabType = 'profile' | 'correlations' | 'cohorts' | 'anomalies' | 'affinity' | 'forecast' | 'query'

export default function EnhancedExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfilamento', icon: Database },
    { id: 'correlations' as TabType, label: 'Correlações', icon: BarChart3 },
    { id: 'cohorts' as TabType, label: 'Cohortes', icon: Users },
    { id: 'anomalies' as TabType, label: 'Anomalias', icon: AlertCircle },
    { id: 'affinity' as TabType, label: 'Afinitade Produtos', icon: ShoppingBag },
    { id: 'forecast' as TabType, label: 'Previsões', icon: TrendingUp },
    { id: 'query' as TabType, label: 'Query Builder', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Explorar Dados Avançado</h1>
              <p className="text-sm text-gray-600 mt-1">Análises estatísticas e insights avançados</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">De:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Até:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <DataProfilingPanel dateRange={dateRange} />
          )}

          {activeTab === 'correlations' && (
            <CorrelationAnalysisPanel dateRange={dateRange} />
          )}

          {activeTab === 'cohorts' && (
            <CohortRetentionPanel />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDetectionPanel />
          )}

          {activeTab === 'affinity' && (
            <ProductAffinityPanel />
          )}

          {activeTab === 'forecast' && (
            <TrendForecastPanel dateRange={dateRange} />
          )}

          {activeTab === 'query' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <QueryBuilder
                query={{
                  dimensions: [],
                  metrics: [],
                  filters: [],
                  time_range: dateRange,
                  group_by: [],
                  order_by: [],
                  limit: 100,
                }}
                onChange={() => {}}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

