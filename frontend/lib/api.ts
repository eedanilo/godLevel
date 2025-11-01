/**
 * Cliente API para comunicação com o backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Filter {
  field: string
  operator: string
  value: any
}

export interface Dimension {
  field: string
  alias?: string
}

export interface Metric {
  field: string
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  alias?: string
}

export interface QueryRequest {
  dimensions?: Dimension[]
  metrics?: Metric[]
  filters?: Filter[]
  time_range?: {
    start?: string
    end?: string
  }
  group_by?: string[]
  order_by?: Array<{ field: string; direction: 'ASC' | 'DESC' }>
  limit?: number
}

export interface RevenueResponse {
  total_orders: number
  total_revenue: number
  avg_ticket: number
  gross_revenue: number
  total_discounts: number
  total_delivery_fee: number
  total_service_fee: number
}

export interface TopProduct {
  id: number
  product_name: string
  category_name: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

export interface PeakHour {
  hour: number
  order_count: number
  revenue: number
  avg_ticket: number
}

export interface StorePerformance {
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

export interface ChannelComparison {
  id: number
  channel_name: string
  channel_type: string
  total_orders: number
  total_revenue: number
  avg_ticket: number
  total_delivery_fee: number
  avg_delivery_time: number
}

export interface DailyTrend {
  date: string
  order_count: number
  revenue: number
  avg_ticket: number
  day_of_week: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Health check
  async health() {
    return this.fetch('/api/health')
  }

  // Metadata
  async getTables() {
    return this.fetch('/api/meta/tables')
  }

  async getColumns(tableName: string) {
    return this.fetch(`/api/meta/columns/${tableName}`)
  }

  // Query builder
  async query(request: QueryRequest) {
    return this.fetch('/api/query', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Pré-definidas métricas
  async getRevenue(params?: {
    start_date?: string
    end_date?: string
    store_id?: number
    channel_id?: number
    channel_ids?: number[]
  }): Promise<RevenueResponse> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.store_id) queryParams.append('store_id', params.store_id.toString())
    if (params?.channel_id) queryParams.append('channel_id', params.channel_id.toString())
    if (params?.channel_ids && params.channel_ids.length > 0) {
      queryParams.append('channel_ids', params.channel_ids.join(','))
    }

    return this.fetch(`/api/metrics/revenue?${queryParams.toString()}`)
  }

  async getTopProducts(params?: {
    limit?: number
    start_date?: string
    end_date?: string
    order_by?: 'quantity' | 'revenue'
    channel_ids?: number[]
  }): Promise<{ products: TopProduct[] }> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.order_by) {
      queryParams.append('order_by', params.order_by)
    }
    if (params?.channel_ids && params.channel_ids.length > 0) {
      queryParams.append('channel_ids', params.channel_ids.join(','))
    }

    const url = `/api/metrics/top-products?${queryParams.toString()}`
    console.log('[API] Fetching top products:', url, 'order_by:', params?.order_by)
    const result = await this.fetch(url)
    console.log('[API] Top products result count:', result?.products?.length)
    if (result?.products && result.products.length > 0) {
      console.log('[API] First product:', result.products[0].product_name, 'revenue:', result.products[0].total_revenue, 'quantity:', result.products[0].total_quantity)
      console.log('[API] Second product:', result.products[1]?.product_name, 'revenue:', result.products[1]?.total_revenue, 'quantity:', result.products[1]?.total_quantity)
    }
    return result
  }

  async getPeakHours(params?: {
    start_date?: string
    end_date?: string
    channel_ids?: number[]
  }): Promise<{ hours: PeakHour[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.channel_ids && params.channel_ids.length > 0) {
      queryParams.append('channel_ids', params.channel_ids.join(','))
    }

    return this.fetch(`/api/metrics/peak-hours?${queryParams.toString()}`)
  }

  async getStorePerformance(params?: {
    start_date?: string
    end_date?: string
  }): Promise<{ stores: StorePerformance[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/metrics/store-performance?${queryParams.toString()}`)
  }

  async getChannelComparison(params?: {
    start_date?: string
    end_date?: string
  }): Promise<{ channels: ChannelComparison[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/metrics/channel-comparison?${queryParams.toString()}`)
  }

  async getDailyTrends(params?: {
    start_date?: string
    end_date?: string
    channel_ids?: number[]
  }): Promise<{ trends: DailyTrend[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.channel_ids && params.channel_ids.length > 0) {
      queryParams.append('channel_ids', params.channel_ids.join(','))
    }

    return this.fetch(`/api/metrics/daily-trends?${queryParams.toString()}`)
  }

  async getInsights(params?: {
    start_date?: string
    end_date?: string
  }): Promise<{ insights: any[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/metrics/insights?${queryParams.toString()}`)
  }

  async getCustomers(params?: {
    start_date?: string
    end_date?: string
  }): Promise<{ customers: CustomerData[] }> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/metrics/customers?${queryParams.toString()}`)
  }

  async getSalesProfile(params?: {
    start_date?: string
    end_date?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/explore/profile/sales?${queryParams.toString()}`)
  }

  async getCorrelations(params?: {
    start_date?: string
    end_date?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    return this.fetch(`/api/explore/correlations?${queryParams.toString()}`)
  }

  async getCohortRetention(params?: {
    cohort_months?: number
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.cohort_months) queryParams.append('cohort_months', params.cohort_months.toString())

    return this.fetch(`/api/explore/cohort/retention?${queryParams.toString()}`)
  }

  async getAnomalies(params?: {
    days_back?: number
    sensitivity?: number
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.days_back) queryParams.append('days_back', params.days_back.toString())
    if (params?.sensitivity) queryParams.append('sensitivity', params.sensitivity.toString())

    return this.fetch(`/api/explore/anomalies?${queryParams.toString()}`)
  }

  async getProductAffinity(params?: {
    min_support?: number
    limit?: number
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.min_support) queryParams.append('min_support', params.min_support.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    return this.fetch(`/api/explore/affinity/products?${queryParams.toString()}`)
  }

  async getTrendForecast(params?: {
    metric?: string
    days_back?: number
    forecast_days?: number
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.metric) queryParams.append('metric', params.metric)
    if (params?.days_back) queryParams.append('days_back', params.days_back.toString())
    if (params?.forecast_days) queryParams.append('forecast_days', params.forecast_days.toString())

    return this.fetch(`/api/explore/trends/forecast?${queryParams.toString()}`)
  }

  async getChannels(): Promise<{ channels: Channel[] }> {
    return this.fetch('/api/meta/channels')
  }

  async getStores(): Promise<{ stores: Store[] }> {
    return this.fetch('/api/meta/stores')
  }
}

export interface Store {
  id: number
  name: string
  city: string
  state: string
}

export interface Channel {
  id: number
  name: string
  type: string
  description: string
}

export interface CustomerData {
  customer_id: number
  customer_name: string
  email: string
  phone_number: string
  total_orders: number
  total_spent: number
  orders_in_period: number
  spent_in_period: number
  last_order_date: string | null
  days_since_last_order: number | null
  favorite_day_of_week: string
  favorite_hour: string
  favorite_product: string
  favorite_product_quantity: number
  is_churn_risk: boolean
}

export const api = new ApiClient()

