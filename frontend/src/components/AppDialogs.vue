<template>
  <ModalDialog :show="Boolean(c)" :title="c?.title || ''" size="sm" @close="closeConfirm(false)">
    <form v-if="c" id="mr-confirm-form" @submit.prevent="canConfirm && closeConfirm(true)">
      <p class="mb-0">{{ c.message }}</p>
      <div v-if="c.requireText" class="mt-3">
        <label for="mr-confirm-text" class="form-label small">
          {{ t('dialog.typeToConfirm') }} <strong>{{ c.requireText }}</strong>
        </label>
        <input id="mr-confirm-text" ref="typedInput" v-model="typed" type="text" class="form-control" autocomplete="off" />
      </div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeConfirm(false)">{{ t('common.cancel') }}</button>
      <button
        ref="confirmButton"
        type="submit"
        form="mr-confirm-form"
        class="btn btn-sm"
        :class="c?.danger ? 'btn-danger' : 'btn-accent'"
        :disabled="!canConfirm"
      >
        {{ c?.confirmLabel || t('dialog.confirm') }}
      </button>
    </template>
  </ModalDialog>

  <Teleport to="body">
    <div class="mr-toasts" aria-live="polite">
      <div v-for="toast in dialogState.toasts" :key="toast.id" class="mr-toast shadow" :class="`mr-toast-${toast.variant}`" role="status">
        <i class="bi" :class="ICONS[toast.variant] || ICONS.info"></i>
        <span class="flex-grow-1">{{ toast.message }}</span>
        <button type="button" class="btn-close btn-close-sm" :aria-label="t('common.close')" @click="dismissToast(toast.id)"></button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalDialog from './ModalDialog.vue'
import { dialogState, closeConfirm, dismissToast } from '../composables/useDialog.js'

const { t } = useI18n()
const ICONS = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }

const c = computed(() => dialogState.confirm)
const typed = ref('')
const typedInput = ref(null)
const confirmButton = ref(null)
const canConfirm = computed(() => Boolean(c.value) && (!c.value.requireText || typed.value.trim() === c.value.requireText))

// Foco: no campo de digitação, quando há; senão no botão de confirmar (Enter confirma, Esc cancela).
watch(c, async (open) => {
  typed.value = ''
  if (!open) return
  await nextTick()
  ;(typedInput.value || confirmButton.value)?.focus()
})
</script>
