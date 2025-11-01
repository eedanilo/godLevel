'use client'

import { useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'

interface QueryBuilderProps {
  query: any
  onChange: (query: any) => void
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

export default function QueryBuilder({ query, onChange }: QueryBuilderProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Query Builder</h2>

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
    </div>
  )
}

