<template>
  <div v-if="!session.state.buyer" class="alert alert-secondary">{{ ended ? t('access.ended') : t('access.noSession') }}</div>
  <template v-else>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="flex-grow-1">
        <h1 class="h4 mb-1"><i class="bi bi-key"></i> {{ t('access.title') }}: {{ data?.label || session.state.buyer.label }}</h1>
        <div class="small text-secondary">{{ t('access.validUntil', { date: f.dateTime(session.state.buyer.expiresAt) }) }}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" @click="end">{{ t('access.endSession') }}</button>
    </div>
    <h2 class="h6 text-uppercase text-secondary">{{ t('access.packages') }}</h2>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <p v-else-if="!data" class="text-secondary">{{ t('common.loading') }}</p>
    <div v-else class="row g-3">
      <div v-for="p in data.packages" :key="p.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
        <PackageCard :pkg="p" />
      </div>
    </div>
  </template>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useFormat } from '../composables/useFormat.js'
import { useSession } from '../stores/session.js'
import { api } from '../services/api.js'
import PackageCard from '../components/PackageCard.vue'

const f = useFormat()
const t = f.t
const session = useSession()
const data = ref(null)
const error = ref('')
const ended = ref(false)

onMounted(async () => {
  if (!session.state.buyer) return
  try {
    data.value = await api.buyerSession()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
})

async function end() {
  await session.endBuyerSession()
  ended.value = true
}
</script>
