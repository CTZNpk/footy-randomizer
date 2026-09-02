'use client'

import { useState } from 'react'

export type SortDirection = 'asc' | 'desc'
export type SortState<K extends string> = { key: K; direction: SortDirection }
export type SortValues<T, K extends string> = Record<K, (row: T) => string | number>

export function sortRows<T, K extends string>(
  rows: T[],
  values: SortValues<T, K>,
  { key, direction }: SortState<K>,
): T[] {
  const value = values[key]
  const sign = direction === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    const left = value(a)
    const right = value(b)
    if (typeof left === 'string') return left.localeCompare(right as string) * sign
    return ((left as number) - (right as number)) * sign
  })
}

export function useSort<T, K extends string>(
  rows: T[],
  values: SortValues<T, K>,
  initial: SortState<NoInfer<K>>,
) {
  const [sort, setSort] = useState(initial)

  const toggle = (key: K) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))

  return { rows: sortRows(rows, values, sort), sort, toggle }
}
