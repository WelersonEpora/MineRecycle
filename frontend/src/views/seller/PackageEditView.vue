<template>
  <div v-if="error && !pkg" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="!pkg" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <RouterLink :to="{ name: 'seller-packages' }"><i class="bi bi-arrow-left"></i> {{ t('seller.packages') }}</RouterLink>
    </nav>
    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <div class="mr-number small">{{ t('seller.fields.number') }} {{ pkg.number }} · {{ f.sourceLabel(pkg.source) }}<template v-if="pkg.sites?.length"> · {{ pkg.sites.join(' · ') }}</template></div>
        <h1 class="h4 mb-1">{{ pkg.name }}</h1>
        <div v-if="pkg.source !== 'manual' && pkg.sourceValue !== pkg.name" class="small text-secondary mb-1">{{ pkg.sourceValue }}</div>
        <StatusBadge :status="pkg.status" />
        <span class="small text-secondary ms-2">
          {{ t('lots.total', { n: pkg.lotCount }, pkg.lotCount) }}<template v-if="pkg.soldCount"> · {{ t('seller.soldOf', { sold: pkg.soldCount, total: pkg.lotCount }) }}</template>
        </span>
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

    <!-- Detalhes: só leitura; a edição abre num modal (Cancelar/Salvar). -->
    <section v-if="tab === 'details'" class="mr-card p-3 d-flex flex-column-reverse flex-sm-row align-items-sm-start gap-2" style="max-width: 860px">
      <dl class="mr-details flex-grow-1">
        <dt>{{ t('seller.fields.name') }}</dt>
        <dd>{{ pkg.name }}</dd>
        <dt>{{ t('seller.level') }}</dt>
        <dd>{{ f.sourceLabel(pkg.source) }}<span v-if="pkg.source !== 'manual'" class="text-secondary"> · {{ pkg.sourceValue }}</span></dd>
        <dt>{{ t('seller.fields.category') }}</dt>
        <dd>{{ f.categoryLabel(pkg.category) }}</dd>
        <dt v-if="SHOW_ORIGIN">{{ t('seller.fields.origin') }}</dt>
        <dd v-if="SHOW_ORIGIN">{{ pkg.origin ? `${pkg.origin.name} (${pkg.origin.code})` : '—' }}</dd>
        <dt>{{ t('seller.site') }}</dt>
        <dd>{{ pkg.sites?.length ? pkg.sites.join(' · ') : '—' }}</dd>
        <dt>{{ t('seller.fields.description') }}</dt>
        <dd style="white-space: pre-line">{{ pkg.description || '—' }}</dd>
        <dt>{{ t('seller.fields.number') }}</dt>
        <dd>{{ pkg.number }}</dd>
      </dl>
      <button class="btn btn-accent btn-sm align-self-end align-self-sm-start text-nowrap" @click="openEdit"><i class="bi bi-pencil"></i> {{ t('common.edit') }}</button>
    </section>

    <section v-else-if="tab === 'lots'">
      <PackageLotsPanel :pkg="pkg" @changed="reload" />
    </section>

    <section v-else-if="tab === 'attachments'">
      <AttachmentsPanel :owner="{ packageId: pkg.id }" @changed="reload" />
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat, STATUSES } from '../../composables/useFormat.js'
import { confirmDialog, notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import StatusBadge from '../../components/StatusBadge.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import PackageForm from '../../components/seller/PackageForm.vue'
import { SHOW_ORIGIN } from '../../utils/features.js'
import PackageLotsPanel from '../../components/seller/PackageLotsPanel.vue'
import AttachmentsPanel from '../../components/seller/AttachmentsPanel.vue'
import AccessLinksPanel from '../../components/seller/AccessLinksPanel.vue'

const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

const pkg = ref(null)
const form = ref({})
const error = ref('')
const busy = ref(false)
const editing = ref(false)
const editError = ref('')
const menuOpen = ref(false)
const tab = ref(['details', 'lots', 'attachments', 'links'].includes(route.query.tab) ? route.query.tab : 'details')

const tabs = computed(() => [
  { key: 'details' },
  { key: 'lots', count: pkg.value?.allLotCount },
  { key: 'attachments', count: pkg.value?.attachmentCount },
  { key: 'links', count: pkg.value?.linkCount }
])
const statusTargets = computed(() => STATUSES.filter((s) => s !== pkg.value?.status))

function setTab(key) {
  tab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

async function load() {
  error.value = ''
  try {
    pkg.value = await api.sellerPackage(route.params.id)
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function reload() {
  pkg.value = await api.sellerPackage(route.params.id)
}

// Cada abertura parte do que está gravado: Cancelar descarta de fato.
function openEdit() {
  const p = pkg.value
  form.value = { number: p.number, name: p.name, category: p.category || 'other', originId: p.originId || '', description: p.description || '' }
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

// "Vendido" marca os lotes do pacote como vendidos em todos os pacotes. Se algum lote já tinha sido vendido em outro
// lugar, a API pede confirmação (PACKAGE_SALE_CONFIRM).
async function changeStatus(status) {
  menuOpen.value = false
  error.value = ''
  try {
    let result
    try {
      result = await api.setStatus(pkg.value.id, status)
    } catch (err) {
      const e = err.response?.data?.error
      if (e?.code !== 'PACKAGE_SALE_CONFIRM') throw err
      const n = e.details?.alreadySold?.length || 0
      const ok = await confirmDialog({
        title: t('seller.saleConfirmTitle'),
        message: t('seller.saleConfirmMessage', { n }, n),
        confirmLabel: t('seller.saleConfirmLabel'),
        danger: false
      })
      if (!ok) return
      result = await api.setStatus(pkg.value.id, status, true)
    }
    pkg.value = result
    if (result.sale?.sold !== undefined) notify(t('seller.saleDone', { n: result.sale.sold }, result.sale.sold))
    else if (result.sale?.released !== undefined) notify(t('seller.unsaleDone', result.sale))
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

watch(() => route.params.id, load, { immediate: true })
</script>
