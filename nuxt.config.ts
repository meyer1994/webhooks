// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxt/ui',
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

  runtimeConfig: {
    database: {
      url: process.env.DATABASE_URL,
    },
    aws: {
      bucket: process.env.NUXT_AWS_BUCKET,
    },
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

  typescript: {
    typeCheck: true,
    strict: true,
  },

  echarts: {
    charts: [
      'BarChart',
      'LineChart',
    ],
    components: [
      'DatasetComponent',
      'GridComponent',
      'TooltipComponent',
      'TransformComponent',
      'LegendComponent',
    ],

  },

  eslint: {
    checker: true,
    config: { stylistic: true },
  },
})
