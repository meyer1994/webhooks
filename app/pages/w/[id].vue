<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

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

const { copy: copyEndpoint, copied: endpointCopied } = useClipboard()
const { copy: copyCurl, copied: curlCopied } = useClipboard()

const chartTabs = [
  { label: 'Request Volume', slot: 'volume' },
  { label: 'Network Stats', slot: 'network' },
]
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-950 overflow-hidden text-gray-200">
    <!-- Glass Header -->
    <header class="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
      <div class="flex items-center gap-4">
        <ULink
          to="/"
          class="flex items-center gap-2 group"
        >
          <div class="bg-primary-500/10 p-1.5 rounded-lg group-hover:bg-primary-500/20 transition-colors">
            <UIcon
              name="i-lucide-bolt"
              class="text-primary-500 text-lg"
            />
          </div>
          <h1 class="font-bold text-white tracking-tight hidden sm:block">
            Webhook Inspector
          </h1>
        </ULink>
        <div class="h-6 w-px bg-gray-800 mx-2 hidden sm:block" />
        <div class="flex items-center gap-2">
          <div class="relative group">
            <div
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-md border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
              @click="copyEndpoint(endpoint)"
            >
              <UIcon
                name="i-lucide-link"
                class="text-gray-400 w-4 h-4"
              />
              <span class="text-sm font-mono text-gray-300 max-w-[200px] truncate">{{ endpoint }}</span>
            </div>
            <div
              v-if="endpointCopied"
              class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded shadow-lg animate-fade-in-up"
            >
              Copied!
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-lucide-terminal"
          class="hidden sm:flex"
          @click="copyCurl(CURL)"
        >
          {{ curlCopied ? 'Copied!' : 'Copy cURL' }}
        </UButton>

        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          :loading="false"
          icon="i-lucide-refresh-cw"
          @click="() => refresh()"
        >
          Refresh
        </UButton>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-80 flex flex-col border-r border-gray-800 bg-gray-900/30 shrink-0">
        <div class="p-4 border-b border-gray-800/50 flex items-center justify-between">
          <h2 class="font-semibold text-sm text-gray-400 uppercase tracking-wider">
            Requests
          </h2>
          <span class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{{ data.requests.length }}</span>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div
            v-if="data.requests.length === 0"
            class="h-64 flex flex-col items-center justify-center text-gray-500 text-sm p-6 text-center"
          >
            <div class="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
              <UIcon
                name="i-lucide-inbox"
                class="text-xl opacity-50"
              />
            </div>
            <p class="font-medium">
              Waiting for requests...
            </p>
            <p class="text-xs mt-1 text-gray-600">
              Send a POST request to the endpoint URL to see it appear here.
            </p>
          </div>

          <div
            v-else
            class="divide-y divide-gray-800/50"
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
      </aside>

      <!-- Main Panel -->
      <main class="flex-1 flex flex-col bg-gray-950 relative overflow-hidden">
        <!-- Chart Section -->
        <div
          v-if="data.requests && data.requests.length > 0"
          class="shrink-0 border-b border-gray-800 bg-gray-900/10 p-4"
        >
          <div class="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
            <UTabs :items="chartTabs">
              <template #volume>
                <div class="mt-4 h-64">
                  <ChartRequestTimes :items="data.requests" />
                </div>
              </template>
              <template #network>
                <div class="mt-4 h-64">
                  <ChartNetworkStats :items="data.requests" />
                </div>
              </template>
            </UTabs>
          </div>
        </div>

        <!-- Detail View -->
        <AppWebhookRequestView
          v-if="selectedRequest"
          :request="selectedRequest"
          class="h-full"
        />

        <!-- Empty State -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-gray-500"
        >
          <div class="w-24 h-24 rounded-full bg-gray-900/50 flex items-center justify-center mb-6 animate-pulse">
            <UIcon
              name="i-lucide-activity"
              class="text-4xl text-gray-700"
            />
          </div>
          <h3 class="text-xl font-medium text-gray-300 mb-2">
            Ready to Inspect
          </h3>
          <p class="max-w-xs text-center text-gray-500">
            Select a request from the sidebar to view its details, headers, and body.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
