<template>
  <ModalDialog :show="show" :title="t('lots.pickerTitle')" size="xl" persistent scrollable @update:show="$emit('update:show', $event)">
    <p class="small text-secondary">{{ t('lots.pickerHint') }}</p>
    <LotsTable
      v-model:selected="selected"
      v-model:page="page"
      v-model:page-size="pageSize"
      v-model:sort="sort"
      :items="items"
      :total="total"
      :loading="loading"
      selectable
      :clickable="false"
      @refresh="load"
    >
      <template #filters>
        <LotFilters id="picker" v-model="filters" :facets="facets" />
      </template>
      <template #toolbar>
        <button v-if="total" type="button" class="btn btn-link btn-sm p-0" :disabled="busy" @click="selectFiltered">{{ t('lots.selectFiltered', { n: total }) }}</button>
        <template v-if="selected.length">
          <span class="small fw-medium">{{ t('lots.selected', { n: selected.length }, selected.length) }}</span>
          <button type="button" class="btn btn-link btn-sm p-0" @click="selected = []">{{ t('lots.clearSelection') }}</button>
        </template>
      </template>
    </LotsTable>
    <div v-if="error" class="alert alert-danger py-2 small mt-3">{{ error }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="$emit('update:show', false)">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="busy || !selected.length" @click="add">{{ t('lots.addSelected', { n: selected.length }, selected.length) }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { EMPTY_LOT_FILTERS, lotFiltersToQuery } from '../../composables/lotFilters.js'
import { notify } from '../../composables/useDialog.js'
import { PAGE_SIZES } from '../../utils/pagination.js'
import { api } from '../../services/api.js'
import ModalDialog from '../ModalDialog.vue'
import LotFilters from './LotFilters.vue'
import LotsTable from './LotsTable.vue'

// "Adicionar lotes" de um pacote montado: lista os lotes que ainda não estão nele, com os filtros da lista de lotes.
const props = defineProps({ show: { type: Boolean, default: false }, packageId: { type: String, required: true } })
const emit = defineEmits(['update:show', 'added'])
const f = useFormat()
const t = f.t

const filters = reactive({ ...EMPTY_LOT_FILTERS })
const facets = ref(null)
const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(PAGE_SIZES[1])
const sort = ref({ field: '', order: 'asc' })
const selected = ref([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
let seq = 0
let timer = null

function query() {
  const q = { ...lotFiltersToQuery(filters), notInPackage: props.packageId }
  if (sort.value.field) Object.assign(q, { sort: sort.value.field, order: sort.value.order })
  return q
}

async function load() {
  const mine = ++seq
  loading.value = true
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

async function selectFiltered() {
  busy.value = true
  try {
    const ids = await api.lotIds(query())
    selected.value = [...new Set([...selected.value, ...ids])]
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function add() {
  busy.value = true
  error.value = ''
  try {
    await api.addPackageLots(props.packageId, selected.value)
    notify(t('seller.lotsAdded', { n: selected.value.length }, selected.value.length))
    emit('added')
    emit('update:show', false)
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

function fromStart() {
  if (page.value === 1) load()
  else page.value = 1
}

// Cada abertura começa do zero.
watch(
  () => props.show,
  async (open) => {
    if (!open) return
    Object.assign(filters, EMPTY_LOT_FILTERS)
    selected.value = []
    page.value = 1
    error.value = ''
    facets.value = await api.lotFacets().catch(() => null)
    load()
  }
)
watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(fromStart, filters.q ? 300 : 0)
})
watch(sort, fromStart)
watch([page, pageSize], () => {
  if (props.show) load()
})
</script>
