<template>
  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <LotsTable
    v-model:page="page"
    v-model:page-size="pageSize"
    v-model:sort="sort"
    :items="items"
    :total="total"
    :loading="loading"
    show-packages
    @open="open"
    @refresh="load"
  >
    <template #filters>
      <LotFilters id="lots" v-model="filters" :facets="facets" with-withdrawn />
      <button class="btn btn-accent btn-sm ms-auto" @click="importing = true"><i class="bi bi-upload"></i> {{ t('lots.importLots') }}</button>
    </template>
  </LotsTable>

  <LotImportModal v-model:show="importing" @imported="afterImport" />
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat } from '../../composables/useFormat.js'
import { lotFiltersFromQuery, lotFiltersToQuery } from '../../composables/lotFilters.js'
import { PAGE_SIZES } from '../../utils/pagination.js'
import { api } from '../../services/api.js'
import LotFilters from '../../components/seller/LotFilters.vue'
import LotsTable from '../../components/seller/LotsTable.vue'
import LotImportModal from '../../components/seller/LotImportModal.vue'

// Lotes da planilha (decisão de 2026-11-19). Filtros, ordenação, página e tamanho da página na URL, para voltar à
// lista como estava.
const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

const filters = reactive(lotFiltersFromQuery(route.query))
const page = ref(Math.max(1, Number.parseInt(route.query.page, 10) || 1))
const pageSize = ref(PAGE_SIZES.includes(Number(route.query.pageSize)) ? Number(route.query.pageSize) : PAGE_SIZES[1])
const sort = ref({ field: String(route.query.sort || ''), order: route.query.order === 'desc' ? 'desc' : 'asc' })
const facets = ref(null)
const items = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref('')
const importing = ref(false)
let seq = 0
let timer = null

function query() {
  const q = lotFiltersToQuery(filters)
  if (sort.value.field) Object.assign(q, { sort: sort.value.field, order: sort.value.order })
  return q
}

async function load() {
  const mine = ++seq
  loading.value = true
  error.value = ''
  try {
    const r = await api.lots({ ...query(), page: page.value, pageSize: pageSize.value })
    if (mine !== seq) return
    items.value = r.items
    total.value = r.total
  } catch (err) {
    if (mine === seq) error.value = f.errorMessage(err)
  } finally {
    if (mine === seq) loading.value = false
  }
}

async function loadFacets() {
  facets.value = await api.lotFacets().catch(() => null)
}

function syncUrl() {
  const q = query()
  if (page.value > 1) q.page = String(page.value)
  if (pageSize.value !== PAGE_SIZES[1]) q.pageSize = String(pageSize.value)
  router.replace({ query: q })
}

function open(lot) {
  router.push({ name: 'seller-lot', params: { id: lot.id } })
}

async function afterImport() {
  await Promise.all([load(), loadFacets()])
}

// Filtro ou ordenação novos: volta à página 1 (a troca de página já recarrega).
function reloadFromStart() {
  if (page.value !== 1) {
    page.value = 1
    return
  }
  syncUrl()
  load()
}

watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(reloadFromStart, filters.q ? 300 : 0)
})
watch(sort, reloadFromStart)
watch([page, pageSize], () => {
  syncUrl()
  load()
})
onMounted(() => {
  load()
  loadFacets()
})
</script>
