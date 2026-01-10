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

const features = [
  {
    icon: 'i-lucide-zap',
    title: 'Real-time Monitoring',
    description: 'Watch requests arrive instantly with zero latency via efficient polling.',
  },
  {
    icon: 'i-lucide-search',
    title: 'Deep Inspection',
    description: 'Analyze headers, body content, and query parameters in detail.',
  },
  {
    icon: 'i-lucide-code-2',
    title: 'Developer Friendly',
    description: 'Copy as cURL, view JSON payloads, and replay requests easily.',
  },
  {
    icon: 'i-lucide-clock',
    title: 'History Retention',
    description: 'Requests are stored with time-sortable UUIDv7 for easy historical analysis.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white relative overflow-hidden selection:bg-primary-500/30">
    <!-- Background Decor -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
    <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

    <div class="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto mb-20">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/50 border border-gray-800 text-sm text-gray-400 mb-8 backdrop-blur-sm animate-fade-in-up">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Ready to capture
        </div>

        <h1 class="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-gray-400 animate-fade-in-up [animation-delay:200ms]">
          Inspect Webhooks <br>
          <span class="text-primary-400">in Real-time</span>
        </h1>

        <p class="text-xl text-gray-400 mb-10 leading-relaxed animate-fade-in-up [animation-delay:400ms]">
          The developer-first tool for debugging HTTP callbacks. <br class="hidden sm:block">
          Capture, inspect, and analyze incoming webhook traffic instantly.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:600ms]">
          <UButton
            size="xl"
            color="primary"
            icon="i-lucide-plus"
            :loading="isCreating"
            :disabled="isCreating"
            class="w-full sm:w-auto px-8 py-4 text-lg shadow-lg shadow-primary-500/20 transition-transform active:scale-95"
            @click="createWebhook"
          >
            {{ isCreating ? 'Creating Endpoint...' : 'Create New Webhook' }}
          </UButton>

          <UButton
            size="xl"
            color="neutral"
            variant="ghost"
            icon="i-lucide-github"
            to="https://github.com"
            target="_blank"
            class="w-full sm:w-auto px-8 py-4 text-lg hover:bg-gray-900"
          >
            Star on GitHub
          </UButton>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up [animation-delay:800ms]">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm hover:border-primary-500/50 transition-all duration-300 hover:bg-gray-800/50"
        >
          <div class="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary-950/50">
            <UIcon
              :name="feature.icon"
              class="text-2xl text-gray-400 group-hover:text-primary-400 transition-colors"
            />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ feature.title }}
          </h3>
          <p class="text-sm text-gray-400 leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="mt-32 border-t border-gray-800/50 pt-8 text-center text-gray-600 text-sm">
        <p>&copy; {{ new Date().getFullYear() }} Webhook Inspector. Built for developers.</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
