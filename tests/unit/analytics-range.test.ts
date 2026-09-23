import { describe, expect, it } from 'vitest'

import { addDays, daysBetween, percentChange, resolveRange, todayIn } from '@/lib/admin/range'

describe('analytics date ranges', () => {
  const today = '2026-09-23'

  it('defaults to the last 30 days including today', () => {
    const range = resolveRange({}, today)
    expect(range).toMatchObject({ from: '2026-08-25', to: today, days: 30, preset: 30 })
    expect(range.previous).toEqual({ from: '2026-07-26', to: '2026-08-24' })
  })

  it('accepts presets and rejects unknown ones', () => {
    expect(resolveRange({ range: '7' }, today)).toMatchObject({
      from: '2026-09-17',
      days: 7,
      preset: 7,
    })
    expect(resolveRange({ range: '12' }, today).preset).toBe(30)
  })

  it('clamps custom ranges to today and 400 days', () => {
    const future = resolveRange({ from: '2026-09-01', to: '2026-12-31' }, today)
    expect(future).toMatchObject({ from: '2026-09-01', to: today, preset: null })
    const long = resolveRange({ from: '2020-01-01', to: today }, today)
    expect(long.days).toBe(400)
  })

  it('ignores malformed or reversed custom ranges', () => {
    expect(resolveRange({ from: '2026-09-10', to: '2026-09-01' }, today).preset).toBe(30)
    expect(resolveRange({ from: 'yesterday', to: today }, today).preset).toBe(30)
    expect(resolveRange({ from: '2026-02-30', to: today }, today).preset).toBe(30)
  })

  it('does calendar arithmetic across months and leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-09-01', '2026-09-30')).toBe(30)
  })

  it('reads today in the reporting time zone', () => {
    // 20:00 UTC is already the next day in India (UTC+05:30).
    expect(todayIn('Asia/Kolkata', new Date('2026-09-23T20:00:00Z'))).toBe('2026-09-24')
    expect(todayIn('Not/AZone', new Date('2026-09-23T20:00:00Z'))).toBe('2026-09-23')
  })

  it('computes relative change only when there is a base', () => {
    expect(percentChange(150, 100)).toBeCloseTo(0.5)
    expect(percentChange(5, 0)).toBeNull()
  })
})
