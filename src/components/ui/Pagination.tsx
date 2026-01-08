import React from 'react'
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

  const getVisiblePages = () => {
    const delta = 2
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
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={cn(
      'flex flex-col items-center gap-4 px-4 py-3 bg-white border-t border-slate-200',
      className
    )}>
      {/* Navegacao - centralizada */}
      <div className="flex items-center gap-1">
        {/* Primeira pagina */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            page === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Primeira pagina"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Pagina anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            page === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Pagina anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numeros das paginas */}
        <div className="flex items-center gap-1 mx-2">
          {visiblePages.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="px-2 text-slate-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(pageNum as number)}
                  className={cn(
                    'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
                    pageNum === page
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
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
            'p-2 rounded-lg transition-colors',
            page === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Proxima pagina"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ultima pagina */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className={cn(
            'p-2 rounded-lg transition-colors',
            page === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Ultima pagina"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Info e seletor de tamanho */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{start}</span> a{' '}
            <span className="font-medium">{end}</span> de{' '}
            <span className="font-medium">{total}</span> registros
          </p>
        )}

        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Exibir:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
