<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const { $trpc } = useNuxtApp()
const webhookId = route.params.id as string

// Copy functionality
const { copy: copyUrl, copied: urlCopied } = useClipboard()
const { copy: copyCurl, copied: curlCopied } = useClipboard()

// Fetch requests list
const { data, refresh } = await useAsyncData(
  `webhook-${webhookId}`,
  () => $trpc.webhook.init.query({ webhookId }),
)

const requests = computed(() => data.value?.history || [])

// Get selected request ID from query param
const selectedRequestId = computed(() => {
  const r = route.query.r
  return typeof r === 'string' ? r : null
})

// Fetch selected request details
const { data: selectedRequest } = await useAsyncData(
  () => `request-${selectedRequestId.value || 'none'}`,
  async () => {
    if (!selectedRequestId.value) {
      return null
    }
    return await $trpc.webhook.get.query({ requestId: selectedRequestId.value })
  },
  {
    watch: [selectedRequestId],
    default: () => null,
  },
)

// Endpoint URL
const endpointUrl = computed(() => {
  try {
    const requestUrl = useRequestURL()
    return `${requestUrl.origin}/api/h/${webhookId}`
  }
  catch {
    return `/api/h/${webhookId}`
  }
})

// Curl example
const curlExample = computed(() => {
  return `curl -X POST ${endpointUrl.value} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello webhook!"}'`
})

function copyWebhookUrl() {
  copyUrl(endpointUrl.value)
}

function copyCurlExample() {
  copyCurl(curlExample.value)
}

function selectRequest(requestId: string) {
  router.push({ query: { r: requestId } })
}

type BadgeColor = 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'

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
  <div class="h-screen flex flex-col bg-gray-950">
    <!-- Header with copy buttons -->
    <header class="border-b border-gray-800 p-4 bg-gray-900">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-bolt"
            class="text-primary-500 text-xl"
          />
          <h1 class="font-bold text-white">
            Webhook Inspector
          </h1>
        </div>

        <div class="flex items-center gap-2 flex-1">
          <UInput
            :model-value="endpointUrl"
            readonly
            icon="i-lucide-link"
            class="flex-1 max-w-md"
          />
          <UButton
            :color="urlCopied ? 'success' : 'neutral'"
            variant="ghost"
            icon="i-lucide-clipboard"
            @click="copyWebhookUrl"
          >
            {{ urlCopied ? 'Copied!' : 'Copy URL' }}
          </UButton>

          <UInput
            :model-value="curlExample"
            readonly
            icon="i-lucide-terminal"
            class="flex-1 max-w-md"
          />
          <UButton
            :color="curlCopied ? 'success' : 'neutral'"
            variant="ghost"
            icon="i-lucide-clipboard"
            @click="copyCurlExample"
          >
            {{ curlCopied ? 'Copied!' : 'Copy cURL' }}
          </UButton>

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
            Requests ({{ requests.length }})
          </h2>
        </div>

        <div
          v-if="requests.length === 0"
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
          <div
            v-for="req in requests"
            :key="req.id"
            class="p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            :class="{
              'bg-gray-800 border-l-4 border-l-primary-500': selectedRequestId === req.id,
            }"
            @click="selectRequest(req.id)"
          >
            <div class="flex justify-between items-center mb-1">
              <UBadge
                :color="methodColor(req.method)"
                variant="subtle"
                size="xs"
              >
                {{ req.method }}
              </UBadge>
              <span class="text-xs text-gray-500">
                {{ new Date(req.createdAt).toLocaleTimeString() }}
              </span>
            </div>
            <div class="text-xs text-gray-400 truncate font-mono">
              {{ req.url }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Request Details -->
      <div
        v-if="selectedRequest"
        class="flex-1 overflow-y-auto bg-gray-950 p-6"
      >
        <div class="mb-6">
          <h2 class="text-xl font-bold text-white mb-2">
            Request Details
          </h2>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <UBadge
              :color="methodColor(selectedRequest.method)"
              variant="subtle"
            >
              {{ selectedRequest.method }}
            </UBadge>
            <span class="font-mono">{{ selectedRequest.id }}</span>
            <span class="text-gray-500">
              • {{ new Date(selectedRequest.createdAt).toLocaleString() }}
            </span>
          </div>
        </div>

        <div class="space-y-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                URL
              </h3>
            </template>
            <pre class="text-sm font-mono text-gray-300 break-all">{{ selectedRequest.url }}</pre>
          </UCard>

          <UCard v-if="selectedRequest.headers">
            <template #header>
              <h3 class="font-semibold">
                Headers
              </h3>
            </template>
            <pre class="text-xs font-mono text-gray-300 overflow-x-auto">{{ JSON.parse(selectedRequest.headers || '{}') }}</pre>
          </UCard>

          <UCard v-if="selectedRequest.queryParams">
            <template #header>
              <h3 class="font-semibold">
                Query Parameters
              </h3>
            </template>
            <pre class="text-xs font-mono text-gray-300 overflow-x-auto">{{ JSON.parse(selectedRequest.queryParams || '{}') }}</pre>
          </UCard>

          <UCard v-if="selectedRequest.body">
            <template #header>
              <h3 class="font-semibold">
                Body
              </h3>
            </template>
            <pre class="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{{ selectedRequest.body }}</pre>
          </UCard>
        </div>
      </div>

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
</template>
