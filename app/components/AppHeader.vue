<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'

const route = useRoute()
const url = useRequestURL()

const wid = computed(() => route.params.wid as string)
const endpoint = computed(() => `${url.origin}/api/h/${wid.value}`)

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
            Webhook Inspector
          </ULink>
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
      <UButton
        size="sm"
        :color="$route.path.endsWith('/s') ? 'primary' : 'neutral'"
        variant="outline"
        :icon="$route.query.config ? 'i-lucide-settings' : 'i-lucide-settings-2'"
        label="Config"
        :to="`/w/${wid}/s`"
      />
    </template>
  </UHeader>
</template>
