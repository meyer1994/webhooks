<script setup lang="ts">
import * as z from 'zod'

const schema = z.object({
  responseStatus: z.number().min(100).max(599),
  responseContentType: z.enum([
    'application/json',
    'text/plain',
    'text/html',
    'application/xml',
  ]),
  responseBody: z.string().max(1024 * 1024 * 1),
  responseDelay: z.number().min(0).max(100),
})

type Schema = z.infer<typeof schema>

type Props = {
  defaultValue?: Partial<Schema> | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: () => ({
    responseStatus: 200,
    responseContentType: 'application/json',
    responseBody: '{"status":"ok"}',
    responseDelay: 0,
  }),
})

const emits = defineEmits<{ submit: [e: z.output<typeof schema>] }>()
const state = reactive<Partial<Schema>>({ ...props.defaultValue })

watch(
  () => props.defaultValue,
  v => v && Object.assign(state, v),
  { deep: true },
)

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
  <UForm
    v-slot="{ loading }"
    :schema="schema"
    :state="state"
    class="flex flex-col gap-6"
    @submit.prevent="(e) => emits('submit', e.data)"
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
      <slot
        v-bind="{ loading }"
        name="submit-button"
      >
        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-save"
        >
          Save Configuration
        </UButton>
      </slot>
    </div>
  </UForm>
</template>
