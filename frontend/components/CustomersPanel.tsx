'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, CustomerData } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Users, ShoppingBag, DollarSign, Calendar, Clock, Package, AlertCircle, Filter, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface CustomersPanelProps {
  dateRange: {
    start: string
    end: string
  }
  selectedChannelId?: number | null
}

type SortField = 'customer_name' | 'orders_in_period' | 'spent_in_period' | 'favorite_day_of_week' | 'favorite_hour' | 'favorite_product' | 'days_since_last_order'
type SortDirection = 'asc' | 'desc' | null

const DAYS_OF_WEEK = [
  { value: '', label: 'Todos os dias' },
  { value: 'Domingo', label: 'Domingo' },
  { value: 'Segunda', label: 'Segunda' },
  { value: 'Terça', label: 'Terça' },
  { value: 'Quarta', label: 'Quarta' },
  { value: 'Quinta', label: 'Quinta' },
  { value: 'Sexta', label: 'Sexta' },
  { value: 'Sábado', label: 'Sábado' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, '0') + ':00',
  label: `${i.toString().padStart(2, '0')}:00`,
}))

export default function CustomersPanel({ dateRange, selectedChannelId }: CustomersPanelProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filterProduct, setFilterProduct] = useState<string>('')
  const [filterDay, setFilterDay] = useState<string>('')
  const [filterHour, setFilterHour] = useState<string>('')
  const [filterChurnOnly, setFilterChurnOnly] = useState<boolean>(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', dateRange.start, dateRange.end, selectedChannelId],
    queryFn: () => api.getCustomers({
      start_date: dateRange.start,
      end_date: dateRange.end,
      channel_ids: selectedChannelId !== null && selectedChannelId !== undefined ? [selectedChannelId] : undefined,
    }),
  })

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

  // Normalizar acentos para ordenação
  const normalizeString = (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }

  // Ordenação de dias da semana (ordem correta)
  const dayOrder: Record<string, number> = {
    'Domingo': 0,
    'Segunda': 1,
    'Terça': 2,
    'Quarta': 3,
    'Quinta': 4,
    'Sexta': 5,
    'Sábado': 6
  }

  // Filtrar e ordenar dados
  const filteredAndSortedCustomers = useMemo(() => {
    if (!data?.customers) return []

    let filtered = [...data.customers]

    // Aplicar filtros
    if (filterProduct) {
      filtered = filtered.filter(c => 
        c.favorite_product.toLowerCase().includes(filterProduct.toLowerCase())
      )
    }

    if (filterDay) {
      filtered = filtered.filter(c => c.favorite_day_of_week === filterDay)
    }

    if (filterHour) {
      filtered = filtered.filter(c => c.favorite_hour === filterHour)
    }

    if (filterChurnOnly) {
      filtered = filtered.filter(c => c.is_churn_risk)
    }

    // Aplicar ordenação
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any = a[sortField]
        let bVal: any = b[sortField]

        // Tratamento especial para alguns campos
        if (sortField === 'customer_name') {
          aVal = normalizeString(aVal || '')
          bVal = normalizeString(bVal || '')
        } else if (sortField === 'favorite_product') {
          // Normalizar acentos para produtos
          aVal = normalizeString(aVal || '')
          bVal = normalizeString(bVal || '')
        } else if (sortField === 'favorite_day_of_week') {
          // Ordenar por ordem da semana (não alfabética)
          const aOrder = dayOrder[aVal] ?? 99
          const bOrder = dayOrder[bVal] ?? 99
          const comparison = aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0
          return sortDirection === 'asc' ? comparison : -comparison
        }

        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data?.customers, filterProduct, filterDay, filterHour, filterChurnOnly, sortField, sortDirection])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary-600" />
          <span>Análise de Clientes</span>
        </h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const customers: CustomerData[] = data?.customers || []
  const churnRiskCustomers = customers.filter(c => c.is_churn_risk)
  const filteredAndSortedCustomersList = filteredAndSortedCustomers || []

  const activeFilters = filterProduct || filterDay || filterHour || filterChurnOnly

  return (
    <div className="space-y-6">
      {/* Alerta de Churn */}
      {churnRiskCustomers.length > 0 && !filterChurnOnly && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                Clientes em Risco de Churn
              </h4>
              <p className="text-sm text-yellow-800 mb-2">
                {churnRiskCustomers.length} cliente{churnRiskCustomers.length !== 1 ? 's' : ''} com mais de 5 pedidos não realizou{churnRiskCustomers.length !== 1 ? 'ram' : ''} novas compras há mais de 30 dias.
              </p>
              <p className="text-xs text-yellow-700">
                Considere criar campanhas de reativação para estes clientes valiosos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-primary-600" />
            <span>Filtros</span>
          </h4>
          {activeFilters && (
            <button
              onClick={() => {
                setFilterProduct('')
                setFilterDay('')
                setFilterHour('')
                setFilterChurnOnly(false)
              }}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Produto Favorito
            </label>
            <input
              type="text"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Dia Preferido
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hora Preferida
            </label>
            <select
              value={filterHour}
              onChange={(e) => setFilterHour(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">Todas as horas</option>
              {HOURS.map(hour => (
                <option key={hour.value} value={hour.value}>{hour.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filtro de Churn
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterChurnOnly}
                onChange={(e) => setFilterChurnOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium">Apenas clientes em risco de churn</span>
                <span className="text-xs text-gray-500">Clientes com 5+ pedidos que não compram há 30+ dias</span>
              </div>
            </label>
          </div>
        </div>
        {activeFilters && (
          <div className="mt-3 text-xs text-gray-600">
            Mostrando {filteredAndSortedCustomersList.length} de {customers.length} cliente{customers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary-600" />
            <span>Análise de Clientes</span>
          </h3>
          <span className="text-sm text-gray-500">
            {filteredAndSortedCustomersList.length} de {customers.length} cliente{(filteredAndSortedCustomersList.length !== 1 || customers.length !== 1) ? 's' : ''}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum cliente encontrado para o período selecionado.</p>
            <p className="text-sm mt-2">Tente ajustar as datas de filtro.</p>
          </div>
        ) : filteredAndSortedCustomersList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum cliente corresponde aos filtros selecionados.</p>
            <p className="text-sm mt-2">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('customer_name')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <span>Cliente</span>
                      <span className="flex-shrink-0">
                        {sortField === 'customer_name' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('orders_in_period')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Pedidos</span>
                      <span className="flex-shrink-0">
                        {sortField === 'orders_in_period' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('spent_in_period')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Valor Gasto</span>
                      <span className="flex-shrink-0">
                        {sortField === 'spent_in_period' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('favorite_product')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <Package className="w-3 h-3" />
                      <span>Produto Favorito</span>
                      <span className="flex-shrink-0">
                        {sortField === 'favorite_product' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('favorite_day_of_week')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Dia Preferido</span>
                      <span className="flex-shrink-0">
                        {sortField === 'favorite_day_of_week' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('favorite_hour')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Hora Preferida</span>
                      <span className="flex-shrink-0">
                        {sortField === 'favorite_hour' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('days_since_last_order')}
                      className="flex items-center space-x-2 hover:text-gray-900 transition-colors w-full text-left"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Dias desde último pedido</span>
                      <span className="flex-shrink-0">
                        {sortField === 'days_since_last_order' ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <span>Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCustomersList.map((customer) => (
                  <tr
                    key={customer.customer_id}
                    className={`hover:bg-gray-50 transition-colors ${
                      customer.is_churn_risk ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customer_name || 'Cliente sem nome'}
                        </div>
                        {customer.email && (
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        )}
                        {customer.phone_number && (
                          <div className="text-xs text-gray-500">{customer.phone_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {formatNumber(customer.orders_in_period)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.total_orders} total
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(customer.spent_in_period)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(customer.total_spent)} total
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {customer.favorite_product || 'N/A'}
                        </div>
                        {customer.favorite_product_quantity > 0 && (
                          <div className="text-xs text-gray-500">
                            {formatNumber(customer.favorite_product_quantity)} unidades
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.favorite_day_of_week}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.favorite_hour}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        {customer.days_since_last_order !== null && customer.days_since_last_order !== undefined ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(customer.days_since_last_order)} {customer.days_since_last_order === 1 ? 'dia' : 'dias'}
                            </div>
                            {customer.last_order_date && (
                              <div className="text-xs text-gray-500">
                                {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {customer.is_churn_risk ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Risco de Churn
                        </span>
                      ) : customer.days_since_last_order !== null && customer.days_since_last_order !== undefined ? (
                        <span className="text-xs">
                          {customer.days_since_last_order <= 7 ? (
                            <span className="text-green-600 font-medium">Ativo</span>
                          ) : customer.days_since_last_order <= 30 ? (
                            <span className="text-blue-600 font-medium">Regular</span>
                          ) : (
                            <span className="text-gray-600">Inativo</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

