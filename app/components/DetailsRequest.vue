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
  <div>
    <!-- row 1 - main details -->
    <div>
      <div class="flex items-start justify-between mb-4">
        <!-- right side -->
        <div class="flex flex-col gap-2">
          <!-- title -->
          <h2 class="text-2xl font-bold font-mono tracking-tight">
            Request Details
          </h2>

          <!-- info -->
          <div class="flex items-center gap-4 text-sm">
            <!-- method -->
            <span
              class="px-2.5 py-1 rounded-md text-xs font-bold font-mono border"
              :class="{
                'text-green-400 bg-green-400/10 border-green-400/20': request.method === 'GET',
                'text-blue-400 bg-blue-400/10 border-blue-400/20': request.method === 'POST',
                'text-orange-400 bg-orange-400/10 border-orange-400/20': request.method === 'PUT',
                'text-red-400 bg-red-400/10 border-red-400/20': request.method === 'DELETE',
                'text-cyan-400 bg-cyan-400/10 border-cyan-400/20': request.method === 'PATCH',
                'text-gray-400 bg-gray-400/10 border-gray-400/20': !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
              }"
            >
              {{ request.method }}
            </span>

            <!-- request id -->
            <span class="font-mono text-gray-500 text-xs">
              #{{ request.id.split('-').pop() }}
            </span>
          </div>
        </div>

        <!-- left side - time -->
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
    </div>

    <!-- row 2 - network / geo -->
    <div class="space-y-6">
      <!-- Network / Geo -->
      <div
        v-if="request.ipAddress || Object.keys(request.cfProperties).length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <!-- location -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-md font-semibold">
              <UIcon name="i-lucide-globe" />
              LOCATION
            </div>
          </template>

          <div class="flex items-center gap-4">
            <span class="text-2xl">{{ request.cfProperties.flag || '🌍' }}</span>
            <div class="flex flex-col gap-1">
              <div class="text-sm text-white font-medium">
                {{ request.cfProperties.city }}, {{ request.cfProperties.country }}
              </div>
              <div class="text-xs text-gray-500 font-mono">
                {{ request.cfProperties.region }}
              </div>
            </div>
          </div>
        </UCard>

        <!-- ip + asn -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-md font-semibold">
              <UIcon name="i-lucide-network" />
              NETWORK
            </div>
          </template>

          <div class="space-y-2">
            <!-- ip -->
            <div class="flex justify-between text-sm">
              <span>IP</span>
              <span class=" font-mono">{{ request.ipAddress }}</span>
            </div>

            <!-- asn -->
            <div
              v-if="request.cfProperties?.asn"
              class="flex justify-between text-sm"
            >
              <span>ASN</span>
              <span class=" font-mono">{{ request.cfProperties.asn }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Headers -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-md font-semibold">
              <UIcon name="i-lucide-list" />
              HEADERS
            </div>

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
        </template>

        <div class="max-h-60 overflow-y-auto">
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
      </UCard>

      <!-- Query Params -->
      <UCard v-if="Object.keys(request.queryParams).length > 0">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-md font-semibold">
              <UIcon name="i-lucide-search" />
              QUERY PARAMETERS
            </div>

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
        </template>

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
      </UCard>

      <!-- Body -->
      <UCard v-if="request.body">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-md font-semibold">
              <UIcon name="i-lucide-file-code" />
              REQUEST BODY
              <div class="flex items-center gap-2 ml-2">
                <FormatBytes :model-value="bodySize" />
                <span
                  v-if="isBodyJson"
                  class="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono"
                >JSON</span>
              </div>
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
        </template>

        <div class="font-mono text-sm text-gray-300 overflow-x-auto">
          <pre>{{ formattedBody }}</pre>
        </div>
      </UCard>
    </div>
  </div>
</template>
