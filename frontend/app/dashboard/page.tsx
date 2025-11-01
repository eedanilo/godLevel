'use client'

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import RevenueCard from '@/components/RevenueCard'
import TopProductsChart from '@/components/TopProductsChart'
import PeakHoursChart from '@/components/PeakHoursChart'
import StorePerformanceTable from '@/components/StorePerformanceTable'
import ChannelComparisonChart from '@/components/ChannelComparisonChart'
import DailyTrendsChart from '@/components/DailyTrendsChart'
import InsightsPanel from '@/components/InsightsPanel'
import CustomersPanel from '@/components/CustomersPanel'
import Tooltip from '@/components/Tooltip'
import { Calendar, TrendingUp, Package, Store, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'overview'
  
  // Data padrão: Maio 2025 (onde estão os dados do banco)
  const [dateRange, setDateRange] = useState({
    start: '2025-05-01',
    end: '2025-05-31',
  })

  // Estado para canal selecionado (null = todos, number = canal específico)
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)

  // Buscar lista de canais disponíveis
  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.getChannels(),
  })

  // Queries - passar start_date e end_date explicitamente
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue', dateRange.start, dateRange.end, selectedChannelId],
    queryFn: () => api.getRevenue({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannelId !== null ? [selectedChannelId] : undefined,
    }),
  })

  const [topProductsOrderBy, setTopProductsOrderBy] = useState<'quantity' | 'revenue'>('quantity')
  
  const handleTopProductsOrderByChange = (orderBy: 'quantity' | 'revenue') => {
    console.log('[Dashboard] Changing orderBy from', topProductsOrderBy, 'to', orderBy)
    setTopProductsOrderBy(orderBy)
  }
  
  const { data: topProducts, isLoading: productsLoading, refetch: refetchTopProducts } = useQuery({
    queryKey: ['top-products', dateRange.start, dateRange.end, topProductsOrderBy, selectedChannelId],
    queryFn: async () => {
      console.log('[Dashboard] Fetching top products with order_by:', topProductsOrderBy, 'queryKey includes:', topProductsOrderBy)
      const result = await api.getTopProducts({ 
        limit: 10,
        start_date: dateRange.start,
        end_date: dateRange.end,
        order_by: topProductsOrderBy,
        channel_ids: selectedChannelId !== null ? [selectedChannelId] : undefined,
      })
      console.log('[Dashboard] Received top products count:', result?.products?.length)
      if (result?.products && result.products.length > 0) {
        console.log('[Dashboard] First product:', result.products[0].product_name, 'revenue:', result.products[0].total_revenue, 'quantity:', result.products[0].total_quantity)
        console.log('[Dashboard] Second product:', result.products[1]?.product_name, 'revenue:', result.products[1]?.total_revenue, 'quantity:', result.products[1]?.total_quantity)
      }
      return result
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0, // Don't cache (gcTime replaces cacheTime in React Query v5)
  })
  
  // Refetch when orderBy changes
  useEffect(() => {
    console.log('[Dashboard] topProductsOrderBy changed to:', topProductsOrderBy)
    refetchTopProducts()
  }, [topProductsOrderBy, refetchTopProducts])

  const { data: peakHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['peak-hours', dateRange.start, dateRange.end, selectedChannelId],
    queryFn: () => api.getPeakHours({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannelId !== null ? [selectedChannelId] : undefined,
    }),
  })

  // Estado para lojas selecionadas (máximo 5)
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])

  // Buscar lista de lojas disponíveis
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores(),
  })

  const { data: storePerformance, isLoading: storesLoading } = useQuery({
    queryKey: ['store-performance', dateRange.start, dateRange.end],
    queryFn: () => api.getStorePerformance({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  // Filtrar dados de lojas baseado na seleção
  const filteredStorePerformance = storePerformance?.stores
    ? storePerformance.stores.filter(store => 
        selectedStoreIds.length === 0 || selectedStoreIds.includes(store.id)
      )
    : []

  const handleStoreToggle = (storeId: number) => {
    setSelectedStoreIds(prev => {
      if (prev.includes(storeId)) {
        // Remover se já estiver selecionado
        return prev.filter(id => id !== storeId)
      } else {
        // Adicionar se ainda não tiver 5 selecionadas
        if (prev.length < 5) {
          return [...prev, storeId]
        }
        return prev
      }
    })
  }

  const clearStoreSelection = () => {
    setSelectedStoreIds([])
  }

  const { data: channelComparison, isLoading: channelsLoading } = useQuery({
    queryKey: ['channel-comparison', dateRange.start, dateRange.end],
    queryFn: () => api.getChannelComparison({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  const { data: dailyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['daily-trends', dateRange.start, dateRange.end, selectedChannelId],
    queryFn: () => api.getDailyTrends({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannelId !== null ? [selectedChannelId] : undefined,
    }),
  })

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Tooltip 
                content="Painel principal de análise de vendas. Visualize métricas gerais, produtos mais vendidos, horários de pico e tendências diárias. Use os filtros de data para analisar períodos específicos."
                icon={true}
                position="bottom"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Tooltip 
                  content="Selecione o período de análise. As métricas e gráficos serão atualizados automaticamente para o intervalo selecionado."
                  icon={true}
                  position="bottom"
                />
                <Calendar className="w-5 h-5 text-gray-500" />
                <Tooltip 
                  content="Data inicial do período de análise"
                  icon={false}
                  position="top"
                >
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="border rounded px-3 py-1 text-sm text-gray-900 bg-white cursor-pointer"
                  />
                </Tooltip>
                <span className="text-gray-500">até</span>
                <Tooltip 
                  content="Data final do período de análise"
                  icon={false}
                  position="top"
                >
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="border rounded px-3 py-1 text-sm text-gray-900 bg-white cursor-pointer"
                  />
                </Tooltip>
              </div>
              
              {/* Filtro de Canais */}
              <div className="flex items-center space-x-2">
                <Tooltip 
                  content="Selecione o canal de venda para filtrar os dados. Escolha 'Todos' para ver dados de todos os canais."
                  icon={true}
                  position="bottom"
                />
                <label className="text-sm font-medium text-gray-700">Canal:</label>
                <select
                  value={selectedChannelId !== null ? selectedChannelId.toString() : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setSelectedChannelId(null) // Todos
                    } else {
                      setSelectedChannelId(parseInt(value))
                    }
                  }}
                  className="border rounded px-3 py-1.5 text-sm text-gray-900 bg-white min-w-[200px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os Canais</option>
                  {channelsData?.channels?.map((channel) => (
                    <option key={channel.id} value={channel.id.toString()}>
                      {channel.name} {channel.type ? `(${channel.type})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        {view === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <RevenueCard
                title="Faturamento Total"
                value={revenue?.total_revenue || 0}
                isLoading={revenueLoading}
                icon={<TrendingUp className="w-6 h-6" />}
                tooltip="Soma total do valor líquido de todas as vendas completadas no período selecionado. Inclui pedidos confirmados e entregues."
              />
              <RevenueCard
                title="Pedidos"
                value={revenue?.total_orders || 0}
                isLoading={revenueLoading}
                icon={<Package className="w-6 h-6" />}
                format="number"
                tooltip="Número total de pedidos completados no período selecionado. Apenas vendas com status 'COMPLETED' são contabilizadas."
              />
              <RevenueCard
                title="Ticket Médio"
                value={revenue?.avg_ticket || 0}
                isLoading={revenueLoading}
                icon={<Store className="w-6 h-6" />}
                tooltip="Valor médio por pedido. Calculado dividindo o faturamento total pelo número de pedidos. Representa quanto em média cada cliente gasta por compra."
              />
              <RevenueCard
                title="Descontos"
                value={revenue?.total_discounts || 0}
                isLoading={revenueLoading}
                icon={<Clock className="w-6 h-6" />}
                tooltip="Soma total de descontos aplicados em todas as vendas do período. Inclui cupons, promoções e descontos manuais."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DailyTrendsChart data={dailyTrends?.trends || []} isLoading={trendsLoading} />
              <PeakHoursChart data={peakHours?.hours || []} isLoading={hoursLoading} />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <TopProductsChart 
                data={topProducts?.products || []} 
                isLoading={productsLoading}
                orderBy={topProductsOrderBy}
                onOrderByChange={handleTopProductsOrderByChange}
              />
            </div>
          </>
        )}

        {view === 'products' && (
          <div className="grid grid-cols-1 gap-6">
            <TopProductsChart 
              data={topProducts?.products || []} 
              isLoading={productsLoading}
              orderBy={topProductsOrderBy}
              onOrderByChange={handleTopProductsOrderByChange}
            />
          </div>
        )}

        {view === 'stores' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Seletor de Lojas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">Comparar Lojas</h3>
                  <Tooltip 
                    content="Selecione até 5 lojas para comparar. Se nenhuma loja for selecionada, todas as lojas serão exibidas."
                    icon={true}
                    position="top"
                  />
                </div>
                {selectedStoreIds.length > 0 && (
                  <button
                    onClick={clearStoreSelection}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Limpar Seleção
                  </button>
                )}
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {selectedStoreIds.length === 0 
                    ? "Nenhuma loja selecionada (mostrando todas)" 
                    : `${selectedStoreIds.length} loja(s) selecionada(s) de 5`
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {storesData?.stores?.map((store) => {
                    const isSelected = selectedStoreIds.includes(store.id)
                    const canSelect = isSelected || selectedStoreIds.length < 5
                    return (
                      <button
                        key={store.id}
                        onClick={() => handleStoreToggle(store.id)}
                        disabled={!canSelect}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : canSelect
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!canSelect ? 'Máximo de 5 lojas selecionadas' : isSelected ? 'Clique para remover' : 'Clique para adicionar'}
                      >
                        {store.name} {store.city ? `(${store.city}, ${store.state})` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <StorePerformanceTable 
              data={filteredStorePerformance} 
              isLoading={storesLoading} 
            />
          </div>
        )}

        {view === 'channels' && (
          <div className="grid grid-cols-1 gap-6">
            <ChannelComparisonChart data={channelComparison?.channels || []} isLoading={channelsLoading} />
          </div>
        )}

        {view === 'insights' && (
          <div className="grid grid-cols-1 gap-6">
            <InsightsPanel dateRange={dateRange} />
          </div>
        )}

        {view === 'customers' && (
          <div className="grid grid-cols-1 gap-6">
            <CustomersPanel dateRange={dateRange} />
          </div>
        )}
      </main>
    </div>
  )
}

