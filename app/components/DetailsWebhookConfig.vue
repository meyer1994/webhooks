<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import type { AppRouterOutputs } from '~~/server/trpc'

type Webhook = AppRouterOutputs['webhook']['list']

const schema = z.object({
  responseStatus: z.number().min(100).max(599),
  responseContentType: z.string().max(1024),
  responseBody: z.string().max(1024 * 1024 * 1),
  responseDelay: z.number().min(0).max(100),
})

type Schema = z.output<typeof schema>
export type FormWebhookConfigData = Schema

type Props = {
  webhook: Webhook
}

const props = defineProps<Props>()
const emits = defineEmits<{ updated: [] }>()

const { $trpc } = useNuxtApp()
const toast = useToast()

const state = reactive<Partial<Schema>>({
  responseStatus: props.webhook.responseStatus ?? 200,
  responseContentType: props.webhook.responseContentType ?? 'application/json',
  responseBody: props.webhook.responseBody ?? '{"status":"ok"}',
  responseDelay: props.webhook.responseDelay ?? 0,
})

// Sync props changes to state
watch(() => props.webhook, (v) => {
  if (v) {
    Object.assign(state, {
      responseStatus: v.responseStatus ?? 200,
      responseContentType: v.responseContentType ?? 'application/json',
      responseBody: v.responseBody ?? '{"status":"ok"}',
      responseDelay: v.responseDelay ?? 0,
    })
  }
}, { deep: true })

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $trpc.webhook.update.mutate({
      webhookId: props.webhook.id,
      ...event.data,
    })
    toast.add({
      title: 'Success',
      description: 'Webhook configuration updated',
      color: 'success',
    })
    emits('updated')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as { message?: string }).message || 'Failed to update configuration',
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

const statusOptions = [
  { label: '200 OK', value: 200 },
  { label: '201 Created', value: 201 },
  { label: '204 No Content', value: 204 },
  { label: '400 Bad Request', value: 400 },
  { label: '401 Unauthorized', value: 401 },
  { label: '403 Forbidden', value: 403 },
  { label: '404 Not Found', value: 404 },
  { label: '500 Internal Server Error', value: 500 },
]

const contentTypeOptions = [
  'application/json',
  'text/plain',
  'text/html',
  'application/xml',
]
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
            ID: {{ webhook.id }}
          </span>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField
            label="Response Status"
            name="responseStatus"
            description="The HTTP status code returned to the caller"
          >
            <USelect
              v-model="state.responseStatus"
              :items="statusOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Response Content Type"
            name="responseContentType"
            description="The Content-Type header of the response"
          >
            <USelect
              v-model="state.responseContentType"
              :items="contentTypeOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Response Delay (ms)"
            name="responseDelay"
            description="Artificial delay before sending the response (0-100ms)"
          >
            <UInput
              v-model="state.responseDelay"
              type="number"
              min="0"
              max="100"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Response Body"
          name="responseBody"
          description="The body content returned to the caller"
        >
          <UTextarea
            v-model="state.responseBody"
            :rows="6"
            font-mono
            class="w-full"
            placeholder="{&quot;status&quot;:&quot;ok&quot;}"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            icon="i-lucide-save"
          >
            Save Configuration
          </UButton>
        </div>
      </UForm>
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
          This configuration determines how the endpoint <code class="text-primary-400">/api/h/{{ webhook.id }}</code> responds to incoming requests.
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
