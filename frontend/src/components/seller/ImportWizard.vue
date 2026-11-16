<template>
  <ModalDialog :show="show" :title="t('import.title')" size="xl" persistent @update:show="close">
    <ol class="d-flex gap-4 list-unstyled small mb-3">
      <li :class="step === 1 ? 'fw-bold' : 'text-secondary'">{{ t('import.step1') }}</li>
      <li :class="step === 2 ? 'fw-bold' : 'text-secondary'">{{ t('import.step2') }}</li>
      <li :class="step === 3 ? 'fw-bold' : 'text-secondary'">{{ t('import.step3') }}</li>
    </ol>

    <!-- 1. Arquivo -->
    <div v-if="step === 1">
      <p class="small">{{ t('import.chooseFile') }}</p>
      <input type="file" class="form-control" accept=".xlsx,.xls" @change="file = $event.target.files[0]" />
    </div>

    <!-- 2. Colunas -->
    <div v-else-if="step === 2 && layout">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label small">{{ t('import.sheet') }}</label>
          <select v-model="sheet" class="form-select form-select-sm" @change="relayout(false)">
            <option v-for="s in layout.sheets" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small">{{ t('import.headerRow') }}</label>
          <input v-model.number="headerRow" type="number" min="1" class="form-control form-control-sm" @change="relayout(true)" />
        </div>
        <div class="col-md-5 form-text align-self-end">{{ t('import.headerRowHint') }}</div>
      </div>

      <h3 class="h6">{{ t('import.previewTitle') }}</h3>
      <div class="table-responsive border rounded mb-3" style="max-height: 260px">
        <table class="table table-sm mb-0 mr-preview-table">
          <thead class="table-light">
            <tr>
              <th class="text-secondary">#</th>
              <th v-for="h in layout.headers" :key="h.index" class="text-secondary">{{ h.letter }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in layout.preview" :key="r.rowNumber" :class="{ 'mr-header-row': r.rowNumber === layout.headerRow }">
              <td class="text-secondary">{{ r.rowNumber }}</td>
              <td v-for="(c, i) in r.cells" :key="i" :title="c ?? ''">{{ c }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="h6">{{ t('import.mapping') }}</h3>
      <div class="row g-2 mb-3">
        <div v-for="field in FIELDS" :key="field.key" class="col-md-6 col-lg-3">
          <label class="form-label small mb-1">
            {{ t(`lines.${field.key}`) }}
            <span v-if="field.required" class="text-danger">*</span>
          </label>
          <select v-model="mapping[field.key]" class="form-select form-select-sm">
            <option :value="null">{{ t('import.notMapped') }}</option>
            <option v-for="h in layout.headers" :key="h.index" :value="h.index">{{ h.letter }}{{ h.label ? ` · ${h.label}` : '' }}</option>
          </select>
        </div>
      </div>
      <div class="form-check">
        <input id="mr-hier" v-model="inferHierarchy" class="form-check-input" type="checkbox" />
        <label class="form-check-label small" for="mr-hier">{{ t('import.inferHierarchy') }}</label>
      </div>
      <div class="form-check">
        <input id="mr-keep" v-model="keepFile" class="form-check-input" type="checkbox" />
        <label class="form-check-label small" for="mr-keep">{{ t('import.keepFile') }}</label>
      </div>
    </div>

    <!-- 3. Conferência -->
    <div v-else-if="step === 3 && report">
      <p class="fw-medium">
        {{ t('import.summary', { valid: report.stats.validRows, total: report.stats.dataRows, invalid: report.stats.invalidRows, children: report.stats.childLines }) }}
      </p>
      <div v-if="report.existingLineCount" class="alert alert-warning py-2 small">
        <i class="bi bi-exclamation-triangle"></i> {{ t('import.replaceWarning', { n: report.existingLineCount }) }}
        <span v-if="report.linkedAttachmentCount"><br />{{ t('import.linkedWarning', { n: report.linkedAttachmentCount }) }}</span>
      </div>
      <div v-if="unknownUnits.length" class="small mb-3">
        {{ t('import.unknownUnits') }}
        <span v-for="[u, n] in unknownUnits" :key="u" class="badge text-bg-light border me-1">{{ u }} ({{ n }})</span>
      </div>

      <div v-if="report.errorCount" class="mb-3">
        <h3 class="h6 text-danger">{{ t('import.errors') }} ({{ report.errorCount }})</h3>
        <ProblemTable :items="report.errors" :total="report.errorCount" />
      </div>
      <details v-if="report.warningCount" class="mb-3">
        <summary class="h6 text-warning-emphasis">{{ t('import.warnings') }} ({{ report.warningCount }})</summary>
        <ProblemTable :items="report.warnings" :total="report.warningCount" />
      </details>

      <h3 class="h6">{{ t('import.sampleLines') }}</h3>
      <div class="table-responsive border rounded mb-3">
        <table class="table table-sm mb-0 mr-lines">
          <thead class="table-light">
            <tr>
              <th>{{ t('import.row') }}</th>
              <th>{{ t('lines.itemNo') }}</th>
              <th>{{ t('lines.description') }}</th>
              <th class="mr-num">{{ t('lines.quantity') }}</th>
              <th>{{ t('lines.unit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in report.sampleLines" :key="l.sourceRow" :class="{ 'mr-child': l.parentItemNo }">
              <td class="text-secondary">{{ l.sourceRow }}</td>
              <td class="mr-mono">{{ l.itemNo }}</td>
              <td><span v-if="l.parentItemNo" class="text-secondary me-1">↳</span>{{ l.description }}</td>
              <td class="mr-num">{{ f.qty(l.quantity) }}</td>
              <td>{{ l.unit }} <span v-if="l.unitRaw && l.unitRaw !== l.unit" class="text-secondary small">({{ l.unitRaw }})</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="report.errorCount" class="form-check">
        <input id="mr-skip" v-model="skipInvalid" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="mr-skip">{{ t('import.skipInvalid') }}</label>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">{{ error }}</div>

    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">{{ t('common.cancel') }}</button>
      <button v-if="step > 1" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="step--">{{ t('common.back') }}</button>
      <button v-if="step === 1" class="btn btn-accent btn-sm" :disabled="!file || busy" @click="upload">{{ t('import.readFile') }}</button>
      <button v-if="step === 2" class="btn btn-accent btn-sm" :disabled="busy" @click="check">{{ t('import.check') }}</button>
      <button v-if="step === 3" class="btn btn-accent btn-sm" :disabled="busy || !canCommit" @click="commit">
        {{ t('import.commit', { n: report.stats.validRows }) }}
      </button>
      <span v-if="busy" class="spinner-border spinner-border-sm align-self-center"></span>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, h, reactive, ref, watch } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'
import ModalDialog from '../ModalDialog.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  packageId: { type: String, required: true },
  packageNumber: { type: Number, required: true }
})
const emit = defineEmits(['update:show', 'imported'])
const f = useFormat()
const t = f.t

const FIELDS = [
  { key: 'itemNo', required: true },
  { key: 'description', required: true },
  { key: 'quantity', required: true },
  { key: 'unit', required: true },
  { key: 'storCode' },
  { key: 'tag' },
  { key: 'warehouseLocation' }
]

const step = ref(1)
const file = ref(null)
const layout = ref(null)
const sheet = ref('')
const headerRow = ref(1)
const mapping = reactive({})
const inferHierarchy = ref(true)
const keepFile = ref(true)
const skipInvalid = ref(false)
const report = ref(null)
const error = ref('')
const busy = ref(false)

const unknownUnits = computed(() => Object.entries(report.value?.stats.unknownUnits || {}))
const canCommit = computed(() => report.value && report.value.stats.validRows > 0 && (!report.value.errorCount || skipInvalid.value))

function reset() {
  step.value = 1
  file.value = null
  layout.value = null
  report.value = null
  error.value = ''
  skipInvalid.value = false
  inferHierarchy.value = true
  keepFile.value = true
}

function applyLayout(l) {
  layout.value = l
  sheet.value = l.sheet
  headerRow.value = l.headerRow
  for (const fd of FIELDS) mapping[fd.key] = l.suggestedMapping[fd.key] ?? null
}

async function run(fn) {
  busy.value = true
  error.value = ''
  try {
    await fn()
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

const options = () => ({
  sheet: sheet.value,
  headerRow: headerRow.value,
  mapping: { ...mapping },
  inferHierarchy: inferHierarchy.value,
  keepFile: keepFile.value,
  skipInvalid: skipInvalid.value,
  fileName: file.value?.name
})

const upload = () =>
  run(async () => {
    applyLayout(await api.startImport(props.packageId, file.value))
    step.value = 2
  })

const relayout = (keepHeader) =>
  run(async () => {
    applyLayout(
      await api.importLayout(props.packageId, layout.value.importId, { sheet: sheet.value, headerRow: keepHeader ? headerRow.value : undefined })
    )
  })

const check = () =>
  run(async () => {
    report.value = await api.importPreview(props.packageId, layout.value.importId, options())
    skipInvalid.value = false
    step.value = 3
  })

const commit = () =>
  run(async () => {
    const r = await api.importCommit(props.packageId, layout.value.importId, options())
    layout.value = null
    emit('imported', r)
    emit('update:show', false)
    window.alert(t('import.done', { n: r.inserted }))
  })

function close() {
  if (busy.value) return
  if (layout.value?.importId) api.cancelImport(props.packageId, layout.value.importId).catch(() => {})
  emit('update:show', false)
}

watch(
  () => props.show,
  (open) => open && reset()
)

// Tabela de erros/avisos (componente local).
const ProblemTable = (p) => {
  const fieldLabel = (fd) => (fd ? t(`lines.${fd}`) : '')
  const rows = p.items.map((i) =>
    h('tr', { key: `${i.row}-${i.field}-${i.code}` }, [
      h('td', { class: 'text-secondary' }, String(i.row)),
      h('td', fieldLabel(i.field)),
      h('td', [t(`import.codes.${i.code}`), i.value ? h('span', { class: 'text-secondary ms-1' }, `(${i.value})`) : null])
    ])
  )
  return h('div', { class: 'table-responsive border rounded', style: 'max-height: 220px' }, [
    h('table', { class: 'table table-sm mb-0 small' }, [
      h('thead', { class: 'table-light' }, h('tr', [h('th', t('import.row')), h('th', t('import.field')), h('th', t('import.problem'))])),
      h('tbody', rows)
    ]),
    p.total > p.items.length ? h('div', { class: 'small text-secondary p-2' }, t('import.moreNotShown', { n: p.total - p.items.length })) : null
  ])
}
ProblemTable.props = ['items', 'total']
</script>
