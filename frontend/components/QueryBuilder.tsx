'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2, BookOpen, Lightbulb, Play } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface QueryBuilderProps {
  query: any
  onChange: (query: any) => void
  onExecute?: () => void
  isExecuting?: boolean
}

const AVAILABLE_FIELDS = [
  { value: 'created_at', label: 'Data/Hora', type: 'timestamp' },
  { value: 'total_amount', label: 'Valor Total', type: 'decimal' },
  { value: 'total_amount_items', label: 'Valor Bruto', type: 'decimal' },
  { value: 'total_discount', label: 'Desconto', type: 'decimal' },
  { value: 'store_id', label: 'Loja ID', type: 'integer' },
  { value: 'channel_id', label: 'Canal ID', type: 'integer' },
  { value: 'customer_id', label: 'Cliente ID', type: 'integer' },
  { value: 'sale_status_desc', label: 'Status', type: 'string' },
]

const AGGREGATIONS = [
  { value: 'sum', label: 'Soma' },
  { value: 'avg', label: 'Média' },
  { value: 'count', label: 'Contagem' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
]

const OPERATORS = [
  { value: 'eq', label: 'Igual a' },
  { value: 'ne', label: 'Diferente de' },
  { value: 'gt', label: 'Maior que' },
  { value: 'gte', label: 'Maior ou igual' },
  { value: 'lt', label: 'Menor que' },
  { value: 'lte', label: 'Menor ou igual' },
  { value: 'in', label: 'Está em' },
  { value: 'like', label: 'Contém' },
]

// Exemplos de queries pré-configuradas
const EXAMPLE_QUERIES = [
  {
    name: 'Receita Total por Dia',
    description: 'Visualize a receita total agrupada por dia',
    query: {
      dimensions: [{ field: 'created_at', alias: 'data' }],
      metrics: [{ field: 'total_amount', aggregation: 'sum', alias: 'receita_total' }],
      filters: [],
      time_range: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      group_by: ['created_at'],
      order_by: [{ field: 'data', direction: 'asc' }],
      limit: 100,
    },
  },
  {
    name: 'Ticket Médio por Loja',
    description: 'Compare o ticket médio de cada loja',
    query: {
      dimensions: [{ field: 'store_id', alias: 'loja_id' }],
      metrics: [
        { field: 'total_amount', aggregation: 'avg', alias: 'ticket_medio' },
        { field: 'total_amount', aggregation: 'sum', alias: 'receita_total' },
        { field: 'total_amount', aggregation: 'count', alias: 'total_pedidos' },
      ],
      filters: [],
      time_range: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      group_by: ['store_id'],
      order_by: [{ field: 'ticket_medio', direction: 'desc' }],
      limit: 100,
    },
  },
  {
    name: 'Pedidos por Canal',
    description: 'Veja quantos pedidos foram feitos em cada canal',
    query: {
      dimensions: [{ field: 'channel_id', alias: 'canal_id' }],
      metrics: [
        { field: 'total_amount', aggregation: 'count', alias: 'total_pedidos' },
        { field: 'total_amount', aggregation: 'sum', alias: 'receita_total' },
      ],
      filters: [],
      time_range: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      group_by: ['channel_id'],
      order_by: [{ field: 'total_pedidos', direction: 'desc' }],
      limit: 100,
    },
  },
  {
    name: 'Receita e Descontos por Dia',
    description: 'Analise receita e descontos aplicados ao longo do tempo',
    query: {
      dimensions: [{ field: 'created_at', alias: 'data' }],
      metrics: [
        { field: 'total_amount', aggregation: 'sum', alias: 'receita_total' },
        { field: 'total_discount', aggregation: 'sum', alias: 'descontos_total' },
        { field: 'total_amount', aggregation: 'count', alias: 'total_pedidos' },
      ],
      filters: [],
      time_range: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      group_by: ['created_at'],
      order_by: [{ field: 'data', direction: 'asc' }],
      limit: 100,
    },
  },
  {
    name: 'Top Clientes por Valor',
    description: 'Identifique os clientes que mais gastaram',
    query: {
      dimensions: [{ field: 'customer_id', alias: 'cliente_id' }],
      metrics: [
        { field: 'total_amount', aggregation: 'sum', alias: 'valor_total_gasto' },
        { field: 'total_amount', aggregation: 'count', alias: 'total_pedidos' },
        { field: 'total_amount', aggregation: 'avg', alias: 'ticket_medio' },
      ],
      filters: [],
      time_range: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      group_by: ['customer_id'],
      order_by: [{ field: 'valor_total_gasto', direction: 'desc' }],
      limit: 50,
    },
  },
]

export default function QueryBuilder({ query, onChange, onExecute, isExecuting }: QueryBuilderProps) {
  const [showExamples, setShowExamples] = useState(true) // Mostrar exemplos por padrão
  
  // Carregar primeiro exemplo se a query estiver vazia
  const hasQuery = query.metrics?.length > 0 || query.dimensions?.length > 0 || query.filters?.length > 0
  
  const loadFirstExample = () => {
    if (!hasQuery && EXAMPLE_QUERIES.length > 0) {
      onChange(EXAMPLE_QUERIES[0].query)
    }
  }
  
  // Carregar exemplo inicial se necessário
  useEffect(() => {
    if (!hasQuery) {
      loadFirstExample()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const addDimension = () => {
    onChange({
      ...query,
      dimensions: [
        ...(query.dimensions || []),
        { field: '', alias: '' },
      ],
    })
  }

  const updateDimension = (index: number, field: string, alias?: string) => {
    const newDimensions = [...(query.dimensions || [])]
    newDimensions[index] = { field, alias: alias || field }
    onChange({ ...query, dimensions: newDimensions })
  }

  const removeDimension = (index: number) => {
    onChange({
      ...query,
      dimensions: (query.dimensions || []).filter((_: any, i: number) => i !== index),
    })
  }

  const addMetric = () => {
    onChange({
      ...query,
      metrics: [
        ...(query.metrics || []),
        { field: '', aggregation: 'sum', alias: '' },
      ],
    })
  }

  const updateMetric = (index: number, updates: any) => {
    const newMetrics = [...query.metrics]
    newMetrics[index] = { ...newMetrics[index], ...updates }
    onChange({ ...query, metrics: newMetrics })
  }

  const removeMetric = (index: number) => {
    onChange({
      ...query,
      metrics: query.metrics.filter((_: any, i: number) => i !== index),
    })
  }

  const addFilter = () => {
    onChange({
      ...query,
      filters: [
        ...query.filters,
        { field: '', operator: 'eq', value: '' },
      ],
    })
  }

  const updateFilter = (index: number, updates: any) => {
    const newFilters = [...query.filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    onChange({ ...query, filters: newFilters })
  }

  const removeFilter = (index: number) => {
    onChange({
      ...query,
      filters: query.filters.filter((_: any, i: number) => i !== index),
    })
  }

  const updateTimeRange = (field: 'start' | 'end', value: string) => {
    onChange({
      ...query,
      time_range: {
        ...query.time_range,
        [field]: value,
      },
    })
  }

  const loadExample = (example: any) => {
    onChange(example.query)
    setShowExamples(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Query Builder</h2>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Exemplos</span>
        </button>
      </div>

      {/* Examples Panel */}
      {showExamples && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Queries de Exemplo</h3>
              <p className="text-xs text-blue-700 mb-3">
                Clique em um exemplo para carregar a query pré-configurada. Você pode editar depois.
              </p>
              <div className="space-y-2">
                {EXAMPLE_QUERIES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadExample(example)}
                    className="w-full text-left bg-white/80 hover:bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{example.name}</p>
                        <p className="text-xs text-gray-600">{example.description}</p>
                      </div>
                      <Plus className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={query.time_range?.start || ''}
            onChange={(e) => updateTimeRange('start', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={query.time_range?.end || ''}
            onChange={(e) => updateTimeRange('end', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
            placeholder="Data final"
          />
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Campos para Agrupar
          </label>
          <button
            onClick={addDimension}
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
        <div className="space-y-2">
          {(query.dimensions || []).map((dim: any, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <select
                value={dim.field}
                onChange={(e) => updateDimension(idx, e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 bg-white"
              >
                <option value="">Selecione um campo</option>
                {AVAILABLE_FIELDS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeDimension(idx)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Cálculos e Agregações
          </label>
          <button
            onClick={addMetric}
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
        <div className="space-y-2">
          {(query.metrics || []).map((metric: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center space-x-2">
                <select
                  value={metric.field}
                  onChange={(e) => updateMetric(idx, { field: e.target.value })}
                  className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                >
                  <option value="">Selecione um campo</option>
                  {AVAILABLE_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={metric.aggregation}
                  onChange={(e) => updateMetric(idx, { aggregation: e.target.value })}
                  className="w-32 border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                >
                  {AGGREGATIONS.map((agg) => (
                    <option key={agg.value} value={agg.value}>
                      {agg.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMetric(idx)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Filtros
          </label>
          <button
            onClick={addFilter}
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
        <div className="space-y-2">
          {(query.filters || []).map((filter: any, idx: number) => (
            <div key={idx} className="space-y-2 p-3 border rounded">
              <div className="flex items-center space-x-2">
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(idx, { field: e.target.value })}
                  className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                >
                  <option value="">Campo</option>
                  {AVAILABLE_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(idx, { operator: e.target.value })}
                  className="w-40 border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeFilter(idx)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(idx, { value: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
                placeholder="Valor"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limite de resultados
        </label>
        <input
          type="number"
          value={query.limit || 100}
          onChange={(e) => onChange({ ...query, limit: parseInt(e.target.value) || 100 })}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
          min="1"
          max="1000"
        />
      </div>

      {/* Execute Button */}
      {onExecute && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onExecute}
            disabled={isExecuting || (!query.metrics?.length && !query.dimensions?.length)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            <Play className="w-5 h-5" />
            <span>{isExecuting ? 'Executando...' : 'Executar Query'}</span>
          </button>
          {(!query.metrics?.length && !query.dimensions?.length) && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Adicione pelo menos uma métrica ou dimensão para executar
            </p>
          )}
        </div>
      )}
    </div>
  )
}

