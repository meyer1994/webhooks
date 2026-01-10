<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AppRouterOutputs } from '~~/server/trpc'

type Item = AppRouterOutputs['webhook']['list']['requests'][number]

type Props = {
  items: Item[]
  loading?: boolean
  selectedRequestId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedRequestId: null,
})

const emit = defineEmits<{
  'select-request': [request: Item]
  'refresh-table': []
}>()

type Keys = keyof Item | 'actions'

// Table columns
const columns: TableColumn<Item>[] = [
  {
    id: 'method' as const,
    accessorKey: 'method',
    header: 'Method',
  },
  {
    id: 'url' as const,
    accessorKey: 'url',
    header: 'URL',
  },
  {
    id: 'createdAt' as const,
    accessorKey: 'createdAt',
    header: 'Created At',
  },
  {
    id: 'actions' as const,
    header: 'Actions',
  },
]

const MAP_ID_TO_LABEL: Record<string, string> = columns
  .reduce((a, c) => ({ ...a, [c.id as string]: c.header }), {})

// State for column visibility
const visible: Ref<Record<Keys, boolean>> = ref({
  id: true,

  body: true,
  cfProperties: true,
  headers: true,
  ipAddress: true,
  method: true,
  queryParams: true,
  url: true,
  webhookId: true,

  createdAt: true,
  updatedAt: true,

  actions: false,
})

const table = useTemplateRef('table')

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
  <div class="flex flex-col flex-1 w-full">
    <!-- Filter and column controls -->
    <div class="flex items-center gap-2 px-4 py-3.5 border-b border-accented">
      <slot name="top" />

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        size="sm"
        title="Refresh"
        class="ml-auto"
        @click="emit('refresh-table')"
      />

      <UDropdownMenu
        :items="
          table
            ?.tableApi
            ?.getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => ({
              label: (MAP_ID_TO_LABEL[column.id as Keys] ?? column.id),
              type: 'checkbox' as const,
              checked: column.getIsVisible(),
              onUpdateChecked: (checked: boolean) =>
                table
                  ?.tableApi
                  ?.getColumn(column.id)
                  ?.toggleVisibility(!!checked),
              onSelect: (e: Event) => e.preventDefault(),
            }))
        "
        :content="{ align: 'end' }"
      >
        <UButton
          label="Columns"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-chevron-down"
          aria-label="Select columns"
        />
      </UDropdownMenu>
    </div>

    <!-- Table -->
    <UTable
      ref="table"
      v-model:column-visibility="visible"
      :loading="props.loading"
      loading-animation="carousel"
      :columns="columns"
      :data="props.items"
      :sticky="true"
      :empty-state="{
        icon: 'i-lucide-inbox',
        label: 'No requests yet',
      }"
      :ui="{
        tr: 'hover:bg-muted cursor-pointer',
      }"
      class="flex-1"
      @select="(e, row) => emit('select-request', row.original)"
    >
      <!-- Method Column -->
      <template #method-cell="{ row }">
        <UBadge
          :color="methodColor(row.original.method)"
          variant="subtle"
          size="sm"
        >
          {{ row.original.method }}
        </UBadge>
      </template>

      <!-- URL Column -->
      <template #url-cell="{ row }">
        <span
          class="text-sm font-mono text-gray-300 truncate block max-w-md"
          :title="row.original.url"
        >
          {{ row.original.url }}
        </span>
      </template>

      <!-- Created At Column -->
      <template #createdAt-cell="{ row }">
        <NuxtTime
          v-if="row.original.createdAt"
          :datetime="new Date(row.original.createdAt).toISOString()"
          title
          class="text-sm"
        />
        <span
          v-else
          class="text-sm text-gray-400"
        >N/A</span>
      </template>

      <!-- Actions Column -->
      <template #actions-cell="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-eye"
            color="primary"
            variant="ghost"
            size="sm"
            title="View details"
            @click.stop="emit('select-request', row.original)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
