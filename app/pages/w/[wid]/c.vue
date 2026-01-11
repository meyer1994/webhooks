<script setup lang="ts">
import * as z from 'zod'

// https://stackoverflow.com/a/54975267
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

const schemaParams = z.object({
  wid: z.uuidv7(),
})

const schemaQuery = z.object({
  filter: z.string().optional(),
})

definePageMeta({
  validate: (route) => {
    const r0 = schemaParams.safeParse(route.params)
    if (!r0.success) throw createError({ statusCode: 400, message: r0.error.message })
    const r1 = schemaQuery.safeParse(route.query)
    if (!r1.success) throw createError({ statusCode: 400, message: r1.error.message })
    return true
  },
})

const { $trpc } = useNuxtApp()

const route = useRoute() as Overwrite<ReturnType<typeof useRoute>, {
  params: z.output<typeof schemaParams>
  query: z.output<typeof schemaQuery>
}>

const { data, refresh, status } = await useAsyncData(
  () => `/w/${route.params.wid}/c/?filter=${route.query.filter}`,
  async () => await $trpc.webhook.list.query({
    webhookId: route.params.wid,
    filter: route.query.filter,
  }),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">
            Analytics Overview
          </h2>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="status === 'pending'"
            icon="i-lucide-refresh-cw"
            @click="() => refresh()"
          />
        </div>
      </template>

      <div class="grid grid-cols-1 gap-8">
        <!-- request times chart -->
        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <UIcon name="i-lucide-activity" />
              REQUEST FREQUENCY
            </div>
          </template>
          <ChartRequestTimes
            class="h-96"
            :items="data || []"
          />
        </UCard>

        <!-- network stats chart -->
        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <UIcon name="i-lucide-bar-chart-3" />
              NETWORK & DATA USAGE
            </div>
          </template>
          <ChartNetworkStats
            class="h-96"
            :items="data || []"
          />
        </UCard>
      </div>
    </UCard>

    <!-- info card -->
    <UCard class="bg-gray-900/50">
      <template #header>
        <div class="flex items-center gap-2 text-md font-semibold text-gray-400">
          <UIcon name="i-lucide-info" />
          CHART INFO
        </div>
      </template>
      <div class="text-sm text-gray-400 space-y-2">
        <p>
          These charts show data for the last 100 requests.
          Use the interval selector on each chart to change the time resolution.
        </p>
      </div>
    </UCard>
  </div>
</template>
