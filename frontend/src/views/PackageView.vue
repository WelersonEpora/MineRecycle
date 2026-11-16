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
        <div class="mr-number small">{{ t('package.number', { number: pkg.number }) }}</div>
        <h1 class="h3 mb-2">{{ pkg.name }}</h1>
        <div class="d-flex flex-wrap gap-2 small">
          <span class="badge rounded-pill text-bg-light border">{{ f.typeLabel(pkg.type) }}</span>
          <span class="badge rounded-pill text-bg-light border"><i class="bi bi-geo-alt"></i> {{ f.locationLabel(pkg.location) }}</span>
          <StatusBadge :status="pkg.status" />
          <span class="text-secondary">{{ t('catalog.lines', pkg.lineCount) }}</span>
        </div>
      </div>
      <RouterLink
        v-if="detail.access === 'seller'"
        class="btn btn-sm btn-outline-secondary"
        :to="{ name: 'seller-package', params: { id: pkg.id } }"
      >
        <i class="bi bi-pencil"></i> {{ t('package.editInSellerArea') }}
      </RouterLink>
    </div>

    <div v-if="detail.access === 'buyer'" class="alert alert-info small">
      <i class="bi bi-key"></i>
      {{ t('package.buyerBanner', { label: detail.buyerLink.label, date: f.date(detail.buyerLink.expiresAt) }) }}
    </div>
    <div v-else-if="detail.access === 'seller'" class="alert alert-secondary small">
      <i class="bi bi-eye"></i> {{ t('package.sellerBanner') }}
    </div>

    <div class="row g-4">
      <div class="col-lg-7">
        <PhotoGallery :photos="packagePhotos" />
      </div>
      <div class="col-lg-5">
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
      <h2 class="h5">{{ t('package.items') }}</h2>
      <LinesTable :loader="loadLines" :attachments="detail.attachments" @show-files="showLineFiles" />
    </section>

    <ModalDialog v-model:show="lineFiles.show" :title="lineFiles.title" size="lg">
      <PhotoGallery v-if="lineFiles.photos.length" :photos="lineFiles.photos" class="mb-3" />
      <DocumentList v-if="lineFiles.documents.length" :documents="lineFiles.documents" />
    </ModalDialog>
  </template>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormat } from '../composables/useFormat.js'
import { api } from '../services/api.js'
import StatusBadge from '../components/StatusBadge.vue'
import PhotoGallery from '../components/PhotoGallery.vue'
import DocumentList from '../components/DocumentList.vue'
import LinesTable from '../components/LinesTable.vue'
import ModalDialog from '../components/ModalDialog.vue'

const f = useFormat()
const t = f.t
const route = useRoute()
const detail = ref(null)
const error = ref('')
const lineFiles = reactive({ show: false, title: '', photos: [], documents: [] })

const pkg = computed(() => detail.value?.package)
const packageAttachments = computed(() => (detail.value?.attachments || []).filter((a) => !a.lineId))
const packagePhotos = computed(() => packageAttachments.value.filter((a) => a.kind === 'photo' && a.webUrl))
const packageDocuments = computed(() => packageAttachments.value.filter((a) => a.kind !== 'photo'))

async function load() {
  detail.value = null
  error.value = ''
  try {
    detail.value = await api.packageDetail(route.params.number)
    document.title = `${detail.value.package.name} · MineRecycle`
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

const loadLines = (params) => api.packageLines(route.params.number, params)

function showLineFiles(line) {
  const files = detail.value.attachments.filter((a) => a.lineId === line.id)
  lineFiles.title = `${t('package.lineFiles')} · ${line.itemNo}`
  lineFiles.photos = files.filter((a) => a.kind === 'photo' && a.webUrl)
  lineFiles.documents = files.filter((a) => a.kind !== 'photo')
  lineFiles.show = true
}

watch(() => route.params.number, load, { immediate: true })
</script>
