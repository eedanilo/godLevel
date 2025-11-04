'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'

interface Store {
  id: number
  name: string
  city: string
  state: string
}

interface StoreSelectorProps {
  stores: Store[]
  selectedStoreIds: number[]
  onStoreToggle: (storeId: number) => void
  onClearSelection: () => void
  maxSelection?: number
}

export default function StoreSelector({
  stores,
  selectedStoreIds,
  onStoreToggle,
  onClearSelection,
  maxSelection = 5,
}: StoreSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filtrar lojas baseado no termo de busca
  const filteredStores = stores.filter(store => {
    if (!searchTerm) return false
    
    const searchLower = searchTerm.toLowerCase()
    const storeName = store.name.toLowerCase()
    const city = store.city?.toLowerCase() || ''
    const state = store.state?.toLowerCase() || ''
    const fullText = `${storeName} ${city} ${state}`.toLowerCase()
    
    return fullText.includes(searchLower) && !selectedStoreIds.includes(store.id)
  })

  // Lojas selecionadas para exibição
  const selectedStores = stores.filter(store => selectedStoreIds.includes(store.id))

  const handleStoreSelect = (storeId: number) => {
    onStoreToggle(storeId)
    setSearchTerm('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowSuggestions(value.length > 0)
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Não fechar se o clique foi em uma sugestão
    if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setTimeout(() => {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < filteredStores.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleStoreSelect(filteredStores[highlightedIndex].id)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSearchTerm('')
      inputRef.current?.blur()
    }
  }

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Comparar Lojas</h3>
        </div>
        {selectedStoreIds.length > 0 && (
          <button
            onClick={onClearSelection}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Limpar Seleção
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {selectedStoreIds.length === 0 
            ? "Nenhuma loja selecionada (mostrando todas)" 
            : `${selectedStoreIds.length} loja(s) selecionada(s) de ${maxSelection}`
          }
        </p>

        {/* Campo de busca com autocomplete */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={selectedStoreIds.length >= maxSelection 
                ? "Máximo de lojas selecionadas" 
                : "Digite o nome da loja para buscar..."
              }
              disabled={selectedStoreIds.length >= maxSelection}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                selectedStoreIds.length >= maxSelection 
                  ? 'bg-gray-50 cursor-not-allowed' 
                  : ''
              }`}
            />
          </div>

          {/* Lista de sugestões */}
          {showSuggestions && filteredStores.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {filteredStores.map((store, index) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleStoreSelect(store.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    index === highlightedIndex ? 'bg-blue-50' : ''
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="font-medium text-gray-900">{store.name}</div>
                  {(store.city || store.state) && (
                    <div className="text-xs text-gray-500">
                      {store.city}, {store.state}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {showSuggestions && searchTerm.length > 0 && filteredStores.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <p className="text-sm text-gray-500 text-center">
                Nenhuma loja encontrada para "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Lojas selecionadas */}
        {selectedStores.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Lojas selecionadas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm"
                >
                  <span className="font-medium">
                    {store.name} {store.city ? `(${store.city}, ${store.state})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStoreToggle(store.id)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    title="Remover loja"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

