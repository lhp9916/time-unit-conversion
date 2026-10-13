import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import TimeConvert from './index.vue'
import { UNITS } from '../core/timeUnits.js'

describe('TimeConvert', () => {
  it('渲染全部单位行，每行都有输入框与转换按钮', async () => {
    const html = await renderToString(createSSRApp(TimeConvert))

    expect(html.match(/<input/g)).toHaveLength(UNITS.length)
    expect(html.match(/>转换</g)).toHaveLength(UNITS.length)
    expect(html).toContain('年')
    expect(html).toContain('微秒')
    expect(html).toContain('纳秒')
  })
})
