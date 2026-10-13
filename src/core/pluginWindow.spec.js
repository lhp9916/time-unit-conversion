import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { syncPluginHeight } from './pluginWindow.js'

let resizeCallback
let disconnected

function stubGlobals() {
  resizeCallback = null
  disconnected = false
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resizeCallback = callback
    }
    observe() {}
    disconnect() {
      disconnected = true
    }
  }
}

function stubWindow({ utools = {}, screenHeight = 1080, workArea = 1040, innerHeight } = {}) {
  globalThis.window = {
    innerHeight,
    screen: { availHeight: screenHeight },
    utools: {
      getPrimaryDisplay: () => ({ workAreaSize: { height: workArea } }),
      setExpandHeight: vi.fn(() => true),
      ...utools
    }
  }
  return globalThis.window
}

function stubElement(height) {
  return { getBoundingClientRect: () => ({ height }) }
}

function flush() {
  vi.runAllTimers()
}

beforeEach(() => {
  vi.useFakeTimers()
  stubGlobals()
})

afterEach(() => {
  vi.useRealTimers()
  delete globalThis.window
  delete globalThis.ResizeObserver
})

describe('syncPluginHeight', () => {
  it('按内容高度撑开 uTools 插件窗口', () => {
    const win = stubWindow()
    syncPluginHeight(stubElement(700))
    flush()

    expect(win.utools.setExpandHeight).toHaveBeenCalledTimes(1)
    expect(win.utools.setExpandHeight).toHaveBeenCalledWith(700)
  })

  it('内容超过上限时按屏幕可用高度截断', () => {
    const win = stubWindow({ workArea: 800 })
    syncPluginHeight(stubElement(900))
    flush()

    expect(win.utools.setExpandHeight).toHaveBeenCalledWith(640)
  })

  it('缺少 getPrimaryDisplay 时回退到屏幕可用高度', () => {
    const win = stubWindow({ screenHeight: 900 })
    delete win.utools.getPrimaryDisplay
    syncPluginHeight(stubElement(800))
    flush()

    expect(win.utools.setExpandHeight).toHaveBeenCalledWith(740)
  })

  it('高度未变化时不重复设置', () => {
    const win = stubWindow()
    let height = 700
    const element = { getBoundingClientRect: () => ({ height }) }
    syncPluginHeight(element)
    flush()

    resizeCallback()
    expect(win.utools.setExpandHeight).toHaveBeenCalledTimes(1)

    height = 760
    resizeCallback()
    expect(win.utools.setExpandHeight).toHaveBeenCalledTimes(2)
    expect(win.utools.setExpandHeight).toHaveBeenLastCalledWith(760)
  })

  it('停止监听会断开 observer 并清掉补测计时器', () => {
    const win = stubWindow()
    const stop = syncPluginHeight(stubElement(600))
    flush()
    expect(win.utools.setExpandHeight).toHaveBeenCalledTimes(1)

    stop()
    flush()

    expect(disconnected).toBe(true)
    expect(win.utools.setExpandHeight).toHaveBeenCalledTimes(1)
  })

  it('缺少 ResizeObserver 时仍会按内容设置一次', () => {
    const win = stubWindow()
    delete globalThis.ResizeObserver
    syncPluginHeight(stubElement(640))
    flush()

    expect(win.utools.setExpandHeight).toHaveBeenCalledWith(640)
  })

  it('老版本 uTools 的 setExpendHeight 也能用', () => {
    const setExpendHeight = vi.fn(() => true)
    stubWindow({ utools: { setExpandHeight: undefined, setExpendHeight } })
    const onUnfit = vi.fn()
    syncPluginHeight(stubElement(700), { onUnfit })
    flush()

    expect(setExpendHeight).toHaveBeenCalledWith(700)
    expect(onUnfit).not.toHaveBeenCalled()
  })

  it('uTools 没有高度接口时回调 onUnfit', () => {
    stubWindow({ utools: { setExpandHeight: undefined } })
    const onUnfit = vi.fn()
    syncPluginHeight(stubElement(700), { onUnfit })
    flush()

    expect(onUnfit).toHaveBeenCalledTimes(1)
  })

  it('撑高失败时回调 onUnfit', () => {
    stubWindow({ utools: { setExpandHeight: vi.fn(() => false) } })
    const onUnfit = vi.fn()
    syncPluginHeight(stubElement(700), { onUnfit })
    flush()

    expect(onUnfit).toHaveBeenCalledTimes(1)
  })

  it('实际可用高度不足时回调 onUnfit', () => {
    stubWindow({ innerHeight: 500 })
    const onUnfit = vi.fn()
    syncPluginHeight(stubElement(700), { onUnfit })
    vi.advanceTimersByTime(900)

    expect(onUnfit).toHaveBeenCalledTimes(1)
  })

  it('浏览器环境保持原样，不回调 onUnfit', () => {
    globalThis.window = { screen: { availHeight: 1080 } }
    const onUnfit = vi.fn()
    const stop = syncPluginHeight(stubElement(700), { onUnfit })
    flush()

    expect(onUnfit).not.toHaveBeenCalled()
    expect(() => stop()).not.toThrow()
  })
})
