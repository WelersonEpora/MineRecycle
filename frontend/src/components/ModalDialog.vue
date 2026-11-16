<template>
  <Teleport to="body">
    <div v-if="show" class="mr-modal-backdrop" @mousedown.self="dismiss">
      <div class="mr-modal" :class="sizeClass" role="dialog" aria-modal="true">
        <div class="d-flex align-items-center border-bottom px-3 py-2">
          <h2 class="h6 m-0 flex-grow-1">{{ title }}</h2>
          <button type="button" class="btn-close" :aria-label="t('common.close')" @click="close"></button>
        </div>
        <div class="p-3">
          <slot />
        </div>
        <div v-if="$slots.footer" class="border-top px-3 py-2 d-flex justify-content-end gap-2 flex-wrap">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: '' },
  persistent: { type: Boolean, default: false }
})
const emit = defineEmits(['update:show', 'close'])
const { t } = useI18n()

const sizeClass = computed(() => (props.size ? `mr-modal-${props.size}` : ''))

function close() {
  emit('update:show', false)
  emit('close')
}

// Clique fora e Esc: ignorados em diálogo persistente (ex.: importação em andamento).
function dismiss() {
  if (!props.persistent) close()
}

function onKey(e) {
  if (e.key === 'Escape') dismiss()
}

watch(
  () => props.show,
  (open) => {
    if (open) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
  { immediate: true }
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
