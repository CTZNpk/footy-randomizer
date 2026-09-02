'use client'

import { SortState } from '@/lib/sort'

export default function SortButton<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  className?: string
}) {
  const active = sort.key === sortKey

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 hover:text-chalk ${active ? 'text-chalk' : ''} ${className ?? ''}`}
    >
      {label}
      <span className={`text-[9px] ${active ? '' : 'opacity-0'}`}>
        {sort.direction === 'asc' ? '▲' : '▼'}
      </span>
    </button>
  )
}
