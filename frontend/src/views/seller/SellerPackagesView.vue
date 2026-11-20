<template>
  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <DataTableCard
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="sorted.length"
    :loading="loading"
    :empty="!pageItems.length"
    :empty-text="t('seller.noPackages')"
    clickable
    refreshable
    @refresh="load"
  >
    <template #filters>
      <div>
        <label class="form-label">{{ t('seller.level') }}</label>
        <select v-model="filters.level" class="form-select form-select-sm">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="l in SOURCES" :key="l" :value="l">{{ f.sourceLabel(l) }}</option>
        </select>
      </div>
      <div v-if="SHOW_ORIGIN && origins.length">
        <label class="form-label">{{ t('seller.fields.origin') }}</label>
        <select v-model="filters.originId" class="form-select form-select-sm">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="o in origins" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>
      <div>
        <label class="form-label">{{ t('seller.site') }}</label>
        <select v-model="filters.site" class="form-select form-select-sm">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="s in sites" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div>
        <label class="form-label">{{ t('common.search') }}</label>
        <input v-model="filters.q" type="search" class="form-control form-control-sm" />
      </div>
      <button v-if="activeCount" type="button" class="btn btn-link btn-sm mb-1" @click="reset">{{ t('filters.clear') }}</button>
      <button class="btn btn-accent btn-sm ms-auto" @click="openCreate"><i class="bi bi-plus-lg"></i> {{ t('seller.newPackage') }}</button>
      <div class="w-100">
        <ChipGroup
          id="seller-status"
          :label="t('catalog.status')"
          :model-value="filters.status"
          :all-label="t('common.all')"
          :all-count="statusView.facet.all"
          :options="statusOptions"
          @update:model-value="filters.status = $event"
        />
      </div>
    </template>
    <template #head>
      <tr>
        <!-- Larguras: ID e Site encolhem até o conteúdo (width 1%); o nome fica com a maior parte. -->
        <SortHeader v-model="sort" field="number" :label="t('seller.fields.number')" class="text-nowrap pe-0 mr-col-id" style="width: 1%" />
        <th class="ps-2"></th>
        <SortHeader v-model="sort" field="name" :label="t('seller.fields.name')" style="width: 45%" />
        <SortHeader v-model="sort" field="source" :label="t('seller.level')" />
        <th style="width: 1%">{{ t('seller.site') }}</th>
        <SortHeader v-model="sort" field="status" :label="t('catalog.status')" />
        <SortHeader v-model="sort" field="lotCount" :label="t('seller.lotCount')" first-order="desc" />
        <SortHeader v-model="sort" field="attachmentCount" :label="t('seller.attachmentCount')" first-order="desc" />
        <SortHeader v-model="sort" field="updatedAt" :label="t('seller.updated')" first-order="desc" />
      </tr>
    </template>
    <tr v-for="p in pageItems" :key="p.id" @click="open(p)">
      <td class="mr-number fw-normal text-nowrap pe-0">{{ p.number }}</td>
      <td class="ps-2" style="width: 64px">
        <img v-if="p.coverUrl" :src="p.coverUrl" alt="" style="width: 56px; height: 42px; object-fit: cover" class="rounded" loading="lazy" />
      </td>
      <td>
        <div class="fw-medium">{{ p.name }}</div>
        <div v-if="p.source !== 'manual' && p.sourceValue !== p.name" class="small text-secondary">{{ p.sourceValue }}</div>
        <div v-if="SHOW_ORIGIN && p.origin" class="small text-secondary" :title="p.origin.name">{{ p.origin.code }}</div>
      </td>
      <td class="small text-nowrap">{{ f.sourceLabel(p.source) }}</td>
      <td class="small" style="min-width: 9rem">{{ (p.sites || []).join(' · ') }}</td>
      <td><StatusBadge :status="p.status" /></td>
      <td class="text-nowrap">
        {{ p.lotCount }}
        <div v-if="p.soldCount" class="small text-secondary">{{ t('seller.soldOf', { sold: p.soldCount, total: p.lotCount }) }}</div>
      </td>
      <td>{{ p.attachmentCount || '' }}</td>
      <td class="small text-secondary text-nowrap">{{ f.date(p.updatedAt) }}</td>
    </tr>
  </DataTableCard>

  <ModalDialog v-model:show="creating" :title="t('seller.newPackage')" size="lg" persistent scrollable>
    <PackageForm v-model="draft" />
    <div v-if="createError" class="alert alert-danger py-2 small mt-3">{{ createError }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="creating = false">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="busy" @click="create">{{ t('common.create') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFormat, SOURCES, STATUSES } from '../../composables/useFormat.js'
import { EMPTY_SELLER_FILTERS, sellerFiltersFromQuery, sellerFiltersToQuery, applyStatus } from '../../composables/sellerPackageFilters.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'
import ChipGroup from '../../components/ChipGroup.vue'
import DataTableCard from '../../components/table/DataTableCard.vue'
import SortHeader from '../../components/table/SortHeader.vue'
import { PAGE_SIZES, slicePage, sortItems } from '../../utils/pagination.js'
import ModalDialog from '../../components/ModalDialog.vue'
import PackageForm from '../../components/seller/PackageForm.vue'
import { SHOW_ORIGIN } from '../../utils/features.js'

const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()
const listRoute = route.name
const filters = reactive(sellerFiltersFromQuery(route.query))
const origins = ref([])
if (SHOW_ORIGIN) {
  api
    .origins()
    .then((list) => (origins.value = list))
    .catch(() => {})
}
// Sites dos lotes (como estão na planilha), para o filtro.
const sites = ref([])
api
  .lotFacets()
  .then((x) => (sites.value = x.site.map((s) => s.value).filter(Boolean)))
  .catch(() => {})
const items = ref([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const createError = ref('')
const busy = ref(false)
const draft = ref({})
let timer = null
let seq = 0

// A situação é filtrada na tela (ver applyStatus); os outros filtros vão para a API.
const statusView = computed(() => applyStatus(items.value, filters.status, STATUSES))
const shown = computed(() => statusView.value.items)
// Ordenação e paginação em memória (são poucas dezenas de pacotes). Padrão: nome.
const { locale } = useI18n()
const sort = ref({ field: 'name', order: 'asc' })
const page = ref(1)
const pageSize = ref(PAGE_SIZES[1])
const sorted = computed(() => sortItems(shown.value, sort.value, locale.value))
const pageItems = computed(() => slicePage(sorted.value, page.value, pageSize.value))
watch([() => filters.status, sort], () => (page.value = 1))
const statusOptions = computed(() => statusView.value.facet.options.map((o) => ({ ...o, label: f.statusLabel(o.value) })))
const activeCount = computed(() => Object.keys(sellerFiltersToQuery(filters)).length)

async function load() {
  const mine = ++seq
  loading.value = true
  error.value = ''
  try {
    const list = await api.sellerPackages(serverKey())
    if (mine === seq) items.value = list
  } catch (err) {
    if (mine === seq) error.value = f.errorMessage(err)
  } finally {
    if (mine === seq) loading.value = false
  }
}

function reset() {
  Object.assign(filters, EMPTY_SELLER_FILTERS)
}

function openCreate() {
  const next = items.value.reduce((m, p) => Math.max(m, p.number), 0) + 1
  draft.value = { number: next, name: '', category: 'other', originId: '', description: '' }
  createError.value = ''
  creating.value = true
}

async function create() {
  busy.value = true
  createError.value = ''
  try {
    const p = await api.createPackage(draft.value)
    creating.value = false
    router.push({ name: 'seller-package', params: { id: p.id } })
  } catch (err) {
    createError.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

function open(p) {
  router.push({ name: 'seller-package', params: { id: p.id } })
}

// A URL acompanha os filtros (replace, para o "voltar" sair da lista e não desfazer filtro por filtro). Só a busca
// por texto espera o usuário parar de digitar; a situação não chama a API.
let lastServer = JSON.stringify(serverKey())
function serverKey() {
  const rest = sellerFiltersToQuery(filters)
  delete rest.status
  return rest
}
// Link de menu para a própria lista (sem filtros na URL) limpa os filtros na tela também.
watch(
  () => route.query,
  (query) => {
    if (route.name !== listRoute) return
    const next = sellerFiltersFromQuery(query)
    if (JSON.stringify(sellerFiltersToQuery(next)) !== JSON.stringify(sellerFiltersToQuery(filters))) Object.assign(filters, next)
  }
)
watch(filters, () => {
  if (route.name !== listRoute) return
  page.value = 1
  router.replace({ query: sellerFiltersToQuery(filters) })
  const key = JSON.stringify(serverKey())
  if (key === lastServer) return
  const typing = JSON.parse(key).q !== JSON.parse(lastServer).q
  lastServer = key
  clearTimeout(timer)
  timer = setTimeout(load, typing ? 300 : 0)
}, { deep: true })
onMounted(load)
</script>

<style scoped>
/* Coluna ID: ícone de ordenação colado ao rótulo, para a coluna ficar estreita. */
.mr-col-id :deep(.mr-th-sort) {
  gap: 0.15rem;
}
</style>
