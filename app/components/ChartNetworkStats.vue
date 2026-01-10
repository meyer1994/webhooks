<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list']['requests'][number]

type Interval = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
type Method = 'count' | 'sum' | 'avg'

type Props = {
  items: Request[]
}

const props = defineProps<Props>()

const intervals: Array<{ label: string, value: Interval }> = [
  { label: 'Second', value: 'second' },
  { label: 'Minute', value: 'minute' },
  { label: 'Hour', value: 'hour' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]
const selectedInterval = ref<Interval>('hour')

// Pre-process items to calculate body size and header count
const enrichedItems = computed(() => {
  return props.items.map((req) => {
    let bodySize = 0
    let headerCount = 0
    if (req.body) bodySize = new Blob([req.body]).size
    if (req.headers) headerCount = Object.keys(req.headers).length
    return { ...req, bodySize, headerCount }
  })
})

type GroupByTimeConfig = {
  sourceColumn?: string
  resultColumn?: string
  method?: Method
  interval?: Interval
}

// Register transform if not already registered (or overwrite)
// We use a specific name to avoid conflict/ambiguity if logic differs slightly
echarts.registerTransform({
  type: 'custom:groupByTimeStats',
  transform(params) {
    const config: GroupByTimeConfig = params.config || {}
    const sourceColumn = config.sourceColumn || 'createdAt'
    const resultColumn = config.resultColumn || 'count'
    const method = config.method || 'sum'
    const interval = config.interval || 'hour'

    const groups = new Map<number, { count: number, sum: number }>()
    const data = params.upstream.cloneRawData() as Record<string, unknown>[]

    for (const row of data) {
      const rowObj = row as Record<string, unknown>
      const timestamp = new Date(rowObj[sourceColumn] as string | number | Date)
      const value = (rowObj[resultColumn] as number) || 0

      // Round down to interval
      const ts = new Date(timestamp.getTime())
      if (interval === 'hour') ts.setMinutes(0, 0, 0)
      else if (interval === 'minute') ts.setSeconds(0, 0)
      else if (interval === 'second') ts.setMilliseconds(0)
      else if (interval === 'day') ts.setHours(0, 0, 0)
      else if (interval === 'week') ts.setHours(0, 0, 0)
      else if (interval === 'month') ts.setDate(1)
      else if (interval === 'year') ts.setMonth(0)
      else ts.setMinutes(0, 0, 0)

      const time = ts.getTime()
      const cur = groups.get(time) || { count: 0, sum: 0 }
      cur.count += 1
      cur.sum += value
      groups.set(time, cur)
    }

    const out: Array<[number, number]> = []
    for (const [time, data] of groups) {
      let val = data.count
      if (method === 'sum') val = data.sum
      else if (method === 'avg') val = data.sum / data.count

      out.push([time, val])
    }

    // Sort by time to ensure line chart draws correctly
    out.sort((a, b) => a[0] - b[0])

    return { data: out }
  },
})

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9ca3af',
  },
  dataset: [
    {
      id: 'raw',
      source: enrichedItems.value,
    },
    {
      id: 'bodySizeAgg',
      fromDatasetId: 'raw',
      transform: {
        type: 'custom:groupByTimeStats',
        config: {
          sourceColumn: 'createdAt',
          resultColumn: 'bodySize',
          method: 'sum',
          interval: selectedInterval.value,
        },
      },
    },
    {
      id: 'headerCountAgg',
      fromDatasetId: 'raw',
      transform: {
        type: 'custom:groupByTimeStats',
        config: {
          sourceColumn: 'createdAt',
          resultColumn: 'headerCount',
          method: 'sum',
          interval: selectedInterval.value,
        },
      },
    },
  ],
  xAxis: {
    type: 'time',
    axisLabel: {
      color: '#6b7280',
      hideOverlap: true,
      formatter: (value: number) => {
        const date = new Date(value)
        const interval = selectedInterval.value
        if (interval === 'second' || interval === 'minute' || interval === 'hour')
          return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      },
    },
    axisLine: { lineStyle: { color: '#374151' } },
    splitLine: { show: false },
  },
  yAxis: [
    {
      type: 'value',
      name: 'Body Size',
      position: 'left',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + 'MB'
          if (value >= 1024) return (value / 1024).toFixed(1) + 'KB'
          return value + 'B'
        },
      },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
    },
    {
      type: 'value',
      name: 'Headers',
      position: 'right',
      splitLine: { show: false },
    },
  ],
  grid: { top: 30, right: 40, bottom: 20, left: 50, containLabel: true },
  series: [
    {
      name: 'Total Body Size',
      type: 'line',
      datasetId: 'bodySizeAgg',
      encode: { x: 0, y: 1 },
      yAxisIndex: 0,
      smooth: true,
      showSymbol: false,
      itemStyle: { color: '#8b5cf6' }, // Primary
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
          { offset: 1, color: 'rgba(139, 92, 246, 0.0)' },
        ]),
      },
    },
    {
      name: 'Total Headers',
      type: 'line',
      datasetId: 'headerCountAgg',
      encode: { x: 0, y: 1 },
      yAxisIndex: 1,
      smooth: true,
      showSymbol: false,
      itemStyle: { color: '#10b981' }, // Success/Green
    },
  ],
  legend: {
    show: true,
    textStyle: { color: '#9ca3af' },
    bottom: 0,
  },
}))
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <div class="flex justify-between items-center px-2">
      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Network Stats
      </h4>
      <USelect
        v-model="selectedInterval"
        :items="intervals"
        variant="none"
        size="xs"
        class="w-32 bg-gray-900 border border-gray-800 rounded-md"
      />
    </div>
    <VChart
      class="chart"
      :option="option"
    />
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 250px;
}
</style>
