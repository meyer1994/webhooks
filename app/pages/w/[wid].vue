<script setup lang="ts">
import * as z from 'zod'

// https://stackoverflow.com/a/54975267
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

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

type Route = Overwrite<ReturnType<typeof useRoute>, {
  params: z.output<typeof schemaParams>
  query: z.output<typeof schemaQuery>
}>

const route = useRoute() as Route

const { data, refresh, status } = await useAsyncData(
  () => `/w/${route.params.wid}/?filter=${route.query.filter}`,
  async () => await $trpc.webhook.list.query({
    filter: route.query.filter,
    webhookId: route.params.wid,
  }),
)

const { pause } = useIntervalFn(() => refresh(), 5_000)
useTimeoutFn(() => pause(), 8 * 60 * 1_000) // stop polling after 8 minutes

const updateFilter = useDebounceFn(async (value: string | undefined) => await navigateTo({
  query: { ...route.query, filter: value ? String(value) : undefined },
  replace: false,
}), 300)

const isClearing = ref(false)
const isExporting = ref(false)

async function clearAllRequests() {
  isClearing.value = true
  try {
    await $trpc.webhook.clear.mutate({
      webhookId: route.params.wid,
    })
    const toast = useToast()
    toast.add({
      title: 'All requests cleared',
      color: 'success',
    })
    await refresh()
  }
  catch (error) {
    console.error('Failed to clear requests:', error)
    const toast = useToast()
    toast.add({
      title: 'Failed to clear requests',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
    })
  }
  finally {
    isClearing.value = false
  }
}

function exportToJson() {
  isExporting.value = true
  try {
    const json = JSON.stringify(data.value || [], null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-${route.params.wid}-requests-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const toast = useToast()
    toast.add({
      title: 'Exported successfully',
      description: `${data.value?.length || 0} requests exported`,
      color: 'success',
    })
  }
  catch (error) {
    console.error('Failed to export:', error)
    const toast = useToast()
    toast.add({
      title: 'Export failed',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
    })
  }
  finally {
    isExporting.value = false
  }
}
</script>

<template>
  <UMain>
    <!-- header -->
    <AppHeader />

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
                Requests ({{ data?.length }})
              </h2>

              <div class="flex items-center gap-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  :loading="isExporting"
                  :disabled="!data || data.length === 0"
                  icon="i-lucide-download"
                  @click="exportToJson"
                >
                  Export
                </UButton>

                <UButton
                  size="sm"
                  color="error"
                  variant="ghost"
                  :loading="isClearing"
                  :disabled="!data || data.length === 0"
                  icon="i-lucide-trash-2"
                  @click="clearAllRequests"
                >
                  Clear All
                </UButton>

                <UButton
                  size="sm"
                  color="primary"
                  variant="ghost"
                  :loading="status === 'pending'"
                  icon="i-lucide-refresh-cw"
                  @click="() => refresh()"
                />
              </div>
            </div>

            <UInput
              placeholder="Search requests"
              icon="i-lucide-search"
              color="neutral"
              class="w-full"
              :value="$route.query.filter"
              @update:model-value="updateFilter($event as string | undefined)"
            />
          </div>
        </template>

        <!-- bottom -->
        <ListItemRequest
          v-for="i in data"
          :key="i.id"
          :request="i"
          :selected="$route.params.rid === i.id"
          :class="{
            'border-l-4 border-r-8 cursor-pointer p-2': true,
            'border-l-primary-500': $route.params.rid === i.id,
            'border-transparent hover:border-l-primary-500': $route.params.rid !== i.id,
          }"
          @click="async () => await navigateTo({
            path: `/w/${$route.params.wid}/r/${i.id}`,
            // if the request is already selected, replace the current route
            // so the back button works. if there is already a request selected,
            // replace the current route so the back button still goes back to
            // the 'no request selected' state. when clicking through requests,
            // it won't pollute the history with a bunch of urls
            replace: !!$route.params.rid,
          })"
          @delete="async () => {
            await $trpc.webhook.delete.mutate({
              requestId: $route.params.rid as string,
              webhookId: $route.params.wid as string,
            })
            await refresh()

            if ($route.params.rid === i.id) {
              return await navigateTo({
                replace: false,
                path: `/w/${$route.params.wid}`,
              })
            }
          }"
        />
      </UCard>

      <!-- right -->
      <div class="col-span-8">
        <NuxtPage :page-key="route => route.fullPath" />
      </div>
    </div>
  </UMain>
</template>
