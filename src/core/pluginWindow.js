// 让 uTools 插件窗口高度跟随内容，内容多时自动变高，避免在小窗口里下拉。
// 如果 uTools 不允许撑高（分离窗口、老版本、屏幕太矮），回调 onUnfit 让界面切紧凑布局。
// 非 uTools 环境（浏览器预览）直接跳过，保持正常布局。
const BOTTOM_MARGIN = 160
// 实际可用高度比目标矮这么多，就认为撑不开。
const FIT_TOLERANCE = 60
// uTools 撑高有动画，等它稳定后再判断是否真的没撑开。
const FIT_CHECK_DELAY = 700
// 插件窗口刚打开时可能还没完成布局，隔几个时间点补测一次。
// 刻意不用 requestAnimationFrame：窗口未显示时 rAF 会被节流甚至不触发。
const RECHECK_DELAYS = [0, 60, 250, 800]

export function syncPluginHeight(element, { onUnfit } = {}) {
  const utools = typeof window === 'undefined' ? null : window.utools
  if (!element || !utools) {
    return () => {}
  }

  // uTools 新版本为 setExpandHeight，老版本叫 setExpendHeight，两个都试。
  const hasSetter =
    typeof utools.setExpandHeight === 'function' || typeof utools.setExpendHeight === 'function'
  if (!hasSetter) {
    // 完全没有高度接口（老版本 uTools），只能靠紧凑布局塞进默认窗口。
    onUnfit?.()
    return () => {}
  }

  const setHeight = (height) =>
    typeof utools.setExpandHeight === 'function'
      ? utools.setExpandHeight(height)
      : utools.setExpendHeight(height)

  let appliedHeight = 0
  let fitTimer = 0

  const apply = () => {
    const height = Math.ceil(element.getBoundingClientRect().height)
    if (!height || Math.abs(height - appliedHeight) < 2) return
    appliedHeight = height
    const target = Math.min(height, maxPluginHeight(utools))

    // 目标高度被屏幕工作区截断时，内容无法完整显示，需要切换紧凑布局。
    if (height > target) onUnfit?.()

    if (setHeight(target) === false) {
      onUnfit?.()
      return
    }

    // uTools 也可能把高度限制得更小，稍后比对实际可用高度。
    clearTimeout(fitTimer)
    fitTimer = setTimeout(() => {
      if (window.innerHeight && window.innerHeight < target - FIT_TOLERANCE) onUnfit?.()
    }, FIT_CHECK_DELAY)
  }

  const timers = RECHECK_DELAYS.map((delay) => setTimeout(apply, delay))

  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply)
  observer?.observe(element)

  return () => {
    timers.forEach(clearTimeout)
    clearTimeout(fitTimer)
    observer?.disconnect()
  }
}

function maxPluginHeight(utools) {
  const workArea = utools.getPrimaryDisplay?.()?.workAreaSize?.height
  const screenHeight = workArea || window.screen?.availHeight || 0
  if (!screenHeight) return Number.POSITIVE_INFINITY
  return Math.max(320, Math.round(screenHeight - BOTTOM_MARGIN))
}
