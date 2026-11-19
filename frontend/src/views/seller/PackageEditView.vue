<template>
  <div v-if="error && !pkg" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="!pkg" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <RouterLink :to="{ name: 'seller-packages' }"><i class="bi bi-arrow-left"></i> {{ t('seller.packages') }}</RouterLink>
    </nav>
    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <div class="mr-number small">{{ t('seller.fields.number') }} {{ pkg.number }} ·{{ f.typeLabel(pkg.type) }} · {{ f.locationsLabel(pkg.locations) }}</div>
        <h1 class="h4 mb-1">{{ pkg.name }}</h1>
        <div v-if="pkg.storFolder || pkg.storNumbers?.length" class="small text-secondary mb-1">
          <i class="bi bi-folder2"></i> <span class="mr-mono">{{ pkg.storFolder }}</span>
          <span v-if="pkg.storNumbers?.length"> · {{ t('seller.fields.storNumbersShort') }} {{ pkg.storNumbers.join('-') }}</span>
        </div>
        <div v-if="pkg.storDocuments?.length" class="small text-secondary mr-mono mb-1">
          <i class="bi bi-file-earmark-spreadsheet"></i> {{ t('seller.storShort') }}
          <span v-for="(d, i) in pkg.storDocuments" :key="d"
            >{{ i ? ' · ' : '' }}{{ d }}<span v-if="pkg.storDocumentsPending?.includes(d)" class="badge text-bg-warning ms-1">{{ t('seller.pendingShort') }}</span></span
          >
        </div>
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

    <!-- Detalhes: só leitura; a edição abre num modal (Cancelar/Salvar), como em Itens e em Novo pacote. -->
    <section v-if="tab === 'details'" class="mr-card p-3 d-flex flex-column-reverse flex-sm-row align-items-sm-start gap-2" style="max-width: 860px">
      <dl class="mr-details flex-grow-1">
        <dt>{{ t('seller.fields.name') }}</dt>
        <dd>{{ pkg.name }}</dd>
        <dt>{{ t('seller.fields.storFolder') }}</dt>
        <dd class="mr-mono">{{ pkg.storFolder || '—' }}</dd>
        <dt>{{ t('seller.fields.storNumbers') }}</dt>
        <dd class="mr-mono">{{ pkg.storNumbers?.length ? pkg.storNumbers.join(', ') : '—' }}</dd>
        <dt>{{ t('seller.fields.type') }}</dt>
        <dd>{{ f.typeLabel(pkg.type) }}</dd>
        <dt>{{ t('seller.fields.category') }}</dt>
        <dd>{{ f.categoryLabel(pkg.category) }}</dd>
        <dt>{{ t('seller.fields.origin') }}</dt>
        <dd>{{ pkg.origin ? `${pkg.origin.name} (${pkg.origin.code})` : '—' }}</dd>
        <dt>{{ t('seller.fields.location') }}</dt>
        <dd>
          <span v-for="l in pkg.locations" :key="l" class="badge rounded-pill text-bg-light border me-1">{{ f.locationLabel(l) }}</span>
          <span v-if="!pkg.locations?.length">—</span>
        </dd>
        <dt>{{ t('seller.fields.storDocuments') }}</dt>
        <dd class="mr-mono">
          <span v-for="(d, i) in pkg.storDocuments" :key="d"
            >{{ i ? ', ' : '' }}{{ d }}<span v-if="pkg.storDocumentsPending?.includes(d)" class="badge text-bg-warning ms-1">{{ t('seller.pendingShort') }}</span></span
          >
          <span v-if="!pkg.storDocuments?.length">—</span>
        </dd>
        <dt>{{ t('seller.fields.description') }}</dt>
        <dd style="white-space: pre-line">{{ pkg.description || '—' }}</dd>
        <dt>{{ t('seller.fields.number') }}</dt>
        <dd>{{ pkg.number }}</dd>
      </dl>
      <button class="btn btn-accent btn-sm align-self-end align-self-sm-start text-nowrap" @click="openEdit"><i class="bi bi-pencil"></i> {{ t('common.edit') }}</button>
    </section>

    <section v-else-if="tab === 'lines'">
      <LinesTable ref="linesTable" :loader="loadLines" :attachments="attachments" editable :page-size="100" @edit="editLine" @delete="deleteLine">
        <template #toolbar>
          <button class="btn btn-sm btn-outline-secondary" @click="importing = true"><i class="bi bi-file-earmark-spreadsheet"></i> {{ t('seller.importSpreadsheet') }}</button>
          <button class="btn btn-sm btn-accent" @click="newLine"><i class="bi bi-plus-lg"></i> {{ t('seller.addLine') }}</button>
        </template>
      </LinesTable>
      <LineFormModal v-model:show="lineModal.show" :package-id="pkg.id" :line="lineModal.line" @saved="afterLinesChanged" />
      <ImportWizard v-model:show="importing" :package-id="pkg.id" :package-number="pkg.number" :package-name="pkg.name" @imported="afterLinesChanged" />
    </section>

    <section v-else-if="tab === 'attachments'">
      <AttachmentsPanel :package-id="pkg.id" @changed="onAttachmentsChanged" />
    </section>

    <section v-else-if="tab === 'links'">
      <AccessLinksPanel :package-id="pkg.id" :package-status="pkg.status" />
    </section>

    <!-- Edição dos detalhes. Persistente: clique fora e Esc não fecham, para não perder o que foi digitado. -->
    <ModalDialog v-model:show="editing" :title="t('seller.editDetails')" size="lg" persistent scrollable>
      <PackageForm v-model="form" number-locked />
      <div v-if="editError" class="alert alert-danger py-2 small mt-3">{{ editError }}</div>
      <template #footer>
        <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="editing = false">{{ t('common.cancel') }}</button>
        <button class="btn btn-accent btn-sm" :disabled="busy" @click="saveDetails">{{ busy ? t('common.saving') : t('common.save') }}</button>
      </template>
    </ModalDialog>
  </template>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat, STATUSES } from '../../composables/useFormat.js'
import { confirmDialog, notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'
import ModalDialog from '../../components/ModalDialog.vue'
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
const editing = ref(false)
const editError = ref('')
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
    attachments.value = await api.attachments(route.params.id)
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

// Cada abertura parte do que está gravado: Cancelar descarta de fato.
function openEdit() {
  const p = pkg.value
  form.value = { number: p.number, name: p.name, type: p.type, category: p.category || 'other', originId: p.originId || '', locations: [...(p.locations || [])], storDocuments: [...(p.storDocuments || [])], storDocumentsPending: [...(p.storDocumentsPending || [])], storFolder: p.storFolder || '', storNumbers: [...(p.storNumbers || [])], description: p.description || '' }
  editError.value = ''
  editing.value = true
}

// Erro mantém o modal aberto, com o que foi digitado.
async function saveDetails() {
  busy.value = true
  editError.value = ''
  try {
    pkg.value = await api.updatePackage(pkg.value.id, form.value)
    editing.value = false
    notify(t('seller.saved'))
  } catch (err) {
    editError.value = f.errorMessage(err)
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
  const ok = await confirmDialog({
    title: t('seller.deletePackageTitle'),
    message: t('seller.deletePackageConfirm', { name: pkg.value.name }),
    confirmLabel: t('seller.deletePackageTitle'),
    requireText: pkg.value.name
  })
  if (!ok) return
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
  const ok = await confirmDialog({
    title: t('seller.deleteLineTitle'),
    message: t('seller.deleteLineConfirm', { itemNo: line.itemNo }),
    confirmLabel: t('common.delete')
  })
  if (!ok) return
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
