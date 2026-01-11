<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'
import * as z from 'zod'

const schemaParams = z.object({
  wid: z.uuidv7(),
  rid: z.uuidv7(),
})

definePageMeta({
  validate: (route) => {
    const r0 = schemaParams.safeParse(route.params)
    if (!r0.success) throw createError({ statusCode: 400, message: r0.error.message })
    return true
  },
})

const { $trpc } = useNuxtApp()

const route = useRoute()
const params = route.params as z.output<typeof schemaParams>

const data = await $trpc.webhook.get.query({
  requestId: params.rid,
  webhookId: params.wid,
})

const formattedBody = computed(() => {
  if (!data.body) return ''
  if (typeof data.body !== 'object') return data.body
  return JSON.stringify(data.body, null, 2)
})

const isBodyJson = computed(() => {
  return data.body && typeof data.body === 'object'
})

const bodySize = computed(() => {
  if (!data.body) return 0
  const content = typeof data.body === 'object'
    ? JSON.stringify(data.body)
    : data.body
  return new Blob([content]).size
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- row 1 - main details -->
    <UCard>
      <template #header>
        <div class="flex items-start justify-between">
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
                  'text-green-400 bg-green-400/10 border-green-400/20': data.method === 'GET',
                  'text-blue-400 bg-blue-400/10 border-blue-400/20': data.method === 'POST',
                  'text-orange-400 bg-orange-400/10 border-orange-400/20': data.method === 'PUT',
                  'text-red-400 bg-red-400/10 border-red-400/20': data.method === 'DELETE',
                  'text-cyan-400 bg-cyan-400/10 border-cyan-400/20': data.method === 'PATCH',
                  'text-gray-400 bg-gray-400/10 border-gray-400/20': !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(data.method),
                }"
              >
                {{ data.method }}
              </span>

              <!-- request id -->
              <span class="font-mono text-gray-500 text-xs">
                #{{ data.id?.split('-').pop() }}
              </span>
            </div>
          </div>

          <!-- left side - time -->
          <div class="flex flex-col items-end">
            <!-- created at -->
            <NuxtTime
              :datetime="data.createdAt || new Date()"
              hour="2-digit"
              minute="2-digit"
              second="2-digit"
              class="text-sm font-medium text-gray-300"
            />
            <NuxtTime
              :datetime="data.createdAt || new Date()"
              year="numeric"
              month="2-digit"
              day="2-digit"
              class="text-xs text-gray-500"
            />
          </div>
        </div>
      </template>
    </UCard>

    <!-- row 2 - network / geo -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- location -->
      <UCard v-if="data.cfProperties">
        <template #header>
          <div class="flex items-center gap-2 text-md font-semibold">
            <UIcon name="i-lucide-globe" />
            LOCATION
          </div>
        </template>

        <div class="flex items-center gap-4">
          <span class="text-2xl">{{ data.cfProperties.flag || '🌍' }}</span>
          <div class="flex flex-col gap-1">
            <div class="text-sm text-white font-medium">
              {{ data.cfProperties.city }}, {{ data.cfProperties.country }}
            </div>
            <div class="text-xs text-gray-500 font-mono">
              {{ data.cfProperties.region }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- ip + asn -->
      <UCard v-if="data.ipAddress || data.cfProperties?.asn">
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
            <span class=" font-mono">{{ data.ipAddress }}</span>
          </div>

          <!-- asn -->
          <div
            v-if="data.cfProperties?.asn"
            class="flex justify-between text-sm"
          >
            <span>ASN</span>
            <span class=" font-mono">{{ data.cfProperties.asn }}</span>
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
            v-if="data.headers"
            v-slot="{ copy, copied }"
            :source="JSON.stringify(data.headers, null, 2)"
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
              v-for="(value, key) in data.headers"
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
    <UCard v-if="Object.keys(data.queryParams).length > 0">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-md font-semibold">
            <UIcon name="i-lucide-search" />
            QUERY PARAMETERS
          </div>

          <UseClipboard
            v-slot="{ copy, copied }"
            :source="JSON.stringify(data.queryParams, null, 2)"
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
            v-for="(value, key) in data.queryParams"
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
    <UCard v-if="data.body">
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
            :source="data.body || ''"
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
</template>
