<template>
  <section class="mr-card p-3" style="max-width: 720px">
    <h2 class="h6">{{ t('settings.showcaseTitle') }}</h2>
    <p class="small text-secondary">{{ t('settings.showcaseHelp') }}</p>
    <p v-if="!isAdmin" class="small text-warning-emphasis"><i class="bi bi-lock"></i> {{ t('settings.adminOnly') }}</p>
    <div v-for="s in eligible" :key="s" class="form-check">
      <input :id="`mr-sc-${s}`" v-model="selected" class="form-check-input" type="checkbox" :value="s" :disabled="!isAdmin" />
      <label class="form-check-label" :for="`mr-sc-${s}`"><StatusBadge :status="s" /></label>
    </div>
    <div v-if="isAdmin" class="d-flex align-items-center gap-2 mt-3">
      <button class="btn btn-accent btn-sm" :disabled="busy || !selected.length" @click="save">{{ t('common.save') }}</button>
      <span v-if="saved" class="small text-success">{{ t('seller.saved') }}</span>
    </div>
    <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">{{ error }}</div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { useSession } from '../../stores/session.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'

const f = useFormat()
const t = f.t
const session = useSession()
const isAdmin = computed(() => session.state.user?.role === 'admin')
const eligible = ref([])
const selected = ref([])
const busy = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(async () => {
  const s = await api.settings()
  eligible.value = s.showcaseEligibleStatuses
  selected.value = s.showcaseStatuses
})

async function save() {
  busy.value = true
  error.value = ''
  try {
    const s = await api.updateSettings({ showcaseStatuses: selected.value })
    selected.value = s.showcaseStatuses
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}
</script>
