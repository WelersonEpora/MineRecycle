<template>
  <div v-if="error && !lot" class="alert alert-danger">{{ error }}</div>
  <p v-else-if="!lot" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <a href="#" @click.prevent="back"><i class="bi bi-arrow-left"></i> {{ t('lots.back') }}</a>
    </nav>
    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <div class="mr-number small">{{ t('lots.lotNumber') }} <span class="mr-mono">{{ lot.lotNumber }}</span></div>
        <h1 class="h4 mb-1">{{ lot.title }}</h1>
        <LotStatusBadge :status="lot.status" :withdrawn="Boolean(lot.withdrawnAt)" />
        <span v-if="lot.soldBySheet" class="small text-secondary ms-2">{{ t('lots.soldBySheet') }}</span>
      </div>
      <button class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="createPackage"><i class="bi bi-box-seam"></i> {{ t('lots.createPackage') }}</button>
    </div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <div class="row g-3">
      <div class="col-lg-6">
        <section class="mr-card p-3 mb-3">
          <h2 class="h6 text-secondary">{{ t('lots.fromSheet') }}</h2>
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
        </section>
        <section class="mr-card p-3 mb-3">
          <label class="form-label small fw-medium" for="mr-lot-desc">{{ t('lots.description') }}<HelpTip :text="t('lots.descriptionHint')" :label="t('seller.fields.help', { field: t('lots.description') })" /></label>
          <textarea id="mr-lot-desc" v-model="description" rows="5" class="form-control"></textarea>
          <div class="text-end mt-2">
            <button class="btn btn-accent btn-sm" :disabled="busy || description === (lot.description || '')" @click="saveDescription">{{ busy ? t('common.saving') : t('common.save') }}</button>
          </div>
        </section>
      </div>
      <div class="col-lg-6">
        <section class="mr-card p-3 mb-3">
          <h2 class="h6">{{ t('lots.packages') }} ({{ lot.packages.length }})</h2>
          <ul class="list-unstyled mb-0 small">
            <li v-for="p in lot.packages" :key="p.id" class="py-1 d-flex align-items-center gap-2">
              <span class="mr-number">{{ p.number }}</span>
              <RouterLink :to="{ name: 'seller-package', params: { id: p.id } }">{{ p.name }}</RouterLink>
              <span class="text-secondary">· {{ f.sourceLabel(p.source) }}</span>
              <StatusBadge :status="p.status" class="ms-auto" />
              <span v-if="p.soldThisLot" class="text-secondary">{{ t('lots.soldByPackage') }}</span>
            </li>
            <li v-if="!lot.packages.length" class="text-secondary">—</li>
          </ul>
        </section>
      </div>
    </div>

    <h2 class="h6 mt-2">{{ t('seller.tabs.attachments') }}</h2>
    <AttachmentsPanel :owner="{ lotId: lot.id }" />
  </template>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat } from '../../composables/useFormat.js'
import { notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import HelpTip from '../../components/HelpTip.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import LotStatusBadge from '../../components/LotStatusBadge.vue'
import AttachmentsPanel from '../../components/seller/AttachmentsPanel.vue'

// Detalhe do lote: dados da planilha (só leitura), descrição do vendedor, pacotes em que está e fotos e arquivos do
// lote (acompanham o lote em todos os pacotes).
const f = useFormat()
const t = f.t
const route = useRoute()
const router = useRouter()

const lot = ref(null)
const description = ref('')
const error = ref('')
const busy = ref(false)

async function load() {
  error.value = ''
  try {
    lot.value = await api.lot(route.params.id)
    description.value = lot.value.description || ''
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function saveDescription() {
  busy.value = true
  error.value = ''
  try {
    lot.value = await api.updateLot(lot.value.id, { description: description.value })
    description.value = lot.value.description || ''
    notify(t('seller.saved'))
  } catch (err) {
    error.value = f.errorMessage(err)
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

// Volta para onde veio (lista filtrada ou pacote); aberto direto pelo link, vai para a lista de lotes.
function back() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'seller-lots' })
}

watch(() => route.params.id, load, { immediate: true })
</script>
