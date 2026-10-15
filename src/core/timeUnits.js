// 时间单位换算内核：以「纳秒」为基准，纯函数、不依赖 Vue / DOM。
// 基准取最小单位（纳秒）并全部用可精确表示的整数因子，避免 1 ms ÷ 1 μs = 1000.0000000000001 这类浮点误差。
export const UNITS = [
  { key: 'year', label: '年', symbol: 'year', nanoseconds: 3.1536e16 },
  { key: 'month', label: '月', symbol: 'month', nanoseconds: 2.592e15 },
  { key: 'week', label: '周', symbol: 'week', nanoseconds: 6.048e14 },
  { key: 'day', label: '天', symbol: 'day', nanoseconds: 8.64e13 },
  { key: 'hour', label: '时', symbol: 'hour', nanoseconds: 3.6e12 },
  { key: 'minute', label: '分', symbol: 'minute', nanoseconds: 6e10 },
  { key: 'second', label: '秒', symbol: 's', nanoseconds: 1e9 },
  { key: 'millisecond', label: '毫秒', symbol: 'ms', nanoseconds: 1e6 },
  { key: 'microsecond', label: '微秒', symbol: 'μs', nanoseconds: 1e3 },
  { key: 'nanosecond', label: '纳秒', symbol: 'ns', nanoseconds: 1 }
]

const UNIT_MAP = new Map(UNITS.map((unit) => [unit.key, unit]))

// 结果最多保留的有效数字位数，想更精确/更短改这里即可。
const SIGNIFICANT_DIGITS = 6
// 超出该区间改用科学计数法，避免一长串的零或超长整数。
const PLAIN_UPPER = 1e12
const PLAIN_LOWER = 1e-3

const NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/

export function convert(value, fromKey, toKey) {
  const from = UNIT_MAP.get(fromKey)
  const to = UNIT_MAP.get(toKey)
  if (!from || !to) {
    throw new Error(`未知单位：${fromKey} -> ${toKey}`)
  }
  const result = value * (from.nanoseconds / to.nanoseconds)
  if (!Number.isFinite(result) || (value !== 0 && result === 0)) {
    throw new RangeError('换算结果超出可表示范围')
  }
  return result
}

export function formatValue(value) {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  const abs = Math.abs(value)
  if (abs >= PLAIN_UPPER || abs < PLAIN_LOWER) {
    return trimExponential(value.toExponential(SIGNIFICANT_DIGITS - 1))
  }
  // toPrecision 同时完成四舍五入与浮点尾数噪声清理（如 0.30000000000000004）。
  return parseFloat(value.toPrecision(SIGNIFICANT_DIGITS)).toString()
}

export function parseInput(text) {
  const raw = typeof text === 'string' ? text.trim() : ''
  if (raw === '') return { ok: false, error: '不能为空！' }
  if (!NUMBER_PATTERN.test(raw)) return { ok: false, error: '请输入有效数字' }

  const value = Number(raw)
  if (!Number.isFinite(value)) return { ok: false, error: '请输入有效数字' }
  return { ok: true, value }
}

function trimExponential(text) {
  const [mantissa, exponent] = text.split('e')
  const trimmed = mantissa.includes('.')
    ? mantissa.replace(/0+$/, '').replace(/\.$/, '')
    : mantissa
  return `${trimmed}e${exponent}`
}
