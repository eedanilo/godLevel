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

  // Estado para canais selecionados
  const [selectedChannels, setSelectedChannels] = useState<number[]>([])

  // Buscar lista de canais disponíveis
  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.getChannels(),
  })

  // Queries - passar start_date e end_date explicitamente
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue', dateRange.start, dateRange.end, selectedChannels],
    queryFn: () => api.getRevenue({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannels.length > 0 ? selectedChannels : undefined,
    }),
  })

  const [topProductsOrderBy, setTopProductsOrderBy] = useState<'quantity' | 'revenue'>('quantity')
  
  const handleTopProductsOrderByChange = (orderBy: 'quantity' | 'revenue') => {
    console.log('[Dashboard] Changing orderBy from', topProductsOrderBy, 'to', orderBy)
    setTopProductsOrderBy(orderBy)
  }
  
  const { data: topProducts, isLoading: productsLoading, refetch: refetchTopProducts } = useQuery({
    queryKey: ['top-products', dateRange.start, dateRange.end, topProductsOrderBy, selectedChannels],
    queryFn: async () => {
      console.log('[Dashboard] Fetching top products with order_by:', topProductsOrderBy, 'queryKey includes:', topProductsOrderBy)
      const result = await api.getTopProducts({ 
        limit: 10,
        start_date: dateRange.start,
        end_date: dateRange.end,
        order_by: topProductsOrderBy,
        channel_ids: selectedChannels.length > 0 ? selectedChannels : undefined,
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
    queryKey: ['peak-hours', dateRange.start, dateRange.end, selectedChannels],
    queryFn: () => api.getPeakHours({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannels.length > 0 ? selectedChannels : undefined,
    }),
  })

  const { data: storePerformance, isLoading: storesLoading } = useQuery({
    queryKey: ['store-performance', dateRange.start, dateRange.end],
    queryFn: () => api.getStorePerformance({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  const { data: channelComparison, isLoading: channelsLoading } = useQuery({
    queryKey: ['channel-comparison', dateRange.start, dateRange.end],
    queryFn: () => api.getChannelComparison({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
  })

  const { data: dailyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['daily-trends', dateRange.start, dateRange.end, selectedChannels],
    queryFn: () => api.getDailyTrends({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannels.length > 0 ? selectedChannels : undefined,
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
                  content="Selecione os canais de venda para filtrar os dados. Você pode escolher múltiplos canais ou deixar vazio para ver todos."
                  icon={true}
                  position="bottom"
                />
                <label className="text-sm font-medium text-gray-700">Canais:</label>
                <select
                  multiple
                  value={selectedChannels.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setSelectedChannels(selected)
                  }}
                  className="border rounded px-3 py-1 text-sm text-gray-900 bg-white min-w-[200px] max-h-32 overflow-y-auto"
                  size={Math.min(channelsData?.channels?.length || 1, 5)}
                >
                  <option value="" disabled>Selecione os canais...</option>
                  {channelsData?.channels?.map((channel) => (
                    <option key={channel.id} value={channel.id.toString()}>
                      {channel.name} {channel.type ? `(${channel.type})` : ''}
                    </option>
                  ))}
                </select>
                {selectedChannels.length > 0 && (
                  <button
                    onClick={() => setSelectedChannels([])}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Limpar
                  </button>
                )}
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
            <StorePerformanceTable data={storePerformance?.stores || []} isLoading={storesLoading} />
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

