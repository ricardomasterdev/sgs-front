import React, { useMemo, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  pageSizeOptions?: number[]
  showInfo?: boolean
  className?: string
}

export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  showInfo = true,
  className,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  // Detecta se esta em mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getVisiblePages = useMemo(() => {
    // Em mobile, mostra menos paginas
    const delta = isMobile ? 1 : 2
    const range: (number | string)[] = []
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    if (totalPages <= 1) return [1]

    range.push(1)

    if (left > 2) {
      range.push('...')
    }

    for (let i = left; i <= right; i++) {
      range.push(i)
    }

    if (right < totalPages - 1) {
      range.push('...')
    }

    if (totalPages > 1) {
      range.push(totalPages)
    }

    return range
  }, [page, totalPages, isMobile])

  const visiblePages = getVisiblePages

  return (
    <div className={cn(
      'flex flex-col items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 bg-white border-t border-slate-200',
      className
    )}>
      {/* Navegacao - centralizada */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Primeira pagina - escondido em mobile muito pequeno */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn(
            'hidden xs:flex p-2 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 items-center justify-center rounded-lg transition-colors',
            page === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          title="Primeira pagina"
        >
          <ChevronsLeft className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Pagina anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'p-2 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors',
            page === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          title="Pagina anterior"
        >
          <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Numeros das paginas */}
        <div className="flex items-center gap-0.5 sm:gap-1 mx-1 sm:mx-2">
          {visiblePages.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="px-1 sm:px-2 text-slate-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(pageNum as number)}
                  className={cn(
                    'min-w-[40px] h-10 sm:min-w-[36px] sm:h-9 px-2 sm:px-3 rounded-lg text-sm font-medium transition-colors',
                    pageNum === page
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
                  )}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Proxima pagina */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className={cn(
            'p-2 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors',
            page === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          title="Proxima pagina"
        >
          <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Ultima pagina - escondido em mobile muito pequeno */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className={cn(
            'hidden xs:flex p-2 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 items-center justify-center rounded-lg transition-colors',
            page === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          title="Ultima pagina"
        >
          <ChevronsRight className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Info e seletor de tamanho */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        {/* Info - escondido em mobile */}
        {showInfo && (
          <p className="hidden sm:block text-sm text-slate-600">
            Mostrando <span className="font-medium">{start}</span> a{' '}
            <span className="font-medium">{end}</span> de{' '}
            <span className="font-medium">{total}</span> registros
          </p>
        )}

        {/* Versao compacta para mobile */}
        {showInfo && (
          <p className="sm:hidden text-xs text-slate-500">
            {start}-{end} de {total}
          </p>
        )}

        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-slate-600">Exibir:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="px-2 py-1.5 sm:py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
