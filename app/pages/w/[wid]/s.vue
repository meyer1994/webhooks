<script setup lang="ts">
import * as z from 'zod'

const schemaParams = z.object({
  wid: z.uuidv7(),
})

definePageMeta({
  validate: (route) => {
    schemaParams.parse(route.params)
    return true
  },
})

const { $trpc } = useNuxtApp()

const route = useRoute()
const params = route.params as z.output<typeof schemaParams>

const { data } = await useAsyncData(
  () => `/webhook/${params.wid}/config`,
  () => $trpc.webhook.config.query({
    webhookId: params.wid as string,
  }),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">
            Webhook Configuration
          </h2>
          <span class="text-xs font-mono text-gray-500">
            ID: {{ data?.id }}
          </span>
        </div>
      </template>

      <!-- @vue-expect-error - TODO: fix this -->
      <FormSettings
        :default-value="data"
        @submit="async (data) => {
          await $trpc.webhook.update.mutate({
            ...data,
            webhookId: params.wid as string,
          })
        }"
      />
    </UCard>

    <UCard class="bg-gray-900/50">
      <template #header>
        <div class="flex items-center gap-2 text-md font-semibold text-gray-400">
          <UIcon name="i-lucide-info" />
          QUICK INFO
        </div>
      </template>
      <div class="text-sm text-gray-400 space-y-2">
        <p>
          This configuration determines how the endpoint <code class="text-primary-400">/api/h/{{ data?.id }}</code> responds to incoming requests.
        </p>
        <ul class="list-disc list-inside space-y-1">
          <li>Changes take effect immediately.</li>
          <li>Max body size is 1MB.</li>
          <li>Artificial delay is capped at 100ms.</li>
        </ul>
      </div>
    </UCard>
  </div>
</template>
