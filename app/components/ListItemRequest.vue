<script setup lang="ts">
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list'][number]

type Props = {
  request: Request
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
})

const emit = defineEmits<{
  delete: [request: Request]
}>()

const bodySize = computed(() => {
  if (!props.request.body) return 0
  return new Blob([props.request.body]).size
})

const path = computed(() => {
  try {
    return new URL(props.request.url).pathname
  }
  catch {
    return props.request.url
  }
})

const ip = computed(() => {
  const addr = props.request.ipAddress ?? ''
  return addr.length > 15 ? `${addr.slice(0, 13)}…` : addr
})
</script>

<template>
  <div
    class="flex flex-col gap-1 py-2 px-2"
    :class="{ 'bg-primary-500/10': selected }"
  >
    <!-- Row 1: method + path + ip + delete -->
    <div class="flex items-center gap-2">
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        :class="{
          'text-green-400': request.method === 'GET',
          'text-blue-400': request.method === 'POST',
          'text-orange-400': request.method === 'PUT',
          'text-red-400': request.method === 'DELETE',
          'text-cyan-400': request.method === 'PATCH',
        }"
        :label="request.method"
      />

      <span class="text-xs font-mono text-white truncate flex-1" :title="request.url">
        {{ path }}
      </span>

      <span class="text-xs font-mono text-gray-500 shrink-0" :title="request.ipAddress ?? ''">
        {{ ip }}
      </span>

      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        class="shrink-0"
        @click.stop="emit('delete', request)"
      />
    </div>

    <!-- Row 2: id + headers + query + size -->
    <div class="flex items-center gap-3 font-mono text-xs text-gray-500">
      <span :title="request.id">#{{ request.id.split('-').pop() }}</span>
      <span>headers: {{ Object.keys(request.headers).length }}</span>
      <span>query: {{ Object.keys(request.queryParams).length }}</span>
      <FormatBytes v-slot="{ formatted }" :model-value="bodySize">
        <span>{{ formatted }}</span>
      </FormatBytes>
    </div>
  </div>
</template>
