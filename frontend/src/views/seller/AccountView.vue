<template>
  <section class="mr-card p-3" style="max-width: 480px">
    <h2 class="h6 mb-3">{{ t('account.changePassword') }}</h2>
    <form @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label small" for="mr-cur">{{ t('account.currentPassword') }}</label>
        <input id="mr-cur" v-model="current" type="password" class="form-control" autocomplete="current-password" required />
      </div>
      <div class="mb-3">
        <label class="form-label small" for="mr-new">{{ t('account.newPassword') }}</label>
        <input id="mr-new" v-model="next" type="password" class="form-control" autocomplete="new-password" minlength="10" required />
        <div class="form-text">{{ t('users.passwordHint') }}</div>
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <div v-if="done" class="alert alert-success py-2 small">{{ t('account.changed') }}</div>
      <button class="btn btn-accent btn-sm" :disabled="busy">{{ t('common.save') }}</button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'

const f = useFormat()
const t = f.t
const current = ref('')
const next = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)

async function save() {
  busy.value = true
  error.value = ''
  done.value = false
  try {
    await api.changePassword(current.value, next.value)
    current.value = ''
    next.value = ''
    done.value = true
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}
</script>
