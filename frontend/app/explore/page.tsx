'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import QueryBuilder from '@/components/QueryBuilder'
import { Play, Download, BarChart3, Info } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function ExplorePage() {
  const [query, setQuery] = useState<any>({
    dimensions: [],
    metrics: [],
    filters: [],
    time_range: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    },
    group_by: [],
    order_by: [],
    limit: 100,
  })

  const [queryResult, setQueryResult] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const executeQuery = async () => {
    // Validação básica
    if ((!query.metrics || query.metrics.length === 0) && 
        (!query.dimensions || query.dimensions.length === 0)) {
      alert('Por favor, adicione pelo menos uma métrica ou dimensão antes de executar a query.')
      return
    }

    setIsExecuting(true)
    try {
      const result = await api.query(query)
      setQueryResult(result)
    } catch (error: any) {
      alert(`Erro ao executar query: ${error.message}`)
      console.error('Query error:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const exportToCSV = () => {
    if (!queryResult?.data) return

    const headers = Object.keys(queryResult.data[0] || {})
    const csvContent = [
      headers.join(','),
      ...queryResult.data.map((row: any) =>
        headers.map((header) => JSON.stringify(row[header] || '')).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Explorar Dados</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={executeQuery}
                disabled={isExecuting}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>Executar Query</span>
              </button>
              {queryResult && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Builder */}
          <div className="lg:col-span-1">
            <QueryBuilder query={query} onChange={setQuery} />
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Resultados</span>
              </h2>

              {isExecuting && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Executando query...</p>
                </div>
              )}

              {!isExecuting && !queryResult && (
                <div className="text-center py-12">
                  <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Configure sua query</p>
                  <p className="text-sm text-gray-600 mb-6">Selecione pelo menos uma métrica ou dimensão para visualizar os dados</p>
                  <div className="text-left max-w-md mx-auto bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">💡 Como começar:</p>
                    <ul className="text-xs text-blue-800 space-y-2 mb-4">
                      <li>• Adicione <strong className="text-blue-900">cálculos e agregações</strong> para ver somas, médias, contagens</li>
                      <li>• Adicione <strong className="text-blue-900">campos para agrupar</strong> para organizar os dados</li>
                      <li>• Use <strong className="text-blue-900">filtros</strong> para refinar os resultados</li>
                      <li>• Defina um <strong className="text-blue-900">período</strong> para filtrar por datas</li>
                    </ul>
                    <div className="border-t border-blue-200 pt-3 mt-3">
                      <p className="text-xs font-medium text-blue-900 mb-2">Exemplo rápido:</p>
                      <button
                        onClick={() => {
                          setQuery({
                            dimensions: [],
                            metrics: [{ field: 'total_amount', aggregation: 'sum', alias: 'total_revenue' }],
                            filters: [],
                            time_range: { start: '2025-05-01', end: '2025-05-31' },
                            group_by: [],
                            order_by: [],
                            limit: 100,
                          })
                        }}
                        className="text-xs text-blue-700 hover:text-blue-900 underline"
                      >
                        Carregar exemplo: Faturamento total em maio 2025
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isExecuting && queryResult && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700 font-medium">
                      {queryResult.count || queryResult.data?.length || 0} resultado(s) encontrado(s)
                    </div>
                    {queryResult.data && queryResult.data.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Mostrando até 100 primeiros resultados
                      </div>
                    )}
                  </div>
                  {queryResult.data && queryResult.data.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(queryResult.data[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200"
                              >
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {queryResult.data.slice(0, 100).map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              {Object.keys(queryResult.data[0] || {}).map((key) => (
                                <td
                                  key={key}
                                  className="px-4 py-3 text-sm text-gray-900"
                                >
                                  {row[key] !== null && row[key] !== undefined
                                    ? typeof row[key] === 'number'
                                      ? row[key].toLocaleString('pt-BR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })
                                      : String(row[key])
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      <p>Nenhum resultado encontrado para esta query.</p>
                      <p className="text-xs mt-2">Tente ajustar os filtros ou o período.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

