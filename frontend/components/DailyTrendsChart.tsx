'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, formatNumber } from '@/lib/utils'
import TooltipComponent from './Tooltip'

interface DailyTrend {
  date: string
  order_count: number
  revenue: number
  avg_ticket: number
  day_of_week: number
}

interface DailyTrendsChartProps {
  data: DailyTrend[]
  isLoading?: boolean
}

export default function DailyTrendsChart({ data, isLoading }: DailyTrendsChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências Diárias</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.map((trend) => {
    try {
      // Tentar parsear a data - pode vir como string ISO ou já formatada
      let dateStr = trend.date
      if (trend.date.includes('T') || trend.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = format(parseISO(trend.date), 'dd/MM', { locale: ptBR })
      }
      return {
        data: dateStr,
        pedidos: trend.order_count,
        receita: parseFloat(trend.revenue.toString()),
        ticket_medio: parseFloat(trend.avg_ticket.toString()),
      }
    } catch (e) {
      return {
        data: trend.date,
        pedidos: trend.order_count,
        receita: parseFloat(trend.revenue.toString()),
        ticket_medio: parseFloat(trend.avg_ticket.toString()),
      }
    }
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tendências Diárias</h3>
        <TooltipComponent 
          content="Evolução das vendas ao longo dos dias no período selecionado. Mostra a variação diária de pedidos, receita e ticket médio. Útil para identificar padrões semanais e tendências."
          icon={true}
          position="top"
        />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (typeof value === 'number') {
                // Pedidos devem ser números, não moeda
                if (name === 'Pedidos') {
                  return formatNumber(value)
                }
                // Receita deve ser moeda
                if (name === 'Receita (R$)') {
                  return formatCurrency(value)
                }
                return value < 1000 ? value : formatCurrency(value)
              }
              return value
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="pedidos" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Pedidos"
          />
          <Line 
            type="monotone" 
            dataKey="receita" 
            stroke="#dc2626" 
            strokeWidth={2}
            name="Receita (R$)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

