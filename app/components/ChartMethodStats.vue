<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list'][number]

type Props = {
  items: Request[]
}

const props = defineProps<Props>()

const methodCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const item of props.items) {
    const method = item.method || 'UNKNOWN'
    counts.set(method, (counts.get(method) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count)
})

const methodColors: Record<string, string> = {
  GET: '#10b981', // green
  POST: '#3b82f6', // blue
  PUT: '#f97316', // orange
  DELETE: '#ef4444', // red
  PATCH: '#06b6d4', // cyan
  OPTIONS: '#8b5cf6', // purple
  HEAD: '#6366f1', // indigo
}

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9ca3af',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  xAxis: {
    type: 'category',
    data: methodCounts.value.map(item => item.method),
    axisLabel: {
      color: '#6b7280',
      fontSize: 12,
      fontFamily: 'monospace',
    },
    axisLine: {
      lineStyle: { color: '#374151' },
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#6b7280',
    },
    splitLine: {
      lineStyle: { color: '#374151', type: 'dashed' },
    },
  },
  grid: { top: 20, right: 20, bottom: 20, left: 50, containLabel: true },
  series: [
    {
      type: 'bar',
      data: methodCounts.value.map(item => ({
        value: item.count,
        itemStyle: {
          color: methodColors[item.method] || '#6b7280',
        },
      })),
      label: {
        show: true,
        position: 'top',
        color: '#9ca3af',
        fontSize: 11,
      },
    },
  ],
}))
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <VChart :option="option" />
  </div>
</template>
