import { ReactNode } from 'react'
import { Package } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        {icon || <Package size={32} className="text-slate-400" />}
      </div>
      <h3 className="text-lg font-medium text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-center max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
