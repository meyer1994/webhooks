<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'
import z from 'zod'

const schemaParams = z.object({
  id: z.uuidv7(),
})

const schemaQuery = z.object({
  r: z.uuidv7().optional(),
  config: z.enum(['true', 'false']).optional(),
  filter: z.string().optional(),
})

definePageMeta({
  validate: (route) => {
    schemaParams.parse(route.params)
    schemaQuery.parse(route.query)
    return true
  },
})

const { $trpc } = useNuxtApp()

const route = useRoute()

const { data, refresh, status } = await useAsyncData(
  () => `/webhook/${route.params.id}?filter=${route.query.filter}`,
  () => $trpc.webhook.list.query({
    webhookId: route.params.id as string,
    filter: route.query.filter as string | undefined,
  }),
)

const { data: dataRequest } = await useAsyncData(
  () => `/webhook/${route.params.id}/request/${route.query.r}`,
  async () => {
    if (!route.query.r) return undefined
    return await $trpc.webhook.get.query({
      requestId: route.query.r as string,
      webhookId: route.params.id as string,
    })
  },
)

const { pause } = useIntervalFn(() => refresh(), 5_000)
useTimeoutFn(() => pause(), 8 * 60 * 1_000) // stop polling after 8 minutes

const onUpdateFilter = useDebounceFn(async (value: string) => await navigateTo({
  replace: false,
  query: { ...route.query, filter: value || undefined },
}), 300)

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
              :label="`/h/${$route.params.id}`"
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

      <template #right>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          :icon="$route.query.config ? 'i-lucide-settings' : 'i-lucide-settings-2'"
          label="Config"
          @click.prevent="async () => {
            await navigateTo({
              replace: false,
              query: {
                ...$route.query,
                config: $route.query.config === 'true' ? undefined : 'true',
              },
            })
          }"
        />
      </template>
    </UHeader>

    <UMain class="flex">
      <!-- left bar -->
      <div class="flex flex-col gap-2">
        <!-- title -->
        <div class="p-2 grid grid-cols-2 gap-2">
          <h2 class="text-lg font-bold col-span-1">
            Requests ({{ data?.requests.length }})
          </h2>

          <div class="col-span-1 flex justify-end">
            <UButton
              size="sm"
              class="col-span-1"
              color="primary"
              variant="ghost"
              :loading="status === 'pending'"
              icon="i-lucide-refresh-cw"
              @click="() => refresh()"
            />
          </div>

          <UInput
            placeholder="Search requests"
            size="sm"
            variant="ghost"
            color="neutral"
            class="w-full col-span-2"
            :value="route.query.filter"
            @update:model-value="onUpdateFilter(String($event))"
          />
        </div>

        <!-- requests list -->
        <div class="h-full overflow-y-auto">
          <ListItemRequest
            v-for="i in data?.requests"
            :key="i.id"
            :request="i"
            class="border-l-4 border-r-8 border-transparent hover:border-l-primary-500 cursor-pointer p-2"
            @click="async () => await navigateTo({
              query: { ...$route.query, r: i.id },
              // if the request is already selected, replace the current route
              // so the back button works. if there is already a request selected,
              // replace the current route so the back button still goes back to
              // the 'no request selected' state. when clicking through requests,
              // it won't pollute the history with a bunch of urls
              replace: !!$route.query.r,
            })"
            @delete="async () => {
              await $trpc.webhook.delete.mutate({
                requestId: i.id,
                webhookId: $route.params.id as string,
              })
              await refresh()

              if ($route.query.r === i.id) {
                return await navigateTo({
                  replace: false,
                  query: { ...$route.query, r: undefined },
                })
              }
            }"
          />
        </div>
      </div>

      <div class="flex-1">
        <template v-if="$route.query.config === 'true'">
          <DetailsWebhookConfig
            v-if="data"
            :webhook="data"
          />
          <p v-else>
            No webhook found
          </p>
        </template>
        <template v-else>
          <DetailsRequest
            v-if="dataRequest"
            class="p-2"
            :request="dataRequest"
          />

          <p v-else>
            No request selected
          </p>
        </template>
      </div>
    </UMain>
  </div>
</template>
