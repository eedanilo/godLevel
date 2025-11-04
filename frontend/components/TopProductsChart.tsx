'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import TooltipComponent from './Tooltip'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { X, TrendingUp, Package, Clock, Store } from 'lucide-react'
import DetailedAnalysisPanel from './DetailedAnalysisPanel'

interface TopProduct {
  id: number
  product_name: string
  category_name: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

interface TopProductsChartProps {
  data: TopProduct[]
  isLoading?: boolean
  onOrderByChange?: (orderBy: 'quantity' | 'revenue') => void
  orderBy?: 'quantity' | 'revenue'
  startDate?: string
  endDate?: string
}

export default function TopProductsChart({ data, isLoading, onOrderByChange, orderBy: externalOrderBy, startDate, endDate }: TopProductsChartProps) {
  const [internalOrderBy, setInternalOrderBy] = useState<'quantity' | 'revenue'>('quantity')
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null)
  const orderBy = externalOrderBy ?? internalOrderBy
  
  // Default dates if not provided
  const defaultStartDate = startDate || '2025-05-01'
  const defaultEndDate = endDate || '2025-05-31'
  
  // Debug: log current state
  console.log('[TopProductsChart] Render - Current orderBy:', orderBy, 'externalOrderBy:', externalOrderBy, 'data length:', data?.length)
  if (data && data.length > 0) {
    console.log('[TopProductsChart] First product - name:', data[0].product_name, 'revenue:', data[0].total_revenue, 'quantity:', data[0].total_quantity)
  }
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos Mais Vendidos</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos Mais Vendidos</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum dado encontrado para o período selecionado.</p>
          <p className="text-sm mt-2">Tente ajustar as datas de filtro.</p>
        </div>
      </div>
    )
  }

  // Map data and ensure it's in the correct order from backend
  // The backend already sorts the data, so we just need to use it as-is
  const chartData = data.map((product) => ({
    id: product.id,
    fullName: product.product_name,
    name: product.product_name.length > 30 
      ? product.product_name.substring(0, 30) + '...'
      : product.product_name,
    quantidade: parseFloat(product.total_quantity.toString()),
    receita: parseFloat(product.total_revenue.toString()),
    pedidos: product.order_count,
  }))
  
  // Handle bar click
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload
      if (payload && payload.id && payload.fullName) {
        setSelectedProduct({ id: payload.id, name: payload.fullName })
      }
    }
  }
  
  // Log first product to verify ordering
  if (chartData.length > 0) {
    console.log('[TopProductsChart] chartData[0] - name:', chartData[0].name, 'revenue:', chartData[0].receita, 'quantity:', chartData[0].quantidade, 'orderBy:', orderBy)
  }

  const handleOrderByChange = (newOrderBy: 'quantity' | 'revenue') => {
    console.log('[TopProductsChart] handleOrderByChange called with:', newOrderBy, 'onOrderByChange exists:', !!onOrderByChange)
    if (onOrderByChange) {
      console.log('[TopProductsChart] Calling onOrderByChange with:', newOrderBy)
      onOrderByChange(newOrderBy)
    } else {
      console.log('[TopProductsChart] Using internal state, setting to:', newOrderBy)
      setInternalOrderBy(newOrderBy)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Top Produtos Mais Vendidos</h3>
            <TooltipComponent 
              content="Os produtos mais vendidos baseados na quantidade total vendida ou receita total no período selecionado. Clique em uma barra para ver detalhes do produto."
              icon={true}
              position="top"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleOrderByChange('quantity')
                }}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  orderBy === 'quantity'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quantidade
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleOrderByChange('revenue')
                }}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  orderBy === 'revenue'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Receita
              </button>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-600">💡 Clique em uma barra do gráfico para ver detalhes do produto</p>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart 
            key={`bar-chart-${orderBy}`}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={150}
              interval={0}
              tick={{ fontSize: 13, fontWeight: 500 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (typeof value === 'number') {
                  // Se for quantidade, mostrar como número sem R$
                  if (name === 'Quantidade Vendida') {
                    return formatNumber(value)
                  }
                  // Se for receita, mostrar como moeda
                  return formatCurrency(value)
                }
                return value
              }}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              verticalAlign="top"
              height={36}
            />
            <Bar 
              dataKey="quantidade" 
              fill="#ef4444" 
              name="Quantidade Vendida"
              cursor="pointer"
              onClick={handleBarClick}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={selectedProduct?.id === entry.id ? '#dc2626' : '#ef4444'}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="receita" 
              fill="#dc2626" 
              name="Receita (R$)"
              cursor="pointer"
              onClick={handleBarClick}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-revenue-${index}`} 
                  fill={selectedProduct?.id === entry.id ? '#991b1b' : '#dc2626'}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product Details Panel */}
      {selectedProduct && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Análise Detalhada: {selectedProduct.name}
            </h3>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Fechar análise"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <DetailedAnalysisPanel
            entityType="product"
            entityId={selectedProduct.id}
            entityName={selectedProduct.name}
            startDate={defaultStartDate}
            endDate={defaultEndDate}
          />
        </div>
      )}
    </div>
  )
}

