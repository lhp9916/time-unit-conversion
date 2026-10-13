import { describe, expect, it } from 'vitest'
import { UNITS, convert, formatValue, parseInput } from './timeUnits.js'

describe('UNITS', () => {
  it('按从大到小排列，最小单位为纳秒', () => {
    expect(UNITS.map((unit) => unit.key)).toEqual([
      'year',
      'month',
      'week',
      'day',
      'hour',
      'minute',
      'second',
      'millisecond',
      'microsecond',
      'nanosecond'
    ])
  })
})

describe('convert', () => {
  it('同单位恒等', () => {
    expect(convert(5, 'second', 'second')).toBe(5)
  })

  it('时/分/秒', () => {
    expect(convert(1, 'hour', 'minute')).toBe(60)
    expect(convert(1, 'hour', 'second')).toBe(3600)
  })

  it('天/周/月/年', () => {
    expect(convert(1, 'day', 'hour')).toBe(24)
    expect(convert(1, 'week', 'day')).toBe(7)
    expect(convert(1, 'month', 'day')).toBe(30)
    expect(convert(1, 'year', 'day')).toBe(365)
  })

  it('毫秒及以下按千进制', () => {
    expect(convert(1, 'second', 'millisecond')).toBe(1000)
    expect(convert(1, 'millisecond', 'microsecond')).toBe(1000)
    expect(convert(1, 'microsecond', 'nanosecond')).toBe(1000)
    expect(convert(1, 'second', 'nanosecond')).toBe(1e9)
  })

  it('往返换算近似无损', () => {
    expect(convert(convert(3.5, 'day', 'nanosecond'), 'nanosecond', 'day')).toBeCloseTo(3.5, 10)
  })

  it('未知单位抛错', () => {
    expect(() => convert(1, 'second', 'picosecond')).toThrowError(/未知单位/)
  })
})

describe('formatValue', () => {
  it('零与常规小数保持原样', () => {
    expect(formatValue(0)).toBe('0')
    expect(formatValue(0.001)).toBe('0.001')
    expect(formatValue(20)).toBe('20')
  })

  it('常规小数截到 6 位有效数字', () => {
    expect(formatValue(convert(1, 'day', 'year'))).toBe('0.00273973')
    expect(formatValue(1234.5678901234)).toBe('1234.57')
    expect(formatValue(convert(100, 'second', 'hour'))).toBe('0.0277778')
  })

  it('常规区间的大整数用普通十进制', () => {
    expect(formatValue(convert(1, 'day', 'microsecond'))).toBe('86400000000')
    expect(formatValue(convert(1, 'second', 'nanosecond'))).toBe('1000000000')
  })

  it('超出区间自动转科学计数法', () => {
    expect(formatValue(convert(1, 'year', 'nanosecond'))).toBe('3.1536e+16')
    expect(formatValue(convert(1, 'minute', 'year'))).toBe('1.90259e-6')
    expect(formatValue(convert(1, 'second', 'month'))).toBe('3.85802e-7')
    expect(formatValue(1e12)).toBe('1e+12')
  })
})

describe('parseInput', () => {
  it('空输入报错', () => {
    expect(parseInput('')).toEqual({ ok: false, error: '不能为空！' })
    expect(parseInput('   ')).toEqual({ ok: false, error: '不能为空！' })
  })

  it('非法字符报错', () => {
    expect(parseInput('abc')).toEqual({ ok: false, error: '请输入有效数字' })
    expect(parseInput('1天')).toEqual({ ok: false, error: '请输入有效数字' })
  })

  it('支持小数、正负号与科学计数法', () => {
    expect(parseInput(' 12.5 ')).toEqual({ ok: true, value: 12.5 })
    expect(parseInput('1e3')).toEqual({ ok: true, value: 1000 })
    expect(parseInput('-5')).toEqual({ ok: true, value: -5 })
    expect(parseInput('.5')).toEqual({ ok: true, value: 0.5 })
  })
})
