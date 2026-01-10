<script setup lang="ts">
import * as echarts from 'echarts/core'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list']['requests'][number]

type Props = {
  items: Request[]
  sourceColumn?: string
  resultColumn?: string
  method?: 'count' | 'sum' | 'avg'
  interval?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
}

const props = withDefaults(defineProps<Props>(), {
  sourceColumn: 'createdAt',
  resultColumn: 'count',
  method: 'count',
  interval: 'hour',
})

type GroupByTimeConfig = {
  sourceColumn?: string
  resultColumn?: string
  method?: 'count' | 'sum' | 'avg'
  interval?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
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
    const data = params.upstream.cloneRawData()

    // @ts-expect-error - data is an array
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

const option = computed(() => ({
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
          interval: 'second',
        },
      },
    },
  ],
  xAxis: { type: 'time' },
  yAxis: { type: 'value' },
  grid: { top: 8, right: 8, bottom: 8, left: 8, containLabel: true },
  series: [
    { type: 'bar', datasetId: 'byTime', encode: { x: 0, y: 1 } },
  ],
  tooltip: { trigger: 'axis' },
}))
</script>

<template>
  <div class="w-full">
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
