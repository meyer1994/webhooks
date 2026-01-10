<script setup lang="ts">
const value = defineModel<number>()

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatted = computed(() => value.value ? formatBytes(value.value) : 'NA')
</script>

<template>
  <slot :formatted="formatted">
    {{ formatted }}
  </slot>
</template>
