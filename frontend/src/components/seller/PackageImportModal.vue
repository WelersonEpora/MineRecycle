<template>
  <ModalDialog :show="show" :title="packageId ? t('pkgImport.titleOne', { number: packageNumber }) : t('pkgImport.title')" size="xl" persistent scrollable @update:show="close">
    <ol class="d-flex gap-4 list-unstyled small mb-3">
      <li :class="step === 1 ? 'fw-bold' : 'text-secondary'">{{ t('pkgImport.step1') }}</li>
      <li :class="step === 2 ? 'fw-bold' : 'text-secondary'">{{ t('pkgImport.step2') }}</li>
    </ol>

    <!-- 1. Arquivo -->
    <div v-if="step === 1">
      <p class="small">{{ packageId ? t('pkgImport.chooseFileOne') : t('pkgImport.chooseFile') }}</p>
      <input type="file" class="form-control" accept=".xlsx,.xls" :aria-label="t('pkgImport.step1')" @change="file = $event.target.files[0]" />
    </div>

    <!-- 2. Verificação -->
    <div v-else-if="report">
      <div class="alert py-2 small" :class="report.canImport ? 'alert-success' : 'alert-danger'">
        <i class="bi" :class="report.canImport ? 'bi-check-circle' : 'bi-x-octagon'"></i>
        {{ t('pkgImport.summary', { create: report.summary.create, update: report.summary.update, unchanged: report.summary.unchanged }) }}
        <span v-if="!packageId"> {{ t('pkgImport.scope') }}</span>
        <div v-if="!report.canImport" class="fw-semibold mt-1">{{ t('pkgImport.blocked') }}</div>
      </div>

      <!-- Problemas: impedem (vermelho), pedem confirmação (amarelo), informam (cinza) -->
      <div v-for="g in report.issues" :key="`${g.level}:${g.code}`" class="alert py-2 small" :class="LEVEL_CLASS[g.level]">
        <div class="fw-semibold mb-1">
          <i class="bi" :class="LEVEL_ICON[g.level]"></i> {{ t(`pkgImport.groups.${g.code}`) }}
          <span v-if="g.total > 1" class="badge text-bg-light border ms-1">{{ g.total }}</span>
        </div>
        <ul v-if="g.level !== 'confirm'" class="mb-0 ps-3">
          <li v-for="(i, n) in g.items" :key="n">{{ issueText(i) }}</li>
          <li v-if="g.total > g.items.length" class="text-secondary">{{ t('import.moreNotShown', { n: g.total - g.items.length }) }}</li>
        </ul>
        <template v-else>
          <div v-for="i in g.items" :key="i.key" class="form-check mb-0">
            <input :id="`mr-pi-${i.key}`" v-model="confirmed" class="form-check-input" type="checkbox" :value="i.key" />
            <label class="form-check-label" :for="`mr-pi-${i.key}`">{{ issueText(i) }}</label>
          </div>
        </template>
      </div>

      <!-- O que muda em cada pacote -->
      <div v-if="report.packages.length" class="table-responsive mr-card">
        <table class="table table-sm align-middle small mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ t('seller.fields.number') }}</th>
              <th>{{ t('pkgImport.package') }}</th>
              <th>{{ t('pkgImport.action') }}</th>
              <th>{{ t('pkgImport.changes') }}</th>
              <th>{{ t('pkgImport.items') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedPackages" :key="`${p.number}-${p.row}`" :class="{ 'text-secondary': p.action === 'unchanged' }">
              <td class="mr-mono text-nowrap">{{ p.number ?? '—' }}</td>
              <td>
                {{ p.name }}
                <StatusBadge v-if="p.status !== 'active'" :status="p.status" class="ms-1" />
              </td>
              <td><span class="badge" :class="ACTION_CLASS[p.action]">{{ t(`pkgImport.actions.${p.action}`) }}</span></td>
              <td>
                <div v-for="c in p.changes" :key="c.field">
                  <span class="fw-medium">{{ fieldLabel(c.field) }}:</span>
                  <span class="text-decoration-line-through text-secondary">{{ display(c.field, c.from) }}</span>
                  → {{ display(c.field, c.to) }}
                </div>
              </td>
              <td class="text-nowrap">
                <template v-if="!p.items">{{ t('pkgImport.itemsKept') }}</template>
                <template v-else>
                  {{ p.items.before }} → {{ p.items.after }}
                  <div v-if="p.items.changedAny" class="text-secondary">
                    {{ t('pkgImport.itemsDelta', { added: p.items.added, removed: p.items.removed, changed: p.items.changed }) }}
                    <span v-if="p.items.reordered"> · {{ t('pkgImport.reordered') }}</span>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">{{ error }}</div>

    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">{{ t('common.cancel') }}</button>
      <template v-if="step === 1">
        <button class="btn btn-accent btn-sm" :disabled="!file || busy" @click="verify">
          <span v-if="busy" class="spinner-border spinner-border-sm me-1"></span>{{ t('pkgImport.verify') }}
        </button>
      </template>
      <template v-else>
        <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="back">{{ t('pkgImport.otherFile') }}</button>
        <button class="btn btn-accent btn-sm" :disabled="!canCommit || busy" @click="commit">
          <span v-if="busy" class="spinner-border spinner-border-sm me-1"></span>{{ t('pkgImport.commit') }}
        </button>
      </template>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../../composables/useFormat.js'
import { notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import ModalDialog from '../ModalDialog.vue'
import StatusBadge from '../StatusBadge.vue'

// Importação de pacotes pela planilha do sistema. Sem packageId: "Importar pacotes" (lista). Com packageId:
// "Importar pacote" (só o pacote aberto). Nada é gravado antes de "Importar"; as regras ficam no backend
// (import/package-plan.js).
const props = defineProps({
  show: { type: Boolean, default: false },
  packageId: { type: String, default: null },
  packageNumber: { type: Number, default: null }
})
const emit = defineEmits(['update:show', 'imported'])
const f = useFormat()
const t = f.t
const { locale } = useI18n()

const LEVEL_CLASS = { error: 'alert-danger', confirm: 'alert-warning', info: 'alert-light border' }
const LEVEL_ICON = { error: 'bi-x-octagon', confirm: 'bi-exclamation-triangle', info: 'bi-info-circle' }
const ACTION_CLASS = { create: 'text-bg-success', update: 'text-bg-primary', unchanged: 'text-bg-light border' }
const ACTION_ORDER = { create: 0, update: 1, unchanged: 2 }
// Campos do pacote e dos itens -> rótulo da tela.
const PACKAGE_FIELD_KEYS = {
  name: 'seller.fields.name',
  type: 'seller.fields.type',
  category: 'seller.fields.category',
  origin: 'seller.fields.origin',
  originId: 'seller.fields.origin',
  locations: 'seller.fields.location',
  description: 'seller.fields.description',
  storFolder: 'seller.fields.storFolder',
  storNumbers: 'seller.fields.storNumbers',
  storDocuments: 'seller.fields.storDocuments',
  storDocumentsPending: 'pkgImport.pendingDocuments'
}

const step = ref(1)
const file = ref(null)
const report = ref(null)
const confirmed = ref([])
const busy = ref(false)
const error = ref('')

const canCommit = computed(() => report.value?.canImport && report.value.confirmKeys.every((k) => confirmed.value.includes(k)))
const sortedPackages = computed(() => [...(report.value?.packages || [])].sort((a, b) => ACTION_ORDER[a.action] - ACTION_ORDER[b.action]))

function reset() {
  step.value = 1
  file.value = null
  report.value = null
  confirmed.value = []
  error.value = ''
}

const labelOf = (c) => (typeof c === 'string' ? c : c?.[locale.value] || c?.en || '')
const fieldLabel = (field) => {
  if (!field) return ''
  if (PACKAGE_FIELD_KEYS[field]) return t(PACKAGE_FIELD_KEYS[field])
  return t(`lines.${field}`)
}

// Valor de um campo do pacote para a coluna "o que muda".
function display(field, v) {
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '—'
  if (field === 'type') return f.typeLabel(v)
  if (field === 'category') return f.categoryLabel(v)
  if (field === 'locations') return f.locationsLabel(v)
  if (Array.isArray(v)) return v.join(', ')
  const s = String(v)
  return s.length > 80 ? `${s.slice(0, 77)}…` : s
}

function pkgRef(p) {
  if (!p) return ''
  const name = p.name ? ` ${p.name}` : ''
  return p.number !== null && p.number !== undefined ? `#${p.number}${name}` : name.trim()
}

function reasonText(i) {
  if (!i.reason) return ''
  return i.code.startsWith('item_') ? t(`import.codes.${i.reason}`) : t(`pkgImport.reasons.${i.reason}`)
}

function issueText(i) {
  return t(`pkgImport.issues.${i.code}`, {
    row: i.row ?? '',
    pkg: pkgRef(i.package || i),
    value: i.value ?? '',
    field: fieldLabel(i.field),
    reason: reasonText(i),
    count: i.count ?? '',
    column: labelOf(i.column),
    columns: (i.columns || []).map(labelOf).join(', '),
    status: i.status ? f.statusLabel(i.status) : '',
    updatedAt: i.updatedAt ? f.dateTime(i.updatedAt) : '',
    firstRow: i.firstRow ?? '',
    other: pkgRef(i.other),
    number: i.number ?? '',
    name: i.name ?? ''
  })
}

function cancelPending() {
  if (report.value?.importId) api.cancelPackageImport(report.value.importId).catch(() => {})
}

async function verify() {
  busy.value = true
  error.value = ''
  try {
    report.value = await api.startPackageImport(file.value, props.packageId)
    confirmed.value = []
    step.value = 2
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

function back() {
  cancelPending()
  reset()
}

async function commit() {
  busy.value = true
  error.value = ''
  try {
    const r = await api.commitPackageImport(report.value.importId, {
      fingerprint: report.value.fingerprint,
      confirmed: confirmed.value,
      packageId: props.packageId || undefined
    })
    notify(t('pkgImport.done', { created: r.created.length, updated: r.updated.length }))
    emit('imported', r)
    emit('update:show', false)
  } catch (err) {
    // Os pacotes mudaram depois da verificação: mostra a verificação nova e pede as confirmações de novo.
    const stale = err?.response?.data?.error
    if (stale?.code === 'PACKAGE_IMPORT_STALE' && stale.details?.importId) {
      report.value = stale.details
      confirmed.value = []
    }
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

function close() {
  if (busy.value) return
  cancelPending()
  emit('update:show', false)
}

watch(
  () => props.show,
  (open) => open && reset()
)
</script>
