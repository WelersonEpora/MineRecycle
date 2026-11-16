<template>
  <div class="mx-auto" style="max-width: 560px">
    <div v-if="error" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle"></i> {{ error }}
    </div>
    <p v-else class="text-secondary"><span class="spinner-border spinner-border-sm"></span> {{ t('access.opening') }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFormat } from '../composables/useFormat.js'
import { useSession } from '../stores/session.js'
import { api } from '../services/api.js'

const f = useFormat()
const t = f.t
const router = useRouter()
const session = useSession()
const error = ref('')

onMounted(async () => {
  // O token vem depois do # e é retirado da barra de endereço logo em seguida (não fica no histórico).
  const token = window.location.hash.replace(/^#/, '')
  window.history.replaceState(window.history.state, '', window.location.pathname)
  if (!token) {
    error.value = t('access.missingToken')
    return
  }
  try {
    await api.redeem(token)
    await session.load(true)
    router.replace({ name: 'buyer' })
  } catch (err) {
    error.value = f.errorMessage(err)
  }
})
</script>
