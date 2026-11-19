<template>
  <div v-if="error" class="alert alert-warning">
    {{ error }}
    <div class="mt-2"><RouterLink :to="{ name: 'catalog' }">{{ t('notFound.back') }}</RouterLink></div>
  </div>
  <p v-else-if="!detail" class="text-secondary">{{ t('common.loading') }}</p>
  <template v-else>
    <nav class="small mb-2">
      <RouterLink :to="detail.access === 'buyer' ? { name: 'buyer' } : { name: 'catalog' }">
        <i class="bi bi-arrow-left"></i> {{ detail.access === 'buyer' ? t('nav.myAccess') : t('nav.catalog') }}
      </RouterLink>
    </nav>

    <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
      <div class="flex-grow-1">
        <h1 class="h3 mb-2">{{ pkg.name }}</h1>
        <div class="d-flex flex-wrap align-items-center gap-2 small">
          <span class="badge rounded-pill text-bg-light border">{{ f.sourceLabel(pkg.source) }}</span>
          <span v-if="pkg.sites?.length" class="badge rounded-pill text-bg-light border"><i class="bi bi-geo-alt"></i> {{ pkg.sites.join(' · ') }}</span>
          <StatusBadge :status="pkg.status" />
          <span class="text-secondary">
            {{ t('catalog.lots', pkg.lotCount) }}<template v-if="pkg.soldCount"> · {{ t('catalog.soldOf', { sold: pkg.soldCount, total: pkg.lotCount }) }}</template>
          </span>
          <span class="text-secondary mr-mono" :title="t('catalog.packageId')">#{{ pkg.number }}</span>
        </div>
      </div>
      <RouterLink v-if="detail.access === 'seller'" class="btn btn-sm btn-outline-secondary" :to="{ name: 'seller-package', params: { id: pkg.id } }">
        <i class="bi bi-pencil"></i> {{ t('package.editInSellerArea') }}
      </RouterLink>
    </div>

    <div v-if="detail.access === 'buyer'" class="alert alert-info small">
      <i class="bi bi-key"></i>
      {{ t('package.buyerBanner', { label: detail.buyerLink.label, date: f.date(detail.buyerLink.expiresAt) }) }}
    </div>
    <div v-else-if="detail.access === 'seller'" class="alert alert-secondary small"><i class="bi bi-eye"></i> {{ t('package.sellerBanner') }}</div>

    <div class="row g-4">
      <div class="col-lg-7">
        <PhotoGallery :photos="packagePhotos" />
      </div>
      <div class="col-lg-5">
        <InquiryPanel :pkg="pkg" :access="detail.access" :can-inquire="Boolean(detail.canInquire)" />
        <section v-if="pkg.description" class="mb-4">
          <h2 class="h6 text-uppercase text-secondary">{{ t('package.description') }}</h2>
          <p style="white-space: pre-line">{{ pkg.description }}</p>
        </section>
        <section>
          <h2 class="h6 text-uppercase text-secondary">{{ t('package.documents') }}</h2>
          <DocumentList :documents="packageDocuments" />
          <p v-if="detail.restrictedCount" class="small text-secondary mt-2">
            <i class="bi bi-lock"></i> {{ t('package.restrictedHint', { n: detail.restrictedCount }, detail.restrictedCount) }}
          </p>
        </section>
      </div>
    </div>

    <section class="mt-4">
      <h2 class="h5">{{ t('package.lots') }}</h2>
      <DataTableCard
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="lots.total"
        :loading="lotsLoading"
        :empty="!lots.items.length"
        :empty-text="t('package.noLots')"
        clickable
        refreshable
        @refresh="loadLots"
      >
        <template #filters>
          <div>
            <label class="form-label" for="mr-pkg-lot-q">{{ t('common.search') }}</label>
            <input id="mr-pkg-lot-q" v-model="q" type="search" class="form-control form-control-sm" :placeholder="t('package.searchLots')" />
          </div>
        </template>
        <template #head>
          <tr>
            <SortHeader v-model="sort" field="lotNumber" :label="t('lots.lotNumber')" />
            <th></th>
            <SortHeader v-model="sort" field="title" :label="t('lots.title')" />
            <SortHeader v-model="sort" field="masterSupplier" :label="t('lots.supplier')" />
            <SortHeader v-model="sort" field="siteName" :label="t('lots.site')" />
            <SortHeader v-model="sort" field="status" :label="t('lots.status')" />
            <th>{{ t('lots.files') }}</th>
          </tr>
        </template>
        <tr v-for="l in lots.items" :key="l.id" @click="openLot(l)">
          <td class="mr-mono small text-nowrap">{{ l.lotNumber }}</td>
          <td style="width: 64px">
            <img v-if="l.coverUrl" :src="l.coverUrl" alt="" style="width: 56px; height: 42px; object-fit: cover" class="rounded" loading="lazy" />
          </td>
          <td class="small">{{ l.title }}</td>
          <td class="small">{{ l.masterSupplier }}</td>
          <td class="small text-nowrap">{{ l.siteName }}</td>
          <td><LotStatusBadge :status="l.status" /></td>
          <td class="small text-nowrap"><template v-if="l.attachmentCount"><i class="bi bi-paperclip"></i> {{ l.attachmentCount }}</template></td>
        </tr>
      </DataTableCard>
    </section>

    <!-- Detalhe do lote: dados, descrição e os arquivos do lote que o visitante pode ver. -->
    <ModalDialog v-model:show="lotModal.show" :title="lotModal.lot ? `${t('lots.lotNumber')} ${lotModal.lot.lotNumber}` : ''" size="lg" scrollable>
      <p v-if="lotModal.loading" class="text-secondary">{{ t('common.loading') }}</p>
      <template v-else-if="lotModal.lot">
        <h3 class="h5">{{ lotModal.lot.title }}</h3>
        <div class="mb-3"><LotStatusBadge :status="lotModal.lot.status" /></div>
        <dl class="mr-details">
          <dt>{{ t('lots.supplier') }}</dt>
          <dd>{{ lotModal.lot.masterSupplier || '—' }}</dd>
          <dt>{{ t('lots.site') }}</dt>
          <dd>{{ lotModal.lot.siteName || '—' }}</dd>
          <dt>{{ t('lots.linkedSystem') }}</dt>
          <dd>{{ lotModal.lot.linkedSystem || '—' }}</dd>
          <dt>{{ t('lots.family') }}</dt>
          <dd>{{ lotModal.lot.commercialFamily || '—' }}</dd>
          <template v-if="lotModal.lot.subfamily">
            <dt>{{ t('lots.subfamily') }}</dt>
            <dd>{{ lotModal.lot.subfamily }}</dd>
          </template>
        </dl>
        <p v-if="lotModal.lot.description" style="white-space: pre-line">{{ lotModal.lot.description }}</p>
        <PhotoGallery v-if="lotModal.photos.length" :photos="lotModal.photos" class="mb-3" />
        <DocumentList v-if="lotModal.documents.length" :documents="lotModal.documents" />
        <RouterLink v-if="detail.access === 'seller'" class="btn btn-sm btn-outline-secondary mt-2" :to="{ name: 'seller-lot', params: { id: lotModal.lot.id } }">
          <i class="bi bi-pencil"></i> {{ t('package.editInSellerArea') }}
        </RouterLink>
      </template>
      <div v-if="lotModal.error" class="alert alert-danger py-2 small">{{ lotModal.error }}</div>
    </ModalDialog>
  </template>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormat } from '../composables/useFormat.js'
import { PAGE_SIZES } from '../utils/pagination.js'
import { api } from '../services/api.js'
import StatusBadge from '../components/StatusBadge.vue'
import LotStatusBadge from '../components/LotStatusBadge.vue'
import PhotoGallery from '../components/PhotoGallery.vue'
import DocumentList from '../components/DocumentList.vue'
import ModalDialog from '../components/ModalDialog.vue'
import InquiryPanel from '../components/InquiryPanel.vue'
import DataTableCard from '../components/table/DataTableCard.vue'
import SortHeader from '../components/table/SortHeader.vue'

// Página pública do pacote (catálogo, link do comprador e vendedor): fotos e documentos do pacote, pedido de compra e
// a tabela de lotes. O lote abre num modal com as fotos e arquivos dele (que acompanham o lote em todos os pacotes).
const f = useFormat()
const t = f.t
const route = useRoute()
const detail = ref(null)
const error = ref('')

const pkg = computed(() => detail.value?.package)
const packagePhotos = computed(() => (detail.value?.attachments || []).filter((a) => a.kind === 'photo' && a.webUrl))
const packageDocuments = computed(() => (detail.value?.attachments || []).filter((a) => a.kind !== 'photo'))

const lots = reactive({ items: [], total: 0 })
const lotsLoading = ref(false)
const page = ref(1)
const pageSize = ref(PAGE_SIZES[1])
const sort = ref({ field: '', order: 'asc' })
const q = ref('')
const lotModal = reactive({ show: false, loading: false, lot: null, photos: [], documents: [], error: '' })
let seq = 0
let timer = null

async function load() {
  detail.value = null
  error.value = ''
  try {
    detail.value = await api.packageDetail(route.params.number)
    document.title = `${detail.value.package.name} · MineRecycle`
    page.value = 1
    await loadLots()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function loadLots() {
  const mine = ++seq
  lotsLoading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, q: q.value.trim() || undefined }
    if (sort.value.field) Object.assign(params, { sort: sort.value.field, order: sort.value.order })
    const r = await api.packageLots(route.params.number, params)
    if (mine !== seq) return
    lots.items = r.items
    lots.total = r.total
  } catch (err) {
    if (mine === seq) error.value = f.errorMessage(err)
  } finally {
    if (mine === seq) lotsLoading.value = false
  }
}

async function openLot(lot) {
  Object.assign(lotModal, { show: true, loading: true, lot, photos: [], documents: [], error: '' })
  try {
    const r = await api.packageLot(route.params.number, lot.id)
    lotModal.lot = r.lot
    lotModal.photos = r.attachments.filter((a) => a.kind === 'photo' && a.webUrl)
    lotModal.documents = r.attachments.filter((a) => a.kind !== 'photo')
  } catch (err) {
    lotModal.error = f.errorMessage(err)
  } finally {
    lotModal.loading = false
  }
}

function fromStart() {
  if (page.value === 1) loadLots()
  else page.value = 1
}

watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(fromStart, 300)
})
watch(sort, fromStart)
watch([page, pageSize], loadLots)
watch(() => route.params.number, load, { immediate: true })
</script>
