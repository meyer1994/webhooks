<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'

const route = useRoute()
const { $trpc } = useNuxtApp()

const webhookId = ref(route.params.id as string)
const requestId = ref(route.query.r)

watch(() => route.query.r, n => requestId.value = n)
watch(() => route.params.id, n => webhookId.value = n as string)

// Fetch requests list
const { data, refresh } = await useAsyncData(
  `webhook-${webhookId.value}`,
  () => $trpc.webhook.list.query({ webhookId: webhookId.value }),
  { watch: [webhookId], default: () => ({ requests: [] }) },
)

const { pause } = useIntervalFn(() => refresh(), 5_000)
useTimeoutFn(() => pause(), 8 * 60 * 1_000) // stop polling after 8 minutes

const selectedRequest = computed(
  () => data.value?.requests.find(r => r.id === requestId.value),
)

const url = useRequestURL()
const endpoint = `${url.origin}/api/h/${webhookId.value}`

const CURL
  = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello webhook!"}'`
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-950">
    <!-- Header with copy buttons -->
    <header class="border-b border-gray-800 p-4 bg-gray-900">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-bolt"
            class="text-primary-500 text-xl"
          />
          <ULink to="/">
            <h1 class="font-bold text-white">
              Webhook Inspector
            </h1>
          </ULink>
        </div>

        <div class="flex items-center gap-2 flex-1">
          <UInput
            :model-value="endpoint"
            readonly
            icon="i-lucide-link"
            class="flex-1 max-w-md"
          />
          <UseClipboard v-slot="{ copy, copied }">
            <UButton
              :color="copied ? 'success' : 'neutral'"
              variant="ghost"
              icon="i-lucide-clipboard"
              @click="() => copy(endpoint)"
            >
              {{ copied ? 'Copied!' : 'Copy URL' }}
            </UButton>
          </UseClipboard>

          <UInput
            :model-value="CURL"
            readonly
            icon="i-lucide-terminal"
            class="flex-1 max-w-md"
          />
          <UseClipboard v-slot="{ copy, copied }">
            <UButton
              :color="copied ? 'success' : 'neutral'"
              variant="ghost"
              icon="i-lucide-clipboard"
              @click="() => copy(CURL)"
            >
              {{ copied ? 'Copied!' : 'Copy cURL' }}
            </UButton>
          </UseClipboard>

          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            @click="() => refresh()"
          >
            Refresh
          </UButton>
        </div>
      </div>
    </header>

    <!-- Main content: Sidebar + Details -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Requests List -->
      <div class="w-80 border-r border-gray-800 overflow-y-auto bg-gray-900">
        <div class="p-4 border-b border-gray-800">
          <h2 class="font-semibold text-white">
            Requests ({{ data.requests.length }})
          </h2>
        </div>

        <div
          v-if="data.requests.length === 0"
          class="p-8 text-center text-gray-500 text-sm"
        >
          <UIcon
            name="i-lucide-inbox"
            class="text-4xl mb-2 mx-auto"
          />
          <p>No requests yet</p>
        </div>

        <div
          v-else
          class="divide-y divide-gray-800"
        >
          <AppWebhookListItem
            v-for="req in data.requests"
            :key="req.id"
            :request="req"
            :selected="requestId === req.id"
            @select="req => $router.replace({ query: { r: req.id } })"
          />
        </div>
      </div>

      <!-- Right Side: Request Details -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Request Timeline Chart -->
        <div
          v-if="data.requests && data.requests.length > 0"
          class="p-6 border-b border-gray-800"
        >
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Request Timeline
              </h3>
            </template>
            <ChartRequestTimes :items="data.requests" />
          </UCard>
        </div>

        <!-- Request Details -->
        <AppWebhookRequestView
          v-if="selectedRequest"
          :request="selectedRequest"
        />

        <div
          v-else
          class="flex-1 flex items-center justify-center text-gray-500"
        >
          <div class="text-center">
            <UIcon
              name="i-lucide-wand-sparkles"
              class="text-4xl mb-2"
            />
            <p>Select a request to view details</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
