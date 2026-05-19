<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'

const { $trpc } = useNuxtApp()
const requestURL = useRequestURL()

const webhookId = ref<string | null>(null)
const isCreating = ref(true)

const endpointUrl = computed(() =>
  webhookId.value
    ? `${requestURL.protocol}//${requestURL.host}/api/h/${webhookId.value}`
    : '',
)

onMounted(async () => {
  try {
    const result = await $trpc.webhook.create.mutate()
    webhookId.value = result.id
  }
  catch (error) {
    console.error('Failed to create webhook:', error)
  }
  finally {
    isCreating.value = false
  }
})

const features = [
  {
    icon: 'i-lucide-terminal',
    title: 'Full request inspection',
    description: 'Headers, body, query params, IP address, and Cloudflare geo-location for every request.',
  },
  {
    icon: 'i-lucide-play',
    title: 'Replay & cURL export',
    description: 'Resend any captured request with one click. Copy as a cURL command for terminal use.',
  },
  {
    icon: 'i-lucide-bar-chart-2',
    title: 'Analytics',
    description: 'Request frequency, HTTP method breakdown, and geographic distribution — all charted.',
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: 'Configurable responses',
    description: 'Control the status code, Content-Type, body, and response delay per endpoint.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-zinc-950">
    <UPageHero
      headline="WEBHOOKS"
      title="Your endpoint is live."
      description="A unique URL was created for you. Send any HTTP request to it and inspect every detail here."
    >
      <template #body>
        <!-- Terminal URL display -->
        <div class="w-full max-w-xl mx-auto mt-4">
          <div class="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden font-mono text-sm">
            <div class="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span class="ml-2 text-xs text-zinc-500">endpoint</span>
            </div>

            <div class="flex items-center gap-3 px-4 py-3">
              <span class="text-primary-500 shrink-0 text-xs font-bold">POST</span>
              <span
                v-if="isCreating"
                class="text-zinc-500 flex-1 animate-pulse"
              >generating...</span>
              <span
                v-else
                class="text-zinc-200 flex-1 truncate"
              >{{ endpointUrl }}</span>
              <UseClipboard
                v-if="!isCreating"
                v-slot="{ copy, copied }"
                :source="endpointUrl"
              >
                <UButton
                  :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                  :color="copied ? 'primary' : 'neutral'"
                  variant="ghost"
                  size="xs"
                  @click="copy()"
                />
              </UseClipboard>
            </div>
          </div>
        </div>
      </template>

      <template #links>
        <UButton
          v-if="webhookId"
          :to="`/w/${webhookId}`"
          color="primary"
          size="lg"
          icon="i-lucide-arrow-right"
          trailing
        >
          Open Inspector
        </UButton>
        <UButton
          v-else
          color="primary"
          size="lg"
          loading
          disabled
        >
          Open Inspector
        </UButton>
      </template>
    </UPageHero>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UPageCard
          v-for="feature in features"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
          spotlight
          variant="subtle"
        />
      </div>
    </div>
  </div>
</template>
