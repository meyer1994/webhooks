<script setup lang="ts">
import type { AppRouterOutputs } from '~~/server/trpc'
import { useClipboard } from '@vueuse/core'

type Request = AppRouterOutputs['webhook']['get']

type Props = {
  request: Request
}

const props = defineProps<Props>()

const { copy: copyUrl, copied: urlCopied } = useClipboard()
const { copy: copyHeaders, copied: headersCopied } = useClipboard()
const { copy: copyQueryParams, copied: queryParamsCopied } = useClipboard()
const { copy: copyBody, copied: bodyCopied } = useClipboard()

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

const parsedHeaders = computed(() => {
  try {
    return JSON.parse(props.request.headers || '{}')
  }
  catch {
    return {}
  }
})

const parsedQueryParams = computed(() => {
  try {
    return JSON.parse(props.request.queryParams || '{}')
  }
  catch {
    return {}
  }
})

const formattedHeaders = computed(() => {
  return JSON.stringify(parsedHeaders.value, null, 2)
})

const formattedQueryParams = computed(() => {
  return JSON.stringify(parsedQueryParams.value, null, 2)
})

const formattedBody = computed(() => {
  if (!props.request.body) return ''
  try {
    const parsed = JSON.parse(props.request.body)
    return JSON.stringify(parsed, null, 2)
  }
  catch {
    return props.request.body
  }
})

const isBodyJson = computed(() => {
  if (!props.request.body) return false
  try {
    JSON.parse(props.request.body)
    return true
  }
  catch {
    return false
  }
})

const bodySize = computed(() => {
  if (!props.request.body) return 0
  return new Blob([props.request.body]).size
})

const formattedBodySize = computed(() => {
  const bytes = bodySize.value
  if (bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
})

function copyRequestUrl() {
  copyUrl(props.request.url)
}

function copyRequestHeaders() {
  copyHeaders(formattedHeaders.value)
}

function copyRequestQueryParams() {
  copyQueryParams(formattedQueryParams.value)
}

function copyRequestBody() {
  copyBody(props.request.body || '')
}
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-gray-950 p-6">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white mb-2">
        Request Details
      </h2>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <UBadge
          :color="methodColor(request.method)"
          variant="subtle"
        >
          {{ request.method }}
        </UBadge>
        <span class="font-mono text-xs">{{ request.id }}</span>
        <span class="text-gray-500">
          • {{ new Date(request.createdAt).toLocaleString() }}
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <!-- URL Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">
              URL
            </h3>
            <UButton
              :color="urlCopied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-clipboard"
              @click="copyRequestUrl"
            >
              {{ urlCopied ? 'Copied!' : 'Copy' }}
            </UButton>
          </div>
        </template>
        <pre class="text-sm font-mono text-gray-300 break-all">{{ request.url }}</pre>
      </UCard>

      <!-- Headers Card -->
      <UCard v-if="request.headers">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">
              Headers
            </h3>
            <UButton
              :color="headersCopied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-clipboard"
              @click="copyRequestHeaders"
            >
              {{ headersCopied ? 'Copied!' : 'Copy' }}
            </UButton>
          </div>
        </template>
        <pre class="text-xs font-mono text-gray-300 overflow-x-auto">{{ formattedHeaders }}</pre>
      </UCard>

      <!-- Query Parameters Card -->
      <UCard v-if="request.queryParams && Object.keys(parsedQueryParams).length > 0">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">
              Query Parameters
            </h3>
            <UButton
              :color="queryParamsCopied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-clipboard"
              @click="copyRequestQueryParams"
            >
              {{ queryParamsCopied ? 'Copied!' : 'Copy' }}
            </UButton>
          </div>
        </template>
        <pre class="text-xs font-mono text-gray-300 overflow-x-auto">{{ formattedQueryParams }}</pre>
      </UCard>

      <!-- Body Card -->
      <UCard v-if="request.body">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">
                Body
              </h3>
              <UBadge
                v-if="isBodyJson"
                color="info"
                variant="subtle"
                size="xs"
              >
                JSON
              </UBadge>
              <span class="text-xs text-gray-500">
                {{ formattedBodySize }}
              </span>
            </div>
            <UButton
              :color="bodyCopied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-clipboard"
              @click="copyRequestBody"
            >
              {{ bodyCopied ? 'Copied!' : 'Copy' }}
            </UButton>
          </div>
        </template>
        <pre class="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{{ formattedBody }}</pre>
      </UCard>
    </div>
  </div>
</template>
