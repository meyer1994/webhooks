<script setup lang="ts">
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['list']['requests'][number]

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
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <!-- method -->
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

        <!-- body size -->
        <FormatBytes
          v-slot="{ formatted }"
          :model-value="bodySize"
        >
          <span class="text-xs font-mono">
            {{ formatted }}
          </span>
        </FormatBytes>
      </div>

      <!-- created at -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          @click.stop="emit('delete', request)"
        />
        <NuxtTime
          :datetime="request.createdAt"
          title
          class="text-xs text-gray-500 font-medium"
        />
      </div>
    </div>

    <!-- Details -->
    <div class="flex items-center justify-between gap-4 font-mono">
      <!-- request id -->
      <span
        class="text-xs text-muted-foreground"
        :title="request.id"
      >
        #{{ request.id.split('-').pop() }}
      </span>

      <!-- headers -->
      <span
        class="text-xs text-muted-foreground"
        :title="request.url"
      >
        headers: {{ Object.keys(request.headers).length }}
      </span>

      <!-- query -->
      <span
        class="text-xs text-muted-foreground"
        :title="request.url"
      >
        query: {{ Object.keys(request.queryParams).length }}
      </span>
    </div>
  </div>
</template>
