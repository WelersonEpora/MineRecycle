<template>
  <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
    <div>
      <label class="form-label small mb-1">{{ t('catalog.status') }}</label>
      <select v-model="filters.status" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ f.statusLabel(s) }}</option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1">{{ t('catalog.type') }}</label>
      <select v-model="filters.type" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="ty in TYPES" :key="ty" :value="ty">{{ f.typeLabel(ty) }}</option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1">{{ t('seller.fields.origin') }}</label>
      <select v-model="filters.originId" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="o in origins" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1">{{ t('catalog.location') }}</label>
      <select v-model="filters.location" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="l in LOCATIONS" :key="l" :value="l">{{ f.locationLabel(l) }}</option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1">{{ t('common.search') }}</label>
      <input v-model="filters.q" type="search" class="form-control form-control-sm" />
    </div>
    <button class="btn btn-accent btn-sm ms-auto" @click="openCreate"><i class="bi bi-plus-lg"></i> {{ t('seller.newPackage') }}</button>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <div class="table-responsive mr-card">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light small">
        <tr>
          <th></th>
          <th class="text-nowrap">{{ t('seller.fields.storNumbersShort') }}</th>
          <th>{{ t('seller.fields.name') }}</th>
          <th>{{ t('seller.fields.type') }}</th>
          <th>{{ t('seller.fields.origin') }}</th>
          <th>{{ t('seller.fields.location') }}</th>
          <th>{{ t('catalog.status') }}</th>
          <th class="mr-num">{{ t('seller.lineCount') }}</th>
          <th class="mr-num">{{ t('seller.attachmentCount') }}</th>
          <th>{{ t('seller.updated') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && !items.length">
          <td colspan="10" class="text-secondary">{{ t('seller.noPackages') }}</td>
        </tr>
        <tr v-for="p in items" :key="p.id" role="button" @click="open(p)">
          <td style="width: 64px">
            <img v-if="p.coverUrl" :src="p.coverUrl" alt="" style="width: 56px; height: 42px; object-fit: cover" class="rounded" loading="lazy" />
          </td>
          <td class="mr-number text-nowrap">{{ (p.storNumbers || []).join('-') }}</td>
          <td>
            <div class="fw-medium">{{ p.name }}</div>
            <div v-if="p.storFolder" class="small text-secondary"><i class="bi bi-folder2"></i> <span class="mr-mono">{{ p.storFolder }}</span></div>
            <div v-if="p.storDocuments?.length" class="small text-secondary mr-mono">
              {{ t('seller.storShort') }}
              <span v-for="(d, i) in p.storDocuments" :key="d"
                >{{ i ? ' · ' : '' }}{{ d }}<span v-if="p.storDocumentsPending?.includes(d)" class="badge text-bg-warning ms-1">{{ t('seller.pendingShort') }}</span></span
              >
            </div>
          </td>
          <td class="small">{{ f.typeLabel(p.type) }}</td>
          <td class="small" :title="p.origin?.name">{{ p.origin?.code }}</td>
          <td class="small">{{ f.locationsLabel(p.locations) }}</td>
          <td><StatusBadge :status="p.status" /></td>
          <td class="mr-num">{{ p.lineCount }}</td>
          <td class="mr-num">{{ p.attachmentCount }}</td>
          <td class="small text-secondary text-nowrap">{{ f.date(p.updatedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <ModalDialog v-model:show="creating" :title="t('seller.newPackage')">
    <PackageForm v-model="draft" />
    <div v-if="createError" class="alert alert-danger py-2 small mt-3">{{ createError }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="creating = false">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="busy" @click="create">{{ t('common.create') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFormat, TYPES, LOCATIONS, STATUSES } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import PackageForm from '../../components/seller/PackageForm.vue'

const f = useFormat()
const t = f.t
const router = useRouter()
const filters = reactive({ status: '', type: '', originId: '', location: '', q: '' })
const origins = ref([])
api
  .origins()
  .then((list) => (origins.value = list))
  .catch(() => {})
const items = ref([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const createError = ref('')
const busy = ref(false)
const draft = ref({})
let timer = null

async function load() {
  loading.value = true
  try {
    items.value = await api.sellerPackages(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  const next = items.value.reduce((m, p) => Math.max(m, p.number), 0) + 1
  draft.value = { number: next, name: '', storFolder: '', storNumbers: [], type: 'bulk', category: 'other', originId: '', locations: [], storDocuments: [], storDocumentsPending: [], description: '' }
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

watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 250)
}, { deep: true })
onMounted(load)
</script>
