<template>
  <div v-if="error && !lot" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="!lot" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <a href="#" @click.prevent="back"><i class="bi bi-arrow-left"></i> {{ t('lots.back') }}</a>
    </nav>
    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <div class="mr-number small">
          {{ t('lots.lotNumber') }} <span class="mr-mono">{{ lot.lotNumber }}</span><template v-if="lot.siteName"> · {{ lot.siteName }}</template>
        </div>
        <h1 class="h4 mb-1">{{ lot.title }}</h1>
        <LotStatusBadge :status="lot.status" :withdrawn="Boolean(lot.withdrawnAt)" />
        <span v-if="lot.manualStatus" class="small text-secondary ms-2"><i class="bi bi-hand-index"></i> {{ manualLine }}</span>
        <span v-else-if="lot.soldBySheet" class="small text-secondary ms-2">{{ t('lots.soldBySheet') }}</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <!-- Mesmo arranjo da página do pacote: abas, com a aba aberta no endereço. -->
    <ul class="nav nav-tabs mb-3">
      <li v-for="tb in tabs" :key="tb.key" class="nav-item">
        <button class="nav-link" :class="{ active: tab === tb.key }" @click="setTab(tb.key)">
          {{ t(`seller.tabs.${tb.key}`) }} <span v-if="tb.count !== undefined" class="badge text-bg-light border">{{ tb.count }}</span>
        </button>
      </li>
    </ul>

    <!-- Dados: só leitura. Os da planilha mudam só pela importação; a descrição do vendedor e o ajuste da situação
         abrem num modal. -->
    <template v-if="tab === 'details'">
    <!-- Situação no sistema e o ajuste manual (2026-11-24). -->
    <section class="mr-card p-3 mb-3 d-flex flex-column-reverse flex-sm-row align-items-sm-start gap-2" style="max-width: 860px">
      <div class="flex-grow-1">
        <dl class="mr-details mb-0">
          <dt>{{ t('lots.systemStatus') }}</dt>
          <dd>
            <LotStatusBadge :status="lot.status" :withdrawn="Boolean(lot.withdrawnAt)" />
            <div v-if="lot.manualStatus" class="small text-secondary mt-1">
              {{ manualLine }}. {{ t('lots.manualHint') }}
              <div v-if="lot.manualStatusNote" class="fst-italic" style="white-space: pre-line">“{{ lot.manualStatusNote }}”</div>
            </div>
            <div v-else-if="soldByPackage" class="small text-secondary mt-1">{{ t('lots.soldByPackageBlock') }}</div>
          </dd>
        </dl>
      </div>
      <button v-if="!lot.withdrawnAt" class="btn btn-outline-secondary btn-sm align-self-end align-self-sm-start text-nowrap" @click="openStatus">
        <i class="bi bi-sliders"></i> {{ t('lots.adjustStatus') }}
      </button>
    </section>
    <section class="mr-card p-3 d-flex flex-column-reverse flex-sm-row align-items-sm-start gap-2" style="max-width: 860px">
      <div class="flex-grow-1">
        <dl class="mr-details">
          <dt>{{ t('lots.description') }}</dt>
          <dd style="white-space: pre-line">{{ lot.description || '—' }}</dd>
        </dl>
        <h2 class="h6 text-secondary mt-3">{{ t('lots.fromSheet') }}</h2>
        <dl class="mr-details mb-0">
          <dt>{{ t('lots.lotNumber') }}</dt>
          <dd class="mr-mono">{{ lot.lotNumber }}</dd>
          <dt>{{ t('lots.title') }}</dt>
          <dd>{{ lot.title }}</dd>
          <dt>{{ t('lots.supplier') }}</dt>
          <dd>{{ lot.masterSupplier || '—' }}</dd>
          <dt>{{ t('lots.site') }}</dt>
          <dd>{{ lot.siteName || '—' }}</dd>
          <dt>{{ t('lots.linkedSystem') }}</dt>
          <dd>{{ lot.linkedSystem || '—' }}</dd>
          <dt>{{ t('lots.family') }}</dt>
          <dd>{{ lot.commercialFamily || '—' }}</dd>
          <dt>{{ t('lots.subfamily') }}</dt>
          <dd>{{ lot.subfamily || '—' }}</dd>
          <dt>{{ t('lots.sheetStatus') }}</dt>
          <dd>{{ f.lotStatusLabel(lot.sheetStatus) }}</dd>
          <dt>{{ t('lots.imported') }}</dt>
          <dd>{{ lot.importedAt ? f.dateTime(lot.importedAt) : '—' }}</dd>
        </dl>
      </div>
      <button class="btn btn-accent btn-sm align-self-end align-self-sm-start text-nowrap" @click="openEdit"><i class="bi bi-pencil"></i> {{ t('common.edit') }}</button>
    </section>
    </template>

    <!-- Pacotes em que o lote está. -->
    <section v-else-if="tab === 'packages'">
      <DataTableCard :paginated="false" :empty="!lot.packages.length" :empty-text="t('lots.noPackages')" clickable>
        <template #filters>
          <span class="small text-secondary">{{ t('lots.packagesHint') }}</span>
          <button class="btn btn-accent btn-sm ms-auto" :disabled="busy" @click="createPackage"><i class="bi bi-box-seam"></i> {{ t('lots.createPackage') }}</button>
        </template>
        <template #head>
          <tr>
            <th class="text-nowrap" style="width: 1%">{{ t('seller.fields.number') }}</th>
            <th>{{ t('seller.fields.name') }}</th>
            <th>{{ t('seller.level') }}</th>
            <th>{{ t('catalog.status') }}</th>
            <th></th>
          </tr>
        </template>
        <tr v-for="p in lot.packages" :key="p.id" @click="openPackage(p)">
          <td class="mr-number fw-normal text-nowrap">{{ p.number }}</td>
          <td class="fw-medium">{{ p.name }}</td>
          <td class="small text-nowrap">{{ f.sourceLabel(p.source) }}</td>
          <td><StatusBadge :status="p.status" /></td>
          <td class="small text-secondary">{{ p.soldThisLot ? t('lots.soldByPackage') : '' }}</td>
        </tr>
      </DataTableCard>
    </section>

    <section v-else-if="tab === 'attachments'">
      <AttachmentsPanel :owner="{ lotId: lot.id }" @changed="load" />
    </section>

    <!-- Edição da descrição. Persistente: clique fora e Esc não fecham, para não perder o que foi digitado. -->
    <ModalDialog v-model:show="editing" :title="t('lots.editDescription')" size="lg" persistent scrollable>
      <label class="form-label small fw-medium" for="mr-lot-desc">{{ t('lots.description') }}<HelpTip :text="t('lots.descriptionHint')" :label="t('seller.fields.help', { field: t('lots.description') })" /></label>
      <textarea id="mr-lot-desc" v-model="description" rows="8" class="form-control"></textarea>
      <div v-if="editError" class="alert alert-danger py-2 small mt-3">{{ editError }}</div>
      <template #footer>
        <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="editing = false">{{ t('common.cancel') }}</button>
        <button class="btn btn-accent btn-sm" :disabled="busy" @click="saveDescription">{{ busy ? t('common.saving') : t('common.save') }}</button>
      </template>
    </ModalDialog>
    <!-- Ajuste manual da situação. Persistente, como a edição da descrição. -->
    <ModalDialog v-model:show="adjusting" :title="t('lots.adjustStatusTitle')" persistent scrollable>
      <p class="small text-secondary">{{ t('lots.adjustStatusIntro') }}</p>
      <div v-if="soldByPackage" class="alert alert-warning py-2 small">{{ t('lots.soldByPackageBlock') }}</div>
      <template v-else>
        <div v-for="opt in statusOptions" :key="opt.value ?? 'sheet'" class="form-check mb-2">
          <input :id="`mr-lot-st-${opt.value ?? 'sheet'}`" v-model="statusChoice" class="form-check-input" type="radio" name="mr-lot-status" :value="opt.value" />
          <label class="form-check-label" :for="`mr-lot-st-${opt.value ?? 'sheet'}`">
            {{ opt.label }}
            <span v-if="opt.hint" class="d-block small text-secondary">{{ opt.hint }}</span>
          </label>
        </div>
        <label class="form-label small fw-medium mt-2" for="mr-lot-st-note">{{ t('lots.statusNote') }}<HelpTip :text="t('lots.statusNoteHint')" :label="t('seller.fields.help', { field: t('lots.statusNote') })" /></label>
        <textarea id="mr-lot-st-note" v-model="statusNote" rows="3" class="form-control" :disabled="statusChoice === null" maxlength="2000"></textarea>
      </template>
      <div v-if="statusError" class="alert alert-danger py-2 small mt-3">{{ statusError }}</div>
      <template #footer>
        <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="adjusting = false">{{ t('common.cancel') }}</button>
        <button v-if="!soldByPackage" class="btn btn-accent btn-sm" :disabled="busy" @click="saveStatus">{{ busy ? t('common.saving') : t('common.save') }}</button>
      </template>
    </ModalDialog>
  </template>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat } from '../../composables/useFormat.js'
import { notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import HelpTip from '../../components/HelpTip.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import LotStatusBadge from '../../components/LotStatusBadge.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import DataTableCard from '../../components/table/DataTableCard.vue'
import AttachmentsPanel from '../../components/seller/AttachmentsPanel.vue'

// Página do lote, no mesmo arranjo da página do pacote: Dados (situação, planilha e descrição do vendedor), Pacotes em
// que o lote está e Fotos e arquivos do lote (acompanham o lote em todos os pacotes).
const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

const TAB_KEYS = ['details', 'packages', 'attachments']
const lot = ref(null)
const error = ref('')
const busy = ref(false)
const editing = ref(false)
const editError = ref('')
const description = ref('')
const adjusting = ref(false)
const statusChoice = ref(null)
const statusNote = ref('')
const statusError = ref('')
const tab = ref(TAB_KEYS.includes(route.query.tab) ? route.query.tab : 'details')

const tabs = computed(() => [
  { key: 'details' },
  { key: 'packages', count: lot.value?.packages.length },
  { key: 'attachments', count: lot.value?.attachments.length }
])

// Lote vendido por pacote não aceita ajuste (desfazer a venda do pacote).
const soldByPackage = computed(() => Boolean(lot.value?.packages.some((p) => p.soldThisLot)))

const manualLine = computed(() => {
  const l = lot.value
  if (!l?.manualStatus) return ''
  const date = f.dateTime(l.manualStatusAt)
  return l.manualStatusByName ? t('lots.manualBy', { name: l.manualStatusByName, date }) : t('lots.manualByUnknown', { date })
})

// null = seguir a planilha (sem ajuste).
const statusOptions = computed(() => [
  { value: null, label: t('lots.followSheet'), hint: `${t('lots.followSheetHint')} ${t('lots.sheetStatus')}: ${f.lotStatusLabel(lot.value?.sheetStatus)}${lot.value?.soldBySheet ? ` (${t('lots.soldBySheet').toLowerCase()})` : ''}.` },
  ...['available', 'sold', 'unavailable'].map((value) => ({ value, label: f.lotStatusLabel(value) }))
])

function setTab(key) {
  tab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

async function load() {
  error.value = ''
  try {
    lot.value = await api.lot(route.params.id)
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

// Cada abertura parte do que está gravado.
function openEdit() {
  description.value = lot.value.description || ''
  editError.value = ''
  editing.value = true
}

async function saveDescription() {
  busy.value = true
  editError.value = ''
  try {
    await api.updateLot(lot.value.id, { description: description.value })
    await load()
    editing.value = false
    notify(t('seller.saved'))
  } catch (err) {
    editError.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

// Cada abertura parte do que está gravado.
function openStatus() {
  statusChoice.value = lot.value.manualStatus ?? null
  statusNote.value = lot.value.manualStatusNote || ''
  statusError.value = ''
  adjusting.value = true
}

async function saveStatus() {
  busy.value = true
  statusError.value = ''
  try {
    await api.setLotStatus(lot.value.id, { status: statusChoice.value, note: statusChoice.value === null ? null : statusNote.value })
    await load()
    adjusting.value = false
    notify(t('seller.saved'))
  } catch (err) {
    statusError.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function createPackage() {
  busy.value = true
  error.value = ''
  try {
    const p = await api.packageFromLot(lot.value.id)
    router.push({ name: 'seller-package', params: { id: p.id } })
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

function openPackage(p) {
  router.push({ name: 'seller-package', params: { id: p.id } })
}

// Volta para onde veio (lista filtrada ou pacote); aberto direto pelo link, vai para a lista de lotes.
function back() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'seller-lots' })
}

watch(
  () => route.params.id,
  () => {
    lot.value = null
    load()
  },
  { immediate: true }
)
</script>
