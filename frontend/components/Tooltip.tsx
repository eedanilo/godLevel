'use client'

import { useState, ReactNode } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string | ReactNode
  children?: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  icon?: boolean
  className?: string
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  icon = false,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-t-4 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-b-4 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-l-4 border-t-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-r-4 border-t-transparent border-l-transparent border-b-transparent',
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {icon ? (
        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help inline-block" />
      ) : (
        children
      )}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
        >
          <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
            {typeof content === 'string' ? (
              <p className="whitespace-normal">{content}</p>
            ) : (
              content
            )}
          </div>
          <div className={`absolute ${arrowClasses[position]} w-0 h-0`} />
        </div>
      )}
    </div>
  )
}

