<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'

const route = useRoute()
const url = useRequestURL()

const wid = computed(() => route.params.wid as string)
const endpoint = computed(() => `${url.origin}/api/h/${wid.value}`)

const { $trpc } = useNuxtApp()

const { data: config } = await useAsyncData(
  () => `/w/${route.params.wid}/config`,
  async () => await $trpc.webhook.config.query({
    webhookId: route.params.wid as string,
  }),
  {
    default: () => null,
  },
)

const CURL = computed(() =>
  `curl -X POST ${endpoint.value} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello webhook!"}'`,
)
</script>

<template>
  <UHeader :ui="{ container: '!mx-0 !px-4 !max-w-full' }">
    <template #left>
      <div class="flex items-center gap-4">
        <!-- title -->
        <div>
          <ULink
            to="/"
            class="flex items-center gap-2 text-lg font-bold"
          >
            <UIcon
              name="i-lucide-bolt"
              class="text-primary-500 text-lg"
            />
            webhooks
          </ULink>
        </div>

        <!-- webhook name or url -->
        <div
          v-if="config?.name"
          class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-900/50 border border-gray-800"
        >
          <span class="text-sm font-medium text-gray-300">{{ config.name }}</span>
        </div>

        <!-- url -->
        <UseClipboard
          v-slot="{ copy, copied }"
          :source="endpoint"
        >
          <UButton
            :label="`/h/${wid}`"
            color="neutral"
            variant="outline"
            size="md"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            class="font-mono cursor-pointer font-medium"
            :title="endpoint"
            @click="copy(endpoint)"
          />
        </UseClipboard>

        <!-- curl -->
        <UseClipboard
          v-slot="{ copy, copied }"
          :source="CURL"
        >
          <UButton
            size="md"
            color="neutral"
            variant="outline"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-terminal'"
            class="font-mono cursor-pointer font-medium"
            :label="copied ? 'Copied!' : 'Copy cURL'"
            :title="CURL"
            @click="copy(CURL)"
          />
        </UseClipboard>
      </div>
    </template>

    <template #right>
      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          :color="$route.path.endsWith('/c') ? 'primary' : 'neutral'"
          variant="outline"
          icon="i-lucide-line-chart"
          label="Charts"
          :to="`/w/${wid}/c`"
        />

        <UButton
          size="sm"
          :color="$route.path.endsWith('/s') ? 'primary' : 'neutral'"
          variant="outline"
          :icon="$route.path.endsWith('/s') ? 'i-lucide-settings' : 'i-lucide-settings-2'"
          label="Config"
          :to="`/w/${wid}/s`"
        />
      </div>
    </template>
  </UHeader>
</template>
