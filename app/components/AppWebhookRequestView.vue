<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { AppRouterOutputs } from '~~/server/trpc'

type Request = AppRouterOutputs['webhook']['get']

type Props = {
  request: Request
}

const props = defineProps<Props>()

const { copy: copyUrl, copied: urlCopied } = useClipboard()
const { copy: copyHeaders, copied: headersCopied } = useClipboard()
const { copy: copyQueryParams, copied: queryParamsCopied } = useClipboard()
const { copy: copyBody, copied: bodyCopied } = useClipboard()
const { copy: copyCfProperties, copied: cfPropertiesCopied } = useClipboard()

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

const parsedCfProperties = computed(() => {
  if (!props.request.cfProperties) return null
  try {
    return JSON.parse(props.request.cfProperties)
  }
  catch {
    return null
  }
})

const formattedCfProperties = computed(() => {
  if (!parsedCfProperties.value) return ''
  return JSON.stringify(parsedCfProperties.value, null, 2)
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

function copyCfPropertiesData() {
  copyCfProperties(formattedCfProperties.value)
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

      <!-- IP Address & Cloudflare Info Card -->
      <UCard v-if="request.ipAddress || parsedCfProperties">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">
              Network & Location
            </h3>
            <UButton
              v-if="parsedCfProperties"
              :color="cfPropertiesCopied ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              icon="i-lucide-clipboard"
              @click="copyCfPropertiesData"
            >
              {{ cfPropertiesCopied ? 'Copied!' : 'Copy CF' }}
            </UButton>
          </div>
        </template>
        <div class="space-y-3">
          <!-- IP Address -->
          <div
            v-if="request.ipAddress"
            class="flex items-center gap-2"
          >
            <span class="text-sm font-medium text-gray-400 w-24">IP Address:</span>
            <span class="text-sm font-mono text-gray-300">{{ request.ipAddress }}</span>
          </div>

          <!-- Geographic Info -->
          <div
            v-if="parsedCfProperties"
            class="space-y-2"
          >
            <div
              v-if="parsedCfProperties.country"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Country:</span>
              <UBadge
                color="info"
                variant="subtle"
                size="xs"
              >
                {{ parsedCfProperties.country }}
              </UBadge>
              <span
                v-if="parsedCfProperties.city"
                class="text-sm text-gray-300"
              >
                {{ parsedCfProperties.city }}
              </span>
            </div>
            <div
              v-if="parsedCfProperties.region"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Region:</span>
              <span class="text-sm text-gray-300">
                {{ parsedCfProperties.region }}
                <span
                  v-if="parsedCfProperties.regionCode"
                  class="text-gray-500"
                >
                  ({{ parsedCfProperties.regionCode }})
                </span>
              </span>
            </div>
            <div
              v-if="parsedCfProperties.continent"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Continent:</span>
              <span class="text-sm text-gray-300">{{ parsedCfProperties.continent }}</span>
            </div>
            <div
              v-if="parsedCfProperties.postalCode"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Postal Code:</span>
              <span class="text-sm text-gray-300">{{ parsedCfProperties.postalCode }}</span>
            </div>
            <div
              v-if="parsedCfProperties.latitude && parsedCfProperties.longitude"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Coordinates:</span>
              <span class="text-sm font-mono text-gray-300">
                {{ parsedCfProperties.latitude }}, {{ parsedCfProperties.longitude }}
              </span>
            </div>
            <div
              v-if="parsedCfProperties.timezone"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Timezone:</span>
              <span class="text-sm text-gray-300">{{ parsedCfProperties.timezone }}</span>
            </div>
            <div
              v-if="parsedCfProperties.isEUCountry"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">EU Country:</span>
              <UBadge
                color="info"
                variant="subtle"
                size="xs"
              >
                Yes
              </UBadge>
            </div>

            <!-- Network Info -->
            <div
              v-if="parsedCfProperties.asn"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">ASN:</span>
              <span class="text-sm font-mono text-gray-300">{{ parsedCfProperties.asn }}</span>
              <span
                v-if="parsedCfProperties.asOrganization"
                class="text-sm text-gray-500"
              >
                ({{ parsedCfProperties.asOrganization }})
              </span>
            </div>
            <div
              v-if="parsedCfProperties.colo"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Data Center:</span>
              <span class="text-sm font-mono text-gray-300">{{ parsedCfProperties.colo }}</span>
            </div>
            <div
              v-if="parsedCfProperties.httpProtocol"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">Protocol:</span>
              <span class="text-sm text-gray-300">{{ parsedCfProperties.httpProtocol }}</span>
            </div>
            <div
              v-if="parsedCfProperties.tlsVersion"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">TLS Version:</span>
              <span class="text-sm font-mono text-gray-300">{{ parsedCfProperties.tlsVersion }}</span>
            </div>
            <div
              v-if="parsedCfProperties.tlsCipher"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">TLS Cipher:</span>
              <span class="text-sm font-mono text-gray-300">{{ parsedCfProperties.tlsCipher }}</span>
            </div>
            <div
              v-if="parsedCfProperties.clientTcpRtt"
              class="flex items-center gap-2"
            >
              <span class="text-sm font-medium text-gray-400 w-24">TCP RTT:</span>
              <span class="text-sm text-gray-300">{{ parsedCfProperties.clientTcpRtt }}ms</span>
            </div>

            <!-- Bot Management -->
            <div
              v-if="parsedCfProperties.botManagement"
              class="mt-3 pt-3 border-t border-gray-800"
            >
              <div class="text-sm font-medium text-gray-400 mb-2">
                Bot Management
              </div>
              <div class="space-y-1">
                <div
                  v-if="parsedCfProperties.botManagement.score !== undefined"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm font-medium text-gray-400 w-24">Bot Score:</span>
                  <UBadge
                    :color="parsedCfProperties.botManagement.score < 30 ? 'error' : parsedCfProperties.botManagement.score < 70 ? 'warning' : 'success'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ parsedCfProperties.botManagement.score }}
                  </UBadge>
                </div>
                <div
                  v-if="parsedCfProperties.botManagement.verifiedBot"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm font-medium text-gray-400 w-24">Verified Bot:</span>
                  <UBadge
                    color="info"
                    variant="subtle"
                    size="xs"
                  >
                    Yes
                  </UBadge>
                </div>
                <div
                  v-if="parsedCfProperties.botManagement.corporateProxy"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm font-medium text-gray-400 w-24">Corporate Proxy:</span>
                  <UBadge
                    color="info"
                    variant="subtle"
                    size="xs"
                  >
                    Yes
                  </UBadge>
                </div>
                <div
                  v-if="parsedCfProperties.botManagement.staticResource"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm font-medium text-gray-400 w-24">Static Resource:</span>
                  <UBadge
                    color="info"
                    variant="subtle"
                    size="xs"
                  >
                    Yes
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Full CF Properties JSON (collapsible) -->
            <details class="mt-3 pt-3 border-t border-gray-800">
              <summary class="text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300">
                View Full CF Properties JSON
              </summary>
              <pre class="mt-2 text-xs font-mono text-gray-300 overflow-x-auto">{{ formattedCfProperties }}</pre>
            </details>
          </div>
        </div>
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
