/**
 * Funções utilitárias para formatação
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatTime(seconds: number): string {
  if (!seconds || seconds === 0) return 'N/A'
  
  // Usar apenas parte inteira
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  
  if (remainingSeconds === 0) {
    return `${minutes}min`
  }
  
  return `${minutes}min ${remainingSeconds}s`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatCompactCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0'
  }
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000000) {
    return `R$ ${(value / 1000000000).toFixed(2).replace('.', ',')} bi`
  }
  if (absValue >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(2).replace('.', ',')} mi`
  }
  if (absValue >= 1000) {
    return `R$ ${(value / 1000).toFixed(2).replace('.', ',')} mil`
  }
  
  return formatCurrency(value)
}

