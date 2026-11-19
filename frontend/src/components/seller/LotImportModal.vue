<template>
  <ModalDialog :show="show" :title="t('lotImport.title')" size="xl" persistent scrollable @update:show="close">
    <p class="small text-secondary">{{ t('lotImport.intro') }}</p>
    <div class="d-flex flex-wrap align-items-end gap-2 mb-3">
      <div>
        <input ref="fileInput" type="file" accept=".xlsx,.xlsm,.xls" class="d-none" @change="onPick" />
        <button class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="fileInput?.click()"><i class="bi bi-file-earmark-spreadsheet"></i> {{ t('lotImport.chooseFile') }}</button>
        <span v-if="fileName" class="small ms-2">{{ fileName }}</span>
      </div>
      <div v-if="report?.sheets?.length > 1">
        <label class="form-label small mb-1" for="mr-lot-sheet">{{ t('lotImport.sheet') }}</label>
        <select id="mr-lot-sheet" :value="report.sheet" class="form-select form-select-sm" :disabled="busy" @change="changeSheet($event.target.value)">
          <option v-for="s in report.sheets" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <span v-if="report?.headerRow" class="small text-secondary mb-1">{{ t('lotImport.headerRow', { row: report.headerRow }) }}</span>
    </div>

    <p v-if="busy && !report" class="text-secondary small">{{ t('lotImport.reading') }}</p>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <template v-if="report">
      <div v-if="!report.canCommit" class="alert alert-danger small">
        <div class="fw-medium mb-1">{{ t('lotImport.blocked') }}</div>
        <ul class="mb-0">
          <li v-for="(e, i) in report.errors.items" :key="i">
            <span v-if="e.row" class="mr-mono">{{ t('lotImport.errorRow', { row: e.row }) }}: </span>{{ errorText(e) }}
          </li>
          <li v-if="report.errors.total > report.errors.items.length">{{ t('lotImport.more', { n: report.errors.total - report.errors.items.length }) }}</li>
        </ul>
      </div>

      <template v-else>
        <h3 class="h6">{{ t('lotImport.summaryTitle') }}</h3>
        <div class="row g-2 mb-3 small">
          <div v-for="c in counters" :key="c.key" class="col-6 col-md-3">
            <div class="mr-card p-2 h-100">
              <div class="fs-5 fw-semibold">{{ c.value }}</div>
              <div class="text-secondary">{{ t(`lotImport.${c.key}`) }}</div>
            </div>
          </div>
        </div>
        <p v-if="nothing" class="alert alert-light border small">{{ t('lotImport.nothing') }}</p>

        <details v-if="report.statusChanges.total" class="mb-2" open>
          <summary class="small fw-medium">{{ t('lotImport.statusChanges') }} ({{ report.statusChanges.total }})</summary>
          <ul class="small mb-0">
            <li v-for="s in report.statusChanges.items" :key="s.lotNumber">
              <span class="mr-mono">{{ s.lotNumber }}</span>: {{ s.from ? f.lotStatusLabel(s.from) : '—' }} → {{ f.lotStatusLabel(s.to) }}
            </li>
          </ul>
        </details>
        <details v-if="report.disagreements.total" class="mb-2" open>
          <summary class="small fw-medium">{{ t('lotImport.disagreements') }} ({{ report.disagreements.total }})</summary>
          <p class="small text-secondary mb-1">{{ t('lotImport.disagreementsHint') }}</p>
          <ul class="small mb-0">
            <li v-for="d in report.disagreements.items" :key="d.lotNumber"><span class="mr-mono">{{ d.lotNumber }}</span></li>
          </ul>
        </details>
        <details v-if="report.packages.create.length" class="mb-2">
          <summary class="small fw-medium">{{ t('lotImport.packagesCreated') }} ({{ report.packages.create.length }})</summary>
          <ul class="small mb-0">
            <li v-for="p in report.packages.create" :key="p.source + p.sourceValue">{{ f.sourceLabel(p.source) }}: {{ p.sourceValue }} ({{ t('lots.total', { n: p.lotCount }, p.lotCount) }})</li>
          </ul>
        </details>
        <details v-if="report.packages.update.length" class="mb-2">
          <summary class="small fw-medium">{{ t('lotImport.packagesUpdated') }} ({{ report.packages.update.length }})</summary>
          <ul class="small mb-0">
            <li v-for="p in report.packages.update" :key="p.packageId">
              {{ p.name }} ({{ f.sourceLabel(p.source) }}): {{ t('lotImport.lotsChange', { added: p.added, removed: p.removed, total: p.lotCount }) }}
            </li>
          </ul>
        </details>
        <details v-if="report.packages.emptied.length" class="mb-2" open>
          <summary class="small fw-medium">{{ t('lotImport.packagesEmptied') }} ({{ report.packages.emptied.length }})</summary>
          <ul class="small mb-0">
            <li v-for="p in report.packages.emptied" :key="p.packageId">{{ p.name }} ({{ f.sourceLabel(p.source) }})</li>
          </ul>
        </details>
        <details v-if="report.updated.total" class="mb-2">
          <summary class="small fw-medium">{{ t('lotImport.updated') }} ({{ report.updated.total }})</summary>
          <ul class="small mb-0">
            <li v-for="u in report.updated.items" :key="u.lotNumber">
              <span class="mr-mono">{{ u.lotNumber }}</span><template v-if="u.restored"> · {{ t('lotImport.restored') }}</template>
              <span v-for="(c, field) in u.changes" :key="field" class="text-secondary"> · {{ fieldLabel(field) }}: {{ value(field, c.from) }} → {{ value(field, c.to) }}</span>
            </li>
            <li v-if="report.updated.total > report.updated.items.length">{{ t('lotImport.more', { n: report.updated.total - report.updated.items.length }) }}</li>
          </ul>
        </details>
        <details v-if="report.withdrawn.total" class="mb-2">
          <summary class="small fw-medium">{{ t('lotImport.withdrawn') }} ({{ report.withdrawn.total }})</summary>
          <ul class="small mb-0">
            <li v-for="w in report.withdrawn.items" :key="w.lotNumber"><span class="mr-mono">{{ w.lotNumber }}</span></li>
          </ul>
        </details>
      </template>
    </template>

    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" :disabled="committing" @click="close">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="busy || !report?.canCommit || nothing" @click="commit">{{ committing ? t('common.saving') : t('lotImport.confirm') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import ModalDialog from '../ModalDialog.vue'

// Importação de lotes pela planilha da Horizonte: enviar, conferir a prévia (nada gravado) e confirmar. O commit só
// grava se nada mudou desde a prévia (impressão digital); senão, a API pede para conferir de novo (IMPORT_STALE).
const props = defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['update:show', 'imported'])
const f = useFormat()
const t = f.t

const fileInput = ref(null)
const fileName = ref('')
const report = ref(null)
const busy = ref(false)
const committing = ref(false)
const error = ref('')

const FIELD_LABELS = {
  lotNumber: 'lots.lotNumber',
  siteName: 'lots.site',
  title: 'lots.title',
  masterSupplier: 'lots.supplier',
  linkedSystem: 'lots.linkedSystem',
  commercialFamily: 'lots.family',
  subfamily: 'lots.subfamily',
  status: 'lots.status',
  sheetStatus: 'lots.sheetStatus'
}
const fieldLabel = (field) => (FIELD_LABELS[field] ? t(FIELD_LABELS[field]) : field)
const value = (field, v) => {
  if (v === null || v === undefined) return '—'
  return field === 'status' || field === 'sheetStatus' ? f.lotStatusLabel(v) : v
}

const counters = computed(() => {
  const s = report.value?.summary || {}
  return [
    { key: 'created', value: s.created },
    { key: 'updated', value: s.updated },
    { key: 'withdrawn', value: s.withdrawn },
    { key: 'unchanged', value: s.unchanged },
    { key: 'packagesCreated', value: s.packagesCreated },
    { key: 'packagesUpdated', value: s.packagesUpdated },
    { key: 'packagesEmptied', value: s.packagesEmptied }
  ]
})
const nothing = computed(() => {
  const s = report.value?.summary
  return Boolean(s) && !s.created && !s.updated && !s.withdrawn && !s.packagesCreated && !s.packagesUpdated
})

function errorText(e) {
  return t(`lotImport.codes.${e.code}`, { ...e, field: fieldLabel(e.field), fields: (e.fields || []).map(fieldLabel).join(', ') })
}

async function onPick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  await discard()
  fileName.value = file.name
  busy.value = true
  error.value = ''
  try {
    report.value = await api.startLotImport(file)
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function changeSheet(sheet) {
  busy.value = true
  error.value = ''
  try {
    report.value = await api.lotImportPreview(report.value.importId, { sheet })
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function commit() {
  busy.value = true
  committing.value = true
  error.value = ''
  try {
    const { summary } = await api.lotImportCommit(report.value.importId, { sheet: report.value.sheet, fingerprint: report.value.fingerprint })
    notify(t('lotImport.done', { created: summary.created, updated: summary.updated, withdrawn: summary.withdrawn, packages: summary.packagesCreated }))
    report.value = null
    emit('imported')
    emit('update:show', false)
  } catch (err) {
    error.value = f.errorMessage(err)
    // Prévia velha: refaz para o vendedor conferir de novo.
    if (err.response?.data?.error?.code === 'IMPORT_STALE') await changeSheet(report.value.sheet)
  } finally {
    busy.value = false
    committing.value = false
  }
}

// Fechar descarta o arquivo guardado no servidor.
async function discard() {
  if (report.value?.importId) await api.cancelLotImport(report.value.importId).catch(() => {})
  report.value = null
}

async function close() {
  if (committing.value) return
  await discard()
  emit('update:show', false)
}

watch(
  () => props.show,
  (open) => {
    if (!open) return
    fileName.value = ''
    report.value = null
    error.value = ''
  }
)
</script>
