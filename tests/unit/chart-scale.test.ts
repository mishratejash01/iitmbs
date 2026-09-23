import { describe, expect, it } from 'vitest'

import { formatAxisDay, formatValue, niceTicks } from '@/components/admin/charts/scale'

describe('chart scales', () => {
  it('produces clean ticks from zero to a round maximum', () => {
    expect(niceTicks(0)).toEqual([0, 1])
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(95)).toEqual([0, 25, 50, 75, 100])
    expect(niceTicks(1234)).toEqual([0, 500, 1000, 1500])
  })

  it('formats counts, shares and durations', () => {
    expect(formatValue(1234)).toBe('1,234')
    expect(formatValue(123456, 'count', true)).toBe('1.2L')
    expect(formatValue(0.456, 'percent')).toBe('46%')
    expect(formatValue(0.05, 'percent')).toBe('5.0%')
    expect(formatValue(42, 'seconds')).toBe('42s')
    expect(formatValue(125, 'seconds')).toBe('2m 5s')
  })

  it('labels days without shifting across time zones', () => {
    expect(formatAxisDay('2026-09-23')).toMatch(/^23 Sept?$/)
    expect(formatAxisDay('2026-01-01', true)).toContain('2026')
  })
})
