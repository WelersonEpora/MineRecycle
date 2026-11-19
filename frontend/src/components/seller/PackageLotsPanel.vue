<template>
  <div>
    <div class="alert alert-light border small py-2">
      <template v-if="automatic">{{ t('seller.automaticNote', { level: f.sourceLabel(pkg.source), value: pkg.sourceValue }) }}</template>
      <template v-else>{{ t('seller.manualNote') }}</template>
    </div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
    <LotsTable
      v-model:selected="selected"
      v-model:page="page"
      v-model:page-size="pageSize"
      v-model:sort="sort"
      :items="items"
      :total="total"
      :loading="loading"
      :selectable="editable"
      @open="openLot"
      @refresh="load"
    >
      <template #filters>
        <div>
          <label class="form-label small" for="mr-pkg-lots-q">{{ t('common.search') }}</label>
          <input id="mr-pkg-lots-q" v-model="q" type="search" class="form-control form-control-sm" />
        </div>
        <template v-if="editable">
          <span v-if="selected.length" class="small fw-medium mb-1">{{ t('lots.selected', { n: selected.length }, selected.length) }}</span>
          <button v-if="selected.length" class="btn btn-sm btn-outline-danger" :disabled="busy" @click="removeSelected">
            <i class="bi bi-dash-circle"></i> {{ t('seller.removeLots') }}
          </button>
          <button class="btn btn-sm btn-accent ms-auto" @click="picking = true"><i class="bi bi-plus-lg"></i> {{ t('seller.addLots') }}</button>
        </template>
      </template>
    </LotsTable>
    <LotPickerModal v-if="editable" v-model:show="picking" :package-id="pkg.id" @added="changed" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFormat } from '../../composables/useFormat.js'
import { confirmDialog, notify } from '../../composables/useDialog.js'
import { PAGE_SIZES } from '../../utils/pagination.js'
import { api } from '../../services/api.js'
import LotsTable from './LotsTable.vue'
import LotPickerModal from './LotPickerModal.vue'

// Lotes do pacote. Pacote automático: só leitura (a planilha manda). Pacote montado: adicionar e tirar lotes, a não
// ser que já esteja vendido. Sem ordenação escolhida, a ordem é a do pacote.
const props = defineProps({ pkg: { type: Object, required: true } })
const emit = defineEmits(['changed'])
const f = useFormat()
const t = f.t
const router = useRouter()

const automatic = computed(() => props.pkg.source !== 'manual')
const editable = computed(() => !automatic.value && props.pkg.status !== 'sold')
const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(PAGE_SIZES[1])
const sort = ref({ field: '', order: 'asc' })
const q = ref('')
const selected = ref([])
const loading = ref(false)
const busy = ref(false)
const picking = ref(false)
const error = ref('')
let seq = 0
let timer = null

async function load() {
  const mine = ++seq
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, pageSize: pageSize.value, q: q.value.trim() || undefined }
    if (sort.value.field) Object.assign(params, { sort: sort.value.field, order: sort.value.order })
    const r = await api.packageSellerLots(props.pkg.id, params)
    if (mine !== seq) return
    items.value = r.items
    total.value = r.total
  } catch (err) {
    if (mine === seq) error.value = f.errorMessage(err)
  } finally {
    if (mine === seq) loading.value = false
  }
}

async function removeSelected() {
  const n = selected.value.length
  const ok = await confirmDialog({ title: t('seller.removeLots'), message: t('seller.removeLotsConfirm', { n }, n), confirmLabel: t('seller.removeLots') })
  if (!ok) return
  busy.value = true
  try {
    await api.removePackageLots(props.pkg.id, selected.value)
    notify(t('seller.lotsRemoved', { n }, n))
    await changed()
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function changed() {
  selected.value = []
  await load()
  emit('changed')
}

function openLot(lot) {
  router.push({ name: 'seller-lot', params: { id: lot.id } })
}

function fromStart() {
  if (page.value === 1) load()
  else page.value = 1
}

watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(fromStart, 300)
})
watch(sort, fromStart)
watch([page, pageSize], load)
watch(() => props.pkg.id, load, { immediate: true })
</script>
