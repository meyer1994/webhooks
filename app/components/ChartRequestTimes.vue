<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list']['requests'][number]

type Interval = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
type Method = 'count' | 'sum' | 'avg'

type Props = {
  items: Request[]
  sourceColumn?: keyof Request
  resultColumn?: string
  method?: Method
}

const props = withDefaults(defineProps<Props>(), {
  sourceColumn: 'createdAt',
  resultColumn: 'count',
  method: 'count',
})

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

type GroupByTimeConfig = {
  sourceColumn?: keyof Request
  resultColumn?: keyof Request
  method?: Method
  interval?: Interval
}

echarts.registerTransform({
  type: 'custom:groupByTime',
  transform(params) {
    const config: GroupByTimeConfig = params.config || {}
    const sourceColumn = config.sourceColumn || 'createdAt'
    const resultColumn = config.resultColumn || 'count'
    const method = config.method || 'count' // 'count', 'sum', 'avg'
    const interval = config.interval || 'hour'

    const groups = new Map<number, { count: number, sum: number, values: number[] }>()
    const data = params.upstream.cloneRawData() as Record<string, unknown>[]

    for (const row of data) {
      const rowObj = row as Record<string, unknown>
      const timestamp = new Date(rowObj[sourceColumn] as string | number | Date)
      const value = (rowObj[resultColumn] as number) || 1

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
      const cur = groups.get(time) || { count: 0, sum: 0, values: [] }
      cur.count += 1
      cur.sum += value
      cur.values.push(value)
      groups.set(time, cur)
    }

    const out: Array<[number, number]> = []
    for (const [hour, data] of groups) {
      if (method === 'count') out.push([hour, data.count])
      else if (method === 'avg') out.push([hour, data.sum / data.count])
      else if (method === 'sum') out.push([hour, data.sum])
      else out.push([hour, data.count])
    }

    return { data: out }
  },
})

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9ca3af', // gray-400
  },
  dataset: [
    {
      id: 'raw',
      source: props.items,
    },
    {
      id: 'byTime',
      fromDatasetId: 'raw',
      transform: {
        type: 'custom:groupByTime',
        config: {
          sourceColumn: 'createdAt',
          resultColumn: 'count',
          method: 'count',
          interval: selectedInterval.value,
        },
      },
    },
  ],
  xAxis: {
    type: 'time',
    axisLabel: {
      color: '#6b7280', // gray-500
      hideOverlap: true,
      formatter: (value: number) => {
        const date = new Date(value)
        const interval = selectedInterval.value
        if (interval === 'second')
          return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        else if (interval === 'minute')
          return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
        else if (interval === 'hour')
          return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
        else if (interval === 'day')
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        else if (interval === 'week')
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        else if (interval === 'month')
          return date.toLocaleDateString([], { month: 'short', year: '2-digit' })
        else if (interval === 'year')
          return date.getFullYear().toString()
        return date.toLocaleDateString()
      },
    },
    axisLine: {
      lineStyle: {
        color: '#374151',
      },
    },
    splitLine: {
      show: false,
    },
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: '#374151',
        type: 'dashed',
      },
    },
  },
  grid: { top: 8, right: 8, bottom: 8, left: 8, containLabel: true },
  series: [
    {
      type: 'bar',
      datasetId: 'byTime',
      encode: { x: 0, y: 1 },
      itemStyle: {
        color: '#8b5cf6', // violet-500
        borderRadius: [4, 4, 0, 0],
      },
    },
  ],
}))
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <div class="flex justify-end">
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
  height: 200px;
}
</style>
