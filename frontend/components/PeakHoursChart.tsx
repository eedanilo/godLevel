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
import { formatCurrency, formatNumber } from '@/lib/utils'
import TooltipComponent from './Tooltip'

interface PeakHour {
  hour: number
  order_count: number
  revenue: number
  avg_ticket: number
}

interface PeakHoursChartProps {
  data: PeakHour[]
  isLoading?: boolean
}

export default function PeakHoursChart({ data, isLoading }: PeakHoursChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Horários de Pico</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.map((hour) => ({
    hora: `${hour.hour.toString().padStart(2, '0')}:00`,
    pedidos: hour.order_count,
    receita: parseFloat(hour.revenue.toString()),
    ticket_medio: parseFloat(hour.avg_ticket.toString()),
  }))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Horários de Pico</h3>
        <TooltipComponent 
          content="Análise de vendas por hora do dia. Mostra a distribuição de pedidos, receita e ticket médio ao longo das 24 horas. Útil para identificar os horários mais movimentados e otimizar operações."
          icon={true}
          position="top"
        />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hora" />
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

