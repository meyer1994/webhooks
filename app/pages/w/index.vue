<script setup lang="ts">
const { $trpc } = useNuxtApp()
const isCreating = ref(false)

async function createWebhook() {
  isCreating.value = true
  try {
    const result = await $trpc.webhook.create.mutate()
    await navigateTo(`/w/${result.id}`)
  }
  catch (error) {
    console.error('Failed to create webhook:', error)
    isCreating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
    <UCard class="w-full max-w-2xl">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-bolt"
            class="text-primary-500 text-3xl"
          />
          <div>
            <h1 class="text-3xl font-bold text-white">
              Webhook Inspector
            </h1>
            <p class="text-gray-400 mt-1">
              Inspect incoming webhook requests in real-time
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <div class="prose prose-invert max-w-none">
          <p class="text-gray-300">
            Create a webhook endpoint to capture and inspect incoming HTTP requests.
            Perfect for debugging, testing, and monitoring webhook integrations.
          </p>
        </div>

        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Features
          </h3>
          <ul class="space-y-2 text-gray-300">
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check"
                class="text-green-500"
              />
              <span>Real-time request monitoring with polling</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check"
                class="text-green-500"
              />
              <span>Inspect headers, body, and query parameters</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check"
                class="text-green-500"
              />
              <span>Customizable mock responses</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check"
                class="text-green-500"
              />
              <span>Time-sortable UUIDv7 identifiers</span>
            </li>
          </ul>
        </div>

        <div class="flex justify-center pt-4">
          <UButton
            size="xl"
            color="primary"
            icon="i-lucide-plus"
            :loading="isCreating"
            :disabled="isCreating"
            @click="createWebhook"
          >
            {{ isCreating ? 'Creating...' : 'Create Webhook' }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
