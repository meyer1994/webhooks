<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list'][number]

type Props = {
  items: Request[]
}

const props = defineProps<Props>()

const countryCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const item of props.items) {
    const country = (item.cfProperties && typeof item.cfProperties === 'object' && 'country' in item.cfProperties)
      ? String(item.cfProperties.country) || 'Unknown'
      : 'Unknown'
    counts.set(country, (counts.get(country) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 countries
})

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
    formatter: (params: unknown) => {
      const param = Array.isArray(params) ? params[0] : params
      if (param && typeof param === 'object' && 'value' in param) {
        return `${param.name}: ${param.value} requests`
      }
      return ''
    },
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      color: '#6b7280',
    },
    splitLine: {
      lineStyle: { color: '#374151', type: 'dashed' },
    },
  },
  yAxis: {
    type: 'category',
    data: countryCounts.value.map(item => item.country),
    axisLabel: {
      color: '#6b7280',
      fontSize: 12,
    },
    axisLine: {
      lineStyle: { color: '#374151' },
    },
  },
  grid: { top: 20, right: 40, bottom: 20, left: 100, containLabel: true },
  series: [
    {
      type: 'bar',
      data: countryCounts.value.map(item => item.count),
      itemStyle: {
        color: '#8b5cf6', // primary color
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
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
