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
  select: [request: Request]
}>()

const bodySize = computed(() => {
  if (!props.request.body) return 0
  return new Blob([props.request.body]).size
})

const methodColor = (m: string) => {
  const map: Record<string, string> = {
    GET: 'text-green-400',
    POST: 'text-blue-400',
    PUT: 'text-orange-400',
    DELETE: 'text-red-400',
    PATCH: 'text-cyan-400',
  }
  return map[m] || 'text-gray-400'
}
</script>

<template>
  <div
    class="group relative p-4 cursor-pointer transition-all duration-200 border-l-[3px]"
    :class="[
      props.selected
        ? 'bg-gray-800/80 border-primary-500'
        : 'bg-transparent border-transparent hover:bg-gray-800/40 hover:border-gray-700',
    ]"
    @click="emit('select', request)"
  >
    <!-- Header -->
    <div class="flex justify-between items-center mb-1.5">
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700"
          :class="methodColor(request.method)"
        >
          {{ request.method }}
        </span>
        <span
          v-if="bodySize > 0"
          class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 font-mono"
        >
          <FormatBytes :value="bodySize" />
        </span>
      </div>
      <NuxtTime
        :datetime="request.createdAt"
        title
        class="text-[11px] text-gray-500 font-medium whitespace-nowrap"
      />
    </div>

    <!-- Details -->
    <div class="flex items-center gap-3 pl-1">
      <div class="text-[11px] font-mono text-gray-500 truncate flex-1 flex items-center gap-2">
        <UIcon
          name="i-lucide-hash"
          class="w-3 h-3 text-gray-600"
        />
        <span class="text-gray-400 group-hover:text-gray-300 transition-colors">
          {{ request.id.split('-').pop() }}
        </span>
      </div>

      <!-- Indicators -->
      <div class="flex items-center gap-2">
        <UIcon
          v-if="Object.keys(request.queryParams).length > 0"
          name="i-lucide-search"
          class="w-3 h-3 text-gray-600"
        />
        <UIcon
          v-if="Object.keys(request.headers).length > 0"
          name="i-lucide-align-justify"
          class="w-3 h-3 text-gray-600"
        />
      </div>
    </div>
  </div>
</template>
