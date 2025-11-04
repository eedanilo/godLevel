'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, Store, Product, Channel } from '@/lib/api'
import QueryBuilder from '@/components/QueryBuilder'
// import DetailedAnalysisPanel from '@/components/DetailedAnalysisPanel'
import { Play, Download, BarChart3, Info, Store as StoreIcon, Package, Radio, Search, X } from 'lucide-react'
import { format, subDays } from 'date-fns'

type EntityType = 'store' | 'product' | 'channel' | null
type ViewMode = 'query-builder' | 'detailed-analysis'

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed-analysis')
  const [entityType, setEntityType] = useState<EntityType>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null)
  const [selectedEntityName, setSelectedEntityName] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

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
  
  // Fetch stores, products, channels
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => api.getProducts({ limit: 100, search: searchTerm || undefined }),
    enabled: entityType === 'product',
  })

  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.getChannels(),
  })

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

  const handleEntityTypeChange = (type: EntityType) => {
    setEntityType(type)
    setSelectedEntityId(null)
    setSelectedEntityName('')
    setSearchTerm('')
  }

  const handleEntitySelect = (id: number, name: string) => {
    setSelectedEntityId(id)
    setSelectedEntityName(name)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Explorar Dados</h1>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('detailed-analysis')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'detailed-analysis'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Análise Detalhada
                </button>
                <button
                  onClick={() => setViewMode('query-builder')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'query-builder'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Query Builder
                </button>
              </div>
              
              {viewMode === 'query-builder' && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'detailed-analysis' ? (
          <div className="space-y-6">
            {/* Entity Type Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecione o tipo de análise</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => handleEntityTypeChange('store')}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    entityType === 'store'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <StoreIcon className={`w-6 h-6 ${entityType === 'store' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Lojas</p>
                    <p className="text-sm text-gray-600">Análise por loja</p>
                  </div>
                </button>
                <button
                  onClick={() => handleEntityTypeChange('product')}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    entityType === 'product'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Package className={`w-6 h-6 ${entityType === 'product' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Produtos</p>
                    <p className="text-sm text-gray-600">Análise por produto</p>
                  </div>
                </button>
                <button
                  onClick={() => handleEntityTypeChange('channel')}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    entityType === 'channel'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Radio className={`w-6 h-6 ${entityType === 'channel' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Canais</p>
                    <p className="text-sm text-gray-600">Análise por canal</p>
                  </div>
                </button>
              </div>

              {/* Entity Selection */}
              {entityType && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Buscar ${entityType === 'store' ? 'loja' : entityType === 'product' ? 'produto' : 'canal'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Data inicial:</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="border rounded px-3 py-1 text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Data final:</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="border rounded px-3 py-1 text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Entity List */}
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {(() => {
                      let entities: (Store | Product | Channel)[] = []
                      if (entityType === 'store') {
                        const stores = storesData?.stores || []
                        entities = !searchTerm ? stores : stores.filter(store => 
                          store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          store.city.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      } else if (entityType === 'product') {
                        entities = productsData?.products || []
                      } else if (entityType === 'channel') {
                        const channels = channelsData?.channels || []
                        entities = !searchTerm ? channels : channels.filter(channel => 
                          channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          channel.type.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      }
                      return entities.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {entities.map((entity: Store | Product | Channel) => (
                          <button
                            key={entity.id}
                            onClick={() => handleEntitySelect(entity.id, entity.name)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedEntityId === entity.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                            }`}
                          >
                            <p className="font-medium text-gray-900">{entity.name}</p>
                            {'city' in entity && entity.city && (
                              <p className="text-sm text-gray-600">{entity.city}, {entity.state}</p>
                            )}
                            {'category' in entity && entity.category && (
                              <p className="text-sm text-gray-600">{entity.category}</p>
                            )}
                            {'type' in entity && entity.type && (
                              <p className="text-sm text-gray-600">{entity.type}</p>
                            )}
                          </button>
                        ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Nenhum resultado encontrado</p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Analysis Panel */}
            {selectedEntityId && entityType && (
              <div className="p-4 bg-white rounded-lg shadow">
                <p>Análise detalhada será exibida aqui (componente temporariamente desabilitado)</p>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  )
}

