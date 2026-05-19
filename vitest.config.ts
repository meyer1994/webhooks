import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      await defineVitestProject({
        // https://github.com/nuxt/test-utils/issues/1490#issuecomment-3661241408
        resolve: { alias: { 'bun:test': resolve('./vitest.config.ts') } },

        test: {
          name: 'unit',
          include: ['tests/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
