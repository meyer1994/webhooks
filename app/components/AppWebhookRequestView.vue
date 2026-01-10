<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['get']

type Props = {
  request: Request
}

const props = defineProps<Props>()

const formattedBody = computed(() => {
  if (!props.request.body) return ''
  if (typeof props.request.body !== 'object') return props.request.body
  return JSON.stringify(props.request.body, null, 2)
})

const isBodyJson = computed(() => {
  return props.request.body && typeof props.request.body === 'object'
})

const bodySize = computed(() => {
  if (!props.request.body) return 0
  const content = typeof props.request.body === 'object'
    ? JSON.stringify(props.request.body)
    : props.request.body
  return new Blob([content]).size
})
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-gray-950 p-8">
    <!-- Header Info -->
    <div class="mb-8 pb-6 border-b border-gray-800/50">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2 font-mono tracking-tight">
            Request Details
          </h2>

          <div class="flex items-center gap-3 text-sm">
            <!-- method -->
            <span
              class="px-2.5 py-1 rounded-md text-xs font-bold font-mono border"
              :class="{
                'text-green-400 bg-green-400/10 border-green-400/20': request.method === 'GET',
                'text-blue-400 bg-blue-400/10 border-blue-400/20': request.method === 'POST',
                'text-orange-400 bg-orange-400/10 border-orange-400/20': request.method === 'PUT',
                'text-red-400 bg-red-400/10 border-red-400/20': request.method === 'DELETE',
                'text-cyan-400 bg-cyan-400/10 border-cyan-400/20': request.method === 'PATCH',
                'text-gray-400 bg-gray-400/10 border-gray-400/20': request.method !== 'GET' && request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'DELETE' && request.method !== 'PATCH',
              }"
            >
              {{ request.method }}
            </span>

            <!-- request id -->
            <span class="font-mono text-gray-500 text-xs">
              {{ request.id.split('-').pop() }}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end">
          <!-- created at -->
          <NuxtTime
            :datetime="request.createdAt"
            hour="2-digit"
            minute="2-digit"
            second="2-digit"
            class="text-sm font-medium text-gray-300"
          />
          <NuxtTime
            :datetime="request.createdAt"
            year="numeric"
            month="2-digit"
            day="2-digit"
            class="text-xs text-gray-500"
          />
        </div>
      </div>

      <!-- URL Bar -->
      <div class="group relative bg-gray-900/50 rounded-lg border border-gray-800 p-3 flex items-center justify-between hover:border-gray-700 transition-colors">
        <code class="text-sm text-primary-400 font-mono break-all">{{ request.url }}</code>
        <UseClipboard
          v-slot="{ copy, copied }"
          :source="request.url"
        >
          <UButton
            :color="copied ? 'success' : 'neutral'"
            variant="ghost"
            size="xs"
            icon="i-lucide-copy"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="copy()"
          />
        </UseClipboard>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Network / Geo -->
      <div
        v-if="request.ipAddress || Object.keys(request.cfProperties).length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div class="bg-gray-900/30 rounded-xl border border-gray-800/50 p-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <UIcon name="i-lucide-globe" /> Location
          </h3>
          <div
            v-if="Object.keys(request.cfProperties).length > 0"
            class="space-y-2"
          >
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ request.cfProperties.flag || '🌍' }}</span>
              <div>
                <div class="text-sm text-white font-medium">
                  {{ request.cfProperties.city }}, {{ request.cfProperties.country }}
                </div>
                <div class="text-xs text-gray-500 font-mono">
                  {{ request.cfProperties.region }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/30 rounded-xl border border-gray-800/50 p-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <UIcon name="i-lucide-network" /> Network
          </h3>
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">IP</span>
              <span class="text-gray-300 font-mono">{{ request.ipAddress }}</span>
            </div>
            <div
              v-if="request.cfProperties?.asn"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-500">ASN</span>
              <span class="text-gray-300 font-mono">{{ request.cfProperties.asn }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Headers -->
      <div class="section-container">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Headers
          </h3>
          <UseClipboard
            v-if="request.headers"
            v-slot="{ copy, copied }"
            :source="JSON.stringify(request.headers, null, 2)"
          >
            <UButton
              :color="copied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-copy"
              @click="copy()"
            >
              Copy JSON
            </UButton>
          </UseClipboard>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div class="max-h-60 overflow-y-auto custom-scrollbar">
            <table class="w-full text-left text-sm font-mono">
              <tbody>
                <tr
                  v-for="(value, key) in request.headers"
                  :key="key"
                  class="border-b border-gray-800/50 last:border-0 hover:bg-white/5"
                >
                  <td class="py-2 px-4 text-primary-400 w-1/3 align-top border-r border-gray-800/50">
                    {{ key }}
                  </td>
                  <td class="py-2 px-4 text-gray-300 break-all">
                    {{ value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Query Params -->
      <div
        v-if="Object.keys(request.queryParams).length > 0"
        class="section-container"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Query Parameters
          </h3>
          <UseClipboard
            v-slot="{ copy, copied }"
            :source="JSON.stringify(request.queryParams, null, 2)"
          >
            <UButton
              :color="copied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-copy"
              @click="copy()"
            >
              Copy JSON
            </UButton>
          </UseClipboard>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table class="w-full text-left text-sm font-mono">
            <tbody>
              <tr
                v-for="(value, key) in request.queryParams"
                :key="key"
                class="border-b border-gray-800/50 last:border-0 hover:bg-white/5"
              >
                <td class="py-2 px-4 text-primary-400 w-1/3 align-top border-r border-gray-800/50">
                  {{ key }}
                </td>
                <td class="py-2 px-4 text-gray-300 break-all">
                  {{ value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Body -->
      <div
        v-if="request.body"
        class="section-container"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Request Body
            </h3>
            <FormatBytes
              class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono"
              :value="bodySize"
            />
            <span
              v-if="isBodyJson"
              class="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono"
            >JSON</span>
          </div>
          <UseClipboard
            v-slot="{ copy, copied }"
            :source="request.body || ''"
          >
            <UButton
              :color="copied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-copy"
              @click="copy()"
            >
              Copy Raw
            </UButton>
          </UseClipboard>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 font-mono text-sm text-gray-300 overflow-x-auto">
          <pre>{{ formattedBody }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
