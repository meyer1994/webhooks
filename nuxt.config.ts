// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nitro-cloudflare-dev',
    'nuxt-echarts',
  ],

  devtools: {
    enabled: false,
    timeline: {
      enabled: true,
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
  },

  build: {
    transpile: ['trpc-nuxt'],
  },

  compatibilityDate: '2026-01-09',

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@trpc/client',
        'zod',
      ],
    },
  },

  typescript: {
    typeCheck: false,
    strict: true,
  },

  eslint: {
    checker: true,
    config: { stylistic: true },
  },
})
