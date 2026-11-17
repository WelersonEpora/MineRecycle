<template>
  <div v-if="!session.state.buyer" class="alert alert-secondary">{{ ended ? t('access.ended') : t('access.noSession') }}</div>
  <template v-else>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="flex-grow-1">
        <h1 class="h4 mb-1"><i class="bi bi-key"></i> {{ t('access.title') }}: {{ data?.label || session.state.buyer.label }}</h1>
        <div class="small text-secondary">{{ t('access.validUntil', { date: f.dateTime(session.state.buyer.expiresAt) }) }}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" @click="end">{{ t('access.endSession') }}</button>
    </div>
    <h2 class="h6 text-uppercase text-secondary">{{ t('access.packages') }}</h2>
    <!-- Mesmos filtros do catálogo, só sobre os pacotes do link; sem a caixa de negociação (o comprador vê tudo do link). -->
    <CatalogFilters
      id-prefix="mr-buy"
      :filters="filters"
      :facets="result?.facets"
      :total="result?.items.length || 0"
      @set="(k, v) => (filters[k] = v)"
      @reset="reset"
    />
    <div v-if="error" class="alert alert-danger">{{ f.errorMessage(error) }}</div>
    <p v-else-if="loading && !result" class="text-secondary">{{ t('common.loading') }}</p>
    <p v-else-if="!result?.items.length" class="text-secondary">{{ t('catalog.empty') }}</p>
    <div v-else class="row g-3" :class="{ 'mr-loading': loading }">
      <div v-for="p in result.items" :key="p.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
        <PackageCard :pkg="p" />
      </div>
    </div>
  </template>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useFormat } from '../composables/useFormat.js'
import { useSession } from '../stores/session.js'
import { api } from '../services/api.js'
import { useCatalogFilters } from '../composables/useCatalogFilters.js'
import PackageCard from '../components/PackageCard.vue'
import CatalogFilters from '../components/CatalogFilters.vue'

const f = useFormat()
const t = f.t
const session = useSession()
const data = ref(null)
const ended = ref(false)
const { filters, result, loading, error, reset } = useCatalogFilters((params) =>
  session.state.buyer ? api.buyerPackages(params) : Promise.resolve({ items: [], facets: null })
)

// Nome do link e validade.
onMounted(async () => {
  if (!session.state.buyer) return
  try {
    data.value = await api.buyerSession()
  } catch {
    data.value = null
  }
})

async function end() {
  await session.endBuyerSession()
  ended.value = true
}
</script>
