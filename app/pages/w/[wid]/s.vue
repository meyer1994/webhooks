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

const { data: rawConfig, refresh: refreshRaw } = await useAsyncData(
  () => `/webhook/${params.wid}/config`,
  () => $trpc.webhook.config.query({
    webhookId: params.wid as string,
  }),
)

const data = computed(() => {
  if (!rawConfig.value) return null
  const config = rawConfig.value
  // Transform null to undefined for form compatibility
  return {
    name: config.name ?? undefined,
    allowCors: config.allowCors ?? false,
    responseStatus: config.responseStatus ?? 200,
    responseContentType: config.responseContentType ?? 'application/json',
    responseBody: config.responseBody ?? '{"status":"ok"}',
    responseDelay: config.responseDelay ?? 0,
  }
})

async function refresh() {
  await refreshRaw()
}
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
            ID: {{ params.wid }}
          </span>
        </div>
      </template>

      <FormSettings
        :default-value="data"
        @submit="async (formData) => {
          await $trpc.webhook.update.mutate({
            ...formData,
            webhookId: params.wid as string,
          })
          const toast = useToast()
          toast.add({
            title: 'Configuration saved',
            color: 'success',
          })
          await refresh()
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
          This configuration determines how the endpoint <code class="text-primary-400">/api/h/{{ params.wid }}</code> responds to incoming requests.
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
