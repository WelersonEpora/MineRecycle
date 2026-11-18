<template>
  <section class="mr-hero p-4 p-md-5 mb-4">
    <h1 class="h3 fw-bold">{{ t('catalog.title') }}</h1>
    <p class="mb-0">{{ t('catalog.intro') }}</p>
  </section>

  <CatalogFilters
    id-prefix="mr-cat"
    :filters="filters"
    :facets="result?.facets"
    :total="result?.items.length || 0"
    show-negotiation
    @set="(k, v) => (filters[k] = v)"
    @reset="reset"
  />

  <div v-if="error" class="alert alert-danger">{{ f.errorMessage(error) }}</div>
  <p v-else-if="loading && !result" class="text-secondary">{{ t('common.loading') }}</p>
  <p v-else-if="!result?.items.length" class="text-secondary">{{ t('catalog.empty') }}</p>
  <div v-else class="row g-3 mr-card-grid" :class="{ 'mr-loading': loading }">
    <div v-for="p in result.items" :key="p.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <PackageCard :pkg="p" />
    </div>
  </div>
</template>

<script setup>
import { useFormat } from '../composables/useFormat.js'
import { useCatalogFilters } from '../composables/useCatalogFilters.js'
import { api } from '../services/api.js'
import PackageCard from '../components/PackageCard.vue'
import CatalogFilters from '../components/CatalogFilters.vue'

const f = useFormat()
const t = f.t
const { filters, result, loading, error, reset } = useCatalogFilters((params) => api.catalog(params))
</script>
