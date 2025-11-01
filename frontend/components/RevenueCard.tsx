'use client'

import { formatCurrency, formatNumber, formatCompactCurrency } from '@/lib/utils'
import Tooltip from './Tooltip'

interface RevenueCardProps {
  title: string
  value: number
  isLoading?: boolean
  icon?: React.ReactNode
  format?: 'currency' | 'number'
  tooltip?: string
}

export default function RevenueCard({
  title,
  value,
  isLoading = false,
  icon,
  format: formatType = 'currency',
  tooltip,
}: RevenueCardProps) {
  // Format large numbers in a more readable way
  const formatValue = (val: number) => {
    if (formatType === 'currency') {
      // For very large values, use compact notation
      if (val >= 1000000) {
        return formatCompactCurrency(val)
      }
      return formatCurrency(val)
    }
    return formatNumber(val)
  }

  const formattedValue = formatValue(value)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {tooltip && (
            <Tooltip content={tooltip} icon={true} position="top" />
          )}
        </div>
        {icon && <div className="text-primary-600">{icon}</div>}
      </div>
      {isLoading ? (
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
      ) : (
        <div className="relative">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {formattedValue}
          </p>
          {value >= 1000000 && formatType === 'currency' && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(value)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

