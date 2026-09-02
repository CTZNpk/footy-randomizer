import { describe, expect, it } from 'vitest'
import { sortRows } from '../sort'

const rows = [
  { name: 'Bea', weight: 5 },
  { name: 'alan', weight: 9 },
  { name: 'Cara', weight: 5 },
]

const values = {
  name: (row: (typeof rows)[number]) => row.name,
  weight: (row: (typeof rows)[number]) => row.weight,
}

describe('sortRows', () => {
  it('sorts numbers descending', () => {
    expect(sortRows(rows, values, { key: 'weight', direction: 'desc' }).map((r) => r.name)).toEqual([
      'alan',
      'Bea',
      'Cara',
    ])
  })

  it('sorts strings case-insensitively', () => {
    expect(sortRows(rows, values, { key: 'name', direction: 'asc' }).map((r) => r.name)).toEqual([
      'alan',
      'Bea',
      'Cara',
    ])
  })

  it('leaves the input untouched', () => {
    sortRows(rows, values, { key: 'name', direction: 'desc' })
    expect(rows.map((r) => r.name)).toEqual(['Bea', 'alan', 'Cara'])
  })
})
