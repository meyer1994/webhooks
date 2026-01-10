<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'

const route = useRoute()
const { $trpc } = useNuxtApp()

// Fetch requests list
const { data, refresh } = await useAsyncData(
  () => `webhook-${route.params.id}`,
  () => $trpc.webhook.list.query({ webhookId: route.params.id as string }),
  { watch: [() => route.params.id], default: () => ({ requests: [] }) },
)

const { data: dataRequest } = await useAsyncData(
  () => `webhook-request-${route.query.r}`,
  () => $trpc.webhook.get.query({
    requestId: route.query.r as string,
    webhookId: route.params.id as string,
  }),
  {
    immediate: !!route.query.r,
    watch: [() => route.query.r, () => route.params.id],
  },
)

const { pause } = useIntervalFn(() => refresh(), 5_000)
useTimeoutFn(() => pause(), 8 * 60 * 1_000) // stop polling after 8 minutes

const url = useRequestURL()
const endpoint = `${url.origin}/api/h/${route.params.id}`

const CURL
  = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello webhook!"}'`
</script>

<template>
  <div class="flex flex-col">
    <!-- Header -->
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
                icon=""
              />
              Webhook Inspector
            </ULink>
          </div>

          <!-- url -->
          <UseClipboard v-slot="{ copy, copied }">
            <UButton
              :label="`/h/${route.params.id}`"
              color="neutral"
              variant="outline"
              size="md"
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              class="font-mono cursor-pointer font-medium"
              :title="endpoint"
              @click="copy(endpoint)"
            />
          </UseClipboard>

          <UseClipboard v-slot="{ copy, copied }">
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
    </UHeader>

    <UMain class="flex">
      <!-- left bar -->
      <div class="flex flex-col gap-2">
        <!-- title -->
        <div class="p-2 flex items-center justify-between gap-2">
          <h2 class="text-lg font-bold">
            Requests ({{ data?.requests.length }})
          </h2>

          <UButton
            size="sm"
            color="primary"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="() => refresh()"
          />
        </div>

        <!-- requests list -->
        <div class="h-full overflow-y-auto">
          <ListItemRequest
            v-for="i in data?.requests"
            :key="i.id"
            :request="i"
            class="border-l-4 border-r-8 border-transparent hover:border-l-primary-500 cursor-pointer p-2"
            @click="$router.replace({ query: { r: i.id } })"
            @delete="async () => {
              await $trpc.webhook.delete.mutate({ requestId: i.id, webhookId: route.params.id as string })
              await refresh()
            }"
          />
        </div>
      </div>

      <div class="flex-1">
        <DetailsRequest
          v-if="dataRequest"
          class="p-2"
          :request="dataRequest"
        />
      </div>
    </UMain>
  </div>
</template>
