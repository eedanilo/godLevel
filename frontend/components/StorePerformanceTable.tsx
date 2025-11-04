'use client'

import { useState } from 'react'
import { formatCurrency, formatNumber, formatTime } from '@/lib/utils'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import TooltipComponent from './Tooltip'

interface StorePerformance {
  id: number
  store_name: string
  city: string
  state: string
  total_orders: number
  total_revenue: number
  avg_ticket: number
  avg_production_time: number
  avg_delivery_time: number
}

interface StorePerformanceTableProps {
  data: StorePerformance[]
  isLoading?: boolean
}

type SortField = 'store_name' | 'city' | 'total_orders' | 'total_revenue' | 'avg_ticket' | 'avg_production_time' | 'avg_delivery_time'
type SortDirection = 'asc' | 'desc' | null

export default function StorePerformanceTable({ data, isLoading }: StorePerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data]
  if (sortField && sortDirection) {
    sortedData.sort((a, b) => {
      let aVal: any
      let bVal: any
      
      if (sortField === 'city') {
        // Para cidade, ordenar por cidade, estado
        aVal = `${a.city}, ${a.state}`.toLowerCase()
        bVal = `${b.city}, ${b.state}`.toLowerCase()
      } else {
        aVal = a[sortField]
        bVal = b[sortField]
      }
      
      // Tratar valores nulos/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      // Comparação para strings e números
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pt-BR', { sensitivity: 'base' })
        return sortDirection === 'asc' ? comparison : -comparison
      } else {
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })
  }
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Loja</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Loja</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum dado encontrado para o período selecionado.</p>
          <p className="text-sm mt-2">Tente ajustar as datas de filtro.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance por Loja</h3>
        <TooltipComponent 
          content="Métricas de desempenho de cada loja no período selecionado. Inclui total de pedidos, receita total, ticket médio, tempo médio de produção e tempo médio de entrega. Use os botões para ordenar por qualquer métrica."
          icon={true}
          position="top"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('store_name')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Loja</span>
                    <TooltipComponent 
                      content="Nome da loja. Clique para ordenar por nome."
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'store_name' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('city')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Cidade</span>
                    <TooltipComponent 
                      content="Cidade e estado da loja. Clique para ordenar por localização."
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'city' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('total_orders')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Pedidos</span>
                    <TooltipComponent 
                      content="Número total de pedidos completados nesta loja no período selecionado"
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'total_orders' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('total_revenue')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Faturamento</span>
                    <TooltipComponent 
                      content="Soma total do valor líquido de todas as vendas desta loja no período selecionado"
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'total_revenue' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avg_ticket')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Ticket Médio</span>
                    <TooltipComponent 
                      content="Valor médio por pedido nesta loja. Calculado dividindo a receita total pelo número de pedidos"
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'avg_ticket' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avg_production_time')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Tempo Preparo</span>
                    <TooltipComponent 
                      content="Tempo médio que leva para preparar os pedidos nesta loja, do início do preparo até estar pronto para entrega"
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'avg_production_time' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avg_delivery_time')}
                  className="flex items-center space-x-2 hover:text-gray-700 transition-colors w-full text-left group"
                >
                  <span className="flex items-center space-x-1">
                    <span>Tempo Entrega</span>
                    <TooltipComponent 
                      content="Tempo médio de entrega dos pedidos desta loja, do momento em que sai para entrega até chegar ao cliente"
                      icon={true}
                      position="top"
                    />
                  </span>
                  <span className="flex-shrink-0">
                    {sortField === 'avg_delivery_time' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((store) => (
              <tr key={store.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {store.store_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {store.city}, {store.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(store.total_orders)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(store.total_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(store.avg_ticket)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {store.avg_production_time ? formatTime(store.avg_production_time) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {store.avg_delivery_time ? formatTime(store.avg_delivery_time) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

