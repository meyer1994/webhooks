<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
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
  select: [request: Request]
}>()

const bodySize = computed(() => {
  if (!props.request.body) return 0
  return new Blob([props.request.body]).size
})

const timeAgo = useTimeAgo(() => new Date(props.request.createdAt))

type BadgeColor
  = | 'success'
    | 'error'
    | 'primary'
    | 'secondary'
    | 'info'
    | 'warning'
    | 'neutral'

const methodColor = (m: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'info',
  }
  return map[m] || 'neutral'
}
</script>

<template>
  <div
    class="p-3 cursor-pointer hover:bg-gray-800 transition-colors border-l-4"
    :class="{
      'bg-gray-800': props.selected,
      'border-l-primary-500': props.selected,
    }"
    @click="emit('select', request)"
  >
    <div class="flex justify-between items-center mb-1">
      <div class="flex items-center gap-2">
        <UBadge
          :color="methodColor(request.method)"
          variant="subtle"
          size="xs"
        >
          {{ request.method }}
        </UBadge>
        <FormatBytes
          :value="bodySize"
          class="text-xs text-gray-500"
        />
      </div>
      <span class="text-xs text-gray-500">
        {{ timeAgo }}
      </span>
    </div>

    <div class="text-xs text-gray-400 truncate font-mono flex gap-4 items-center">
      <span>
        id:
        <span class="text-primary-400">{{ request.id.slice(-8) }}</span>
      </span>
      <span>
        headers:
        <span class="text-primary-300">
          {{
            (() => {
              try {
                const headers = JSON.parse(request.headers || '{}')
                return Object.keys(headers).length
              }
              catch { return 0 }
            })()
          }}
        </span>
      </span>
      <span>
        query:
        <span class="text-primary-300">
          {{
            (() => {
              try {
                const q = JSON.parse(request.queryParams || '{}')
                return Object.keys(q).length
              }
              catch { return 0 }
            })()
          }}
        </span>
      </span>
    </div>
  </div>
</template>
