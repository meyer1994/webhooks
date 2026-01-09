<script setup lang="ts">
import * as z from 'zod'

const schema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size > 0, 'File is required')
    .refine(f => f.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(f => f.type.startsWith('image/'), 'File must be an image')
    .refine(f => f.name.trim().length > 0, 'File name is required'),
})

type Schema = z.output<typeof schema>
export type FormFileData = Schema

type Props = { defaultValue?: Partial<Schema> }

const props = withDefaults(defineProps<Props>(), { defaultValue: () => ({}) })
const state = reactive<Partial<Schema>>({ file: props.defaultValue?.file })
watch(() => props.defaultValue, v => v && Object.assign(state, v))

const emits = defineEmits<{ submit: [e: File] }>()
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="flex flex-col gap-4"
    @submit.prevent="(e) => emits('submit', e.data.file)"
  >
    <UFormField
      name="file"
      label="Arquivo"
      description="Selecione uma imagem (máximo 10MB)"
    >
      <UFileUpload
        v-model="state.file"
        accept="image/*"
      />
    </UFormField>

    <div class="flex gap-2 justify-between items-center mt-4">
      <slot name="submit-button">
        <UButton type="submit">
          Enviar
        </UButton>
      </slot>
    </div>
  </UForm>
</template>
