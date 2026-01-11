<script setup lang="ts">
import { UseClipboard } from '@vueuse/components'
import * as z from 'zod'

const schemaParams = z.object({
  wid: z.uuidv7(),
})

const schemaQuery = z.object({
  filter: z.string().optional(),
})

definePageMeta({
  validate: (route) => {
    const r0 = schemaParams.safeParse(route.params)
    if (!r0.success) throw createError({ statusCode: 400, message: r0.error.message })
    const r1 = schemaQuery.safeParse(route.query)
    if (!r1.success) throw createError({ statusCode: 400, message: r1.error.message })
    return true
  },
})

const { $trpc } = useNuxtApp()

const route = useRoute()
const params = route.params as z.output<typeof schemaParams>
const query = route.query as z.output<typeof schemaQuery>

const { data, refresh, status } = await useAsyncData(
  () => `/webhook/${params.wid}?filter=${query.filter}`,
  () => $trpc.webhook.list.query({
    filter: query.filter,
    webhookId: params.wid as string,
  }),
)

const { pause } = useIntervalFn(() => refresh(), 5_000)
useTimeoutFn(() => pause(), 8 * 60 * 1_000) // stop polling after 8 minutes

const onUpdateFilter = useDebounceFn(async (value: string) => await navigateTo({
  replace: false,
  query: { ...route.query, filter: value || undefined },
}), 300)

const url = useRequestURL()
const endpoint = `${url.origin}/api/h/${route.params.wid}`

const CURL
  = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello webhook!"}'`
</script>

<template>
  <UMain>
    <!-- header -->
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
              :label="`/h/${$route.params.wid}`"
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
          :color="$route.path.endsWith('/s') ? 'primary' : 'neutral'"
          variant="outline"
          :icon="$route.query.config ? 'i-lucide-settings' : 'i-lucide-settings-2'"
          label="Config"
          :to="`/w/${$route.params.wid}/s`"
        />
      </template>
    </UHeader>

    <!-- content -->
    <div class="grid grid-cols-12 gap-4 p-4">
      <!-- left -->
      <UCard
        class="col-span-4"
        :ui="{ body: '!p-0' }"
      >
        <template #header>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold">
                Requests ({{ data?.requests.length }})
              </h2>

              <UButton
                size="sm"
                color="primary"
                variant="ghost"
                :loading="status === 'pending'"
                icon="i-lucide-refresh-cw"
                @click="() => refresh()"
              />
            </div>

            <UInput
              placeholder="Search requests"
              icon="i-lucide-search"
              color="neutral"
              class="w-full"
              :value="route.query.filter"
              @update:model-value="onUpdateFilter(String($event))"
            />
          </div>
        </template>

        <!-- bottom -->
        <ListItemRequest
          v-for="i in data?.requests"
          :key="i.id"
          :request="i"
          :selected="$route.params.rid === i.id"
          :class="{
            'border-l-4 border-r-8 cursor-pointer p-2': true,
            'border-l-primary-500': $route.params.rid === i.id,
            'border-transparent hover:border-l-primary-500': $route.params.rid !== i.id,
          }"
          @click="async () => await navigateTo({
            path: `/w/${params.wid}/r/${i.id}`,
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
              webhookId: $route.params.wid as string,
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
      </UCard>

      <!-- right -->
      <div class="col-span-8">
        <NuxtPage :page-key="route => route.fullPath" />
        <!-- <template v-if="$route.query.config === 'true'">
          <DetailsWebhookConfig
            v-if="dataConfig"
            :default-value="dataConfig"
            @submit="async (data) => {
              await $trpc.webhook.update.mutate({
                ...data,
                webhookId: $route.params.wid as string,
              })
              await refreshConfig()
            }"
          >
            <template #submit-button="{ loading }">
              <UButton
                type="submit"
                color="primary"
                icon="i-lucide-save"
                :loading="loading"
              >
                Save Configuration
              </UButton>
            </template>
          </DetailsWebhookConfig>
          <UEmpty
            v-else
            icon="i-lucide-alert-circle"
            title="No webhook found"
            description="The webhook configuration could not be loaded."
          />
        </template>
        <template v-else>
          <DetailsRequest
            v-if="dataRequest"
            :request="dataRequest"
          />
          <UEmpty
            v-else
            icon="i-lucide-file-search"
            title="No request selected"
            description="Select a request from the list to view its details."
          />
        </template> -->
      </div>
    </div>
  </UMain>
</template>
