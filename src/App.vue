<script setup>
import { onMounted, ref } from 'vue'
import TimeConvert from './TimeConvert/index.vue'

const route = ref('')

onMounted(() => {
  // 纯浏览器里预览时没有 utools API，直接进入功能页。
  if (!window.utools) {
    route.value = 'time-unit-conversion'
    return
  }
  window.utools.onPluginEnter((action) => {
    route.value = action.code
  })
  window.utools.onPluginOut(() => {
    route.value = ''
  })
})
</script>

<template>
  <TimeConvert v-if="route === 'time-unit-conversion'" />
</template>
