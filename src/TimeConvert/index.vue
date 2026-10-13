<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { UNITS, convert, formatValue, parseInput } from '../core/timeUnits.js'
import { syncPluginHeight } from '../core/pluginWindow.js'

const values = reactive({})
const errors = reactive({})
const baseKey = ref('')
const root = ref(null)
// 窗口撑不开时切双列，保证 10 个单位一屏可见。
const compact = ref(false)

let stopSync = () => {}

onMounted(() => {
  stopSync = syncPluginHeight(root.value, {
    onUnfit: () => {
      compact.value = true
    }
  })
})

onUnmounted(() => {
  stopSync()
})

UNITS.forEach((unit) => {
  values[unit.key] = ''
  errors[unit.key] = ''
})

const baseLabel = computed(
  () => UNITS.find((unit) => unit.key === baseKey.value)?.label ?? ''
)

function clearErrors() {
  UNITS.forEach((unit) => {
    errors[unit.key] = ''
  })
}

function handleConvert(key) {
  const parsed = parseInput(values[key])
  clearErrors()

  if (!parsed.ok) {
    errors[key] = parsed.error
    return
  }

  // 输入行保留用户原文，其余行按该行数值刷新。
  UNITS.forEach((unit) => {
    if (unit.key === key) return
    values[unit.key] = formatValue(convert(parsed.value, key, unit.key))
  })
  baseKey.value = key
}

function reset() {
  UNITS.forEach((unit) => {
    values[unit.key] = ''
    errors[unit.key] = ''
  })
  baseKey.value = ''
  clearErrors()
}
</script>

<template>
  <div ref="root" class="converter" :class="{ compact }">
    <header class="panel-head">
      <div>
        <h1>时间单位换算</h1>
        <p class="sub">1 月 = 30 天 · 1 年 = 365 天</p>
      </div>
      <button class="ghost" type="button" @click="reset">清空</button>
    </header>

    <div class="scale" aria-hidden="true"></div>

    <div class="rows">
      <div
        v-for="(unit, index) in UNITS"
        :key="unit.key"
        class="row"
        :class="{ active: baseKey === unit.key }"
        :style="{ '--i': index }"
      >
        <span class="label">
          <span class="label-cn">{{ unit.label }}</span>
          <span class="label-en">{{ unit.symbol }}</span>
        </span>
        <input
          v-model="values[unit.key]"
          class="value"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          :aria-label="`${unit.label}（${unit.symbol}）数值`"
          @keyup.enter="handleConvert(unit.key)"
        />
        <button class="convert" type="button" @click="handleConvert(unit.key)">转换</button>
        <span v-if="errors[unit.key]" class="error">{{ errors[unit.key] }}</span>
      </div>
    </div>

    <footer class="panel-foot">
      <p class="foot-main">
        <template v-if="baseKey">已按「{{ baseLabel }}」换算，修改任意数值可再转换</template>
        <template v-else>在任意一行输入数值，点击「转换」或按回车</template>
      </p>
      <p class="foot-note">结果保留 6 位有效数字，过大或过小自动用科学计数法</p>
      <p v-if="compact" class="foot-note">窗口高度不足，已自动切换双列布局</p>
    </footer>
  </div>
</template>

<style scoped>
.converter {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 18px 20px 20px;
  color: var(--text);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.sub {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}

.ghost {
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.scale {
  height: 8px;
  margin: 11px 0 9px;
  background-image: repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 8px);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) 62px;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--surface);
  animation: row-in 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  animation-delay: calc(var(--i) * 26ms);
}

.row.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.label-cn {
  font-size: 14px;
}

.label-en {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.value {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--field);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  text-align: left;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.value:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.convert {
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: var(--on-accent);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.convert:hover {
  background: var(--accent-strong);
}

.convert:active {
  transform: translateY(1px);
}

.error {
  grid-column: 2 / -1;
  font-size: 12px;
  color: var(--danger);
}

.panel-foot {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.foot-main {
  margin: 0;
}

.foot-note {
  margin: 4px 0 0;
  opacity: 0.75;
}

.converter.compact {
  max-width: 760px;
}

.converter.compact .rows {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 12px;
}

.converter.compact .row {
  grid-template-columns: 72px minmax(0, 1fr) 56px;
}

.converter.compact .label {
  overflow: hidden;
}

.converter.compact .label-cn {
  font-size: 13px;
}

.converter.compact .label-en {
  overflow: hidden;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .row {
    animation: none;
  }
}
</style>
