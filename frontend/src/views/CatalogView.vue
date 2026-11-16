<template>
  <section class="mr-hero p-4 p-md-5 mb-4">
    <h1 class="h3 fw-bold">{{ t('catalog.title') }}</h1>
    <p class="mb-0">{{ t('catalog.intro') }}</p>
  </section>

  <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
    <div>
      <label class="form-label small mb-1">{{ t('catalog.type') }}</label>
      <select v-model="filters.type" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="ty in TYPES" :key="ty" :value="ty">{{ f.typeLabel(ty) }}</option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1">{{ t('catalog.location') }}</label>
      <select v-model="filters.location" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="l in LOCATIONS" :key="l" :value="l">{{ f.locationLabel(l) }}</option>
      </select>
    </div>
    <div v-if="showcaseStatuses.length > 1">
      <label class="form-label small mb-1">{{ t('catalog.status') }}</label>
      <select v-model="filters.status" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="s in showcaseStatuses" :key="s" :value="s">{{ f.statusLabel(s) }}</option>
      </select>
    </div>
    <div class="flex-grow-1" style="max-width: 320px">
      <label class="form-label small mb-1">{{ t('common.search') }}</label>
      <input v-model="filters.q" type="search" class="form-control form-control-sm" />
    </div>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="loading" class="text-secondary">{{ t('common.loading') }}</p>
  <p v-else-if="!items.length" class="text-secondary">{{ t('catalog.empty') }}</p>
  <div v-else class="row g-3">
    <div v-for="p in items" :key="p.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <PackageCard :pkg="p" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat, TYPES, LOCATIONS } from '../composables/useFormat.js'
import { api } from '../services/api.js'
import PackageCard from '../components/PackageCard.vue'

const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

// Filtros na URL: o link do catálogo filtrado pode ser compartilhado.
const filters = reactive({
  type: route.query.type || '',
  location: route.query.location || '',
  status: route.query.status || '',
  q: route.query.q || ''
})
const items = ref([])
const showcaseStatuses = ref([])
const loading = ref(true)
const error = ref('')
let timer = null

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    const r = await api.catalog(params)
    items.value = r.items
    showcaseStatuses.value = r.showcaseStatuses
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    loading.value = false
  }
}

watch(
  filters,
  () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      router.replace({ query: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
      load()
    }, 250)
  },
  { deep: true }
)
onMounted(load)
</script>
