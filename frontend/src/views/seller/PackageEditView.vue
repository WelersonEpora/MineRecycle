<template>
  <div v-if="error && !pkg" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="!pkg" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <RouterLink :to="{ name: 'seller-packages' }"><i class="bi bi-arrow-left"></i> {{ t('seller.packages') }}</RouterLink>
    </nav>
    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <div class="mr-number small">#{{ pkg.number }} · {{ f.typeLabel(pkg.type) }} · {{ f.locationLabel(pkg.location) }}</div>
        <h1 class="h4 mb-1">{{ pkg.name }}</h1>
        <StatusBadge :status="pkg.status" />
      </div>
      <div class="d-flex flex-wrap gap-2">
        <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name: 'package', params: { number: pkg.number } }" target="_blank">
          <i class="bi bi-box-arrow-up-right"></i> {{ t('seller.viewPublic') }}
        </RouterLink>
        <div class="dropdown" @focusout="closeMenuLater">
          <button class="btn btn-sm btn-accent dropdown-toggle" @click="menuOpen = !menuOpen">{{ t('seller.statusActions.title') }}</button>
          <ul class="dropdown-menu dropdown-menu-end" :class="{ show: menuOpen }">
            <li v-for="s in statusTargets" :key="s">
              <button class="dropdown-item" @mousedown.prevent="changeStatus(s)">{{ t(`seller.statusActions.${s}`) }}</button>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <button class="dropdown-item text-danger" @mousedown.prevent="removePackage">{{ t('seller.deletePackage') }}</button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <ul class="nav nav-tabs mb-3">
      <li v-for="tb in tabs" :key="tb.key" class="nav-item">
        <button class="nav-link" :class="{ active: tab === tb.key }" @click="setTab(tb.key)">
          {{ t(`seller.tabs.${tb.key}`) }} <span v-if="tb.count !== undefined" class="badge text-bg-light border">{{ tb.count }}</span>
        </button>
      </li>
    </ul>

    <section v-if="tab === 'details'" class="mr-card p-3" style="max-width: 860px">
      <PackageForm v-model="form" />
      <div class="d-flex align-items-center gap-2 mt-3">
        <button class="btn btn-accent btn-sm" :disabled="busy" @click="saveDetails">{{ busy ? t('common.saving') : t('common.save') }}</button>
        <span v-if="savedFlash" class="small text-success">{{ t('seller.saved') }}</span>
      </div>
    </section>

    <section v-else-if="tab === 'lines'">
      <LinesTable ref="linesTable" :loader="loadLines" :attachments="attachments" editable :page-size="100" @edit="editLine" @delete="deleteLine">
        <template #toolbar>
          <button class="btn btn-sm btn-outline-secondary" @click="importing = true"><i class="bi bi-file-earmark-spreadsheet"></i> {{ t('seller.importSpreadsheet') }}</button>
          <button class="btn btn-sm btn-accent" @click="newLine"><i class="bi bi-plus-lg"></i> {{ t('seller.addLine') }}</button>
        </template>
      </LinesTable>
      <LineFormModal v-model:show="lineModal.show" :package-id="pkg.id" :line="lineModal.line" @saved="afterLinesChanged" />
      <ImportWizard v-model:show="importing" :package-id="pkg.id" :package-number="pkg.number" @imported="afterLinesChanged" />
    </section>

    <section v-else-if="tab === 'attachments'">
      <AttachmentsPanel :package-id="pkg.id" @changed="onAttachmentsChanged" />
    </section>

    <section v-else-if="tab === 'links'">
      <AccessLinksPanel :package-id="pkg.id" :package-status="pkg.status" />
    </section>
  </template>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat, STATUSES } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'
import LinesTable from '../../components/LinesTable.vue'
import PackageForm from '../../components/seller/PackageForm.vue'
import LineFormModal from '../../components/seller/LineFormModal.vue'
import ImportWizard from '../../components/seller/ImportWizard.vue'
import AttachmentsPanel from '../../components/seller/AttachmentsPanel.vue'
import AccessLinksPanel from '../../components/seller/AccessLinksPanel.vue'

const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

const pkg = ref(null)
const form = ref({})
const attachments = ref([])
const error = ref('')
const busy = ref(false)
const savedFlash = ref(false)
const menuOpen = ref(false)
const importing = ref(false)
const linesTable = ref(null)
const lineModal = reactive({ show: false, line: null })
const tab = ref(route.query.tab || 'details')

const tabs = computed(() => [
  { key: 'details' },
  { key: 'lines', count: pkg.value?.lineCount },
  { key: 'attachments', count: pkg.value?.attachmentCount },
  { key: 'links', count: pkg.value?.linkCount }
])
const statusTargets = computed(() => STATUSES.filter((s) => s !== pkg.value?.status))

function setTab(key) {
  tab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

async function load() {
  try {
    pkg.value = await api.sellerPackage(route.params.id)
    form.value = { number: pkg.value.number, name: pkg.value.name, type: pkg.value.type, location: pkg.value.location, description: pkg.value.description || '' }
    attachments.value = await api.attachments(route.params.id)
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function saveDetails() {
  busy.value = true
  error.value = ''
  try {
    pkg.value = await api.updatePackage(pkg.value.id, form.value)
    savedFlash.value = true
    setTimeout(() => (savedFlash.value = false), 2000)
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function changeStatus(status) {
  menuOpen.value = false
  error.value = ''
  try {
    pkg.value = await api.setStatus(pkg.value.id, status)
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function removePackage() {
  menuOpen.value = false
  if (!window.confirm(t('seller.deletePackageConfirm', { number: pkg.value.number }))) return
  try {
    await api.deletePackage(pkg.value.id)
    router.replace({ name: 'seller-packages' })
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

function closeMenuLater() {
  setTimeout(() => (menuOpen.value = false), 150)
}

const loadLines = (params) => api.sellerLines(route.params.id, params)

function newLine() {
  lineModal.line = null
  lineModal.show = true
}
function editLine(line) {
  lineModal.line = line
  lineModal.show = true
}
async function deleteLine(line) {
  if (!window.confirm(t('seller.deleteLineConfirm', { itemNo: line.itemNo }))) return
  try {
    await api.deleteLine(line.id)
    await afterLinesChanged()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function afterLinesChanged() {
  linesTable.value?.reload()
  pkg.value = await api.sellerPackage(route.params.id)
  attachments.value = await api.attachments(route.params.id)
}

async function onAttachmentsChanged(list) {
  attachments.value = list
  pkg.value = await api.sellerPackage(route.params.id)
}

watch(() => route.params.id, load, { immediate: true })
</script>
