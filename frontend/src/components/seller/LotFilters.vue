<template>
  <div class="d-flex flex-wrap gap-2 align-items-end">
    <div>
      <label class="form-label small mb-1" :for="`${id}-q`">{{ t('common.search') }}</label>
      <input :id="`${id}-q`" v-model="model.q" type="search" class="form-control form-control-sm" />
    </div>
    <div v-for="g in shownGroups" :key="g.key">
      <label class="form-label small mb-1" :for="`${id}-${g.key}`">{{ t(g.label) }}</label>
      <select :id="`${id}-${g.key}`" v-model="model[g.key]" class="form-select form-select-sm" style="max-width: 16rem">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="o in facets?.[g.facet] || []" :key="o.value ?? '-'" :value="o.value ?? '-'">
          {{ o.value ?? t('lots.emptyValue') }} ({{ o.count }})
        </option>
      </select>
    </div>
    <div>
      <label class="form-label small mb-1" :for="`${id}-status`">{{ t('lots.status') }}</label>
      <select :id="`${id}-status`" v-model="model.status" class="form-select form-select-sm">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="s in LOT_STATUSES" :key="s" :value="s">{{ f.lotStatusLabel(s) }}</option>
      </select>
    </div>
    <div v-if="withWithdrawn && facets?.withdrawn" class="form-check mb-1">
      <input :id="`${id}-wd`" v-model="model.withdrawn" class="form-check-input" type="checkbox" true-value="1" false-value="" />
      <label class="form-check-label small" :for="`${id}-wd`">{{ t('lots.showWithdrawn') }} ({{ facets.withdrawn }})</label>
    </div>
    <button v-if="active" type="button" class="btn btn-link btn-sm mb-1" @click="clear">{{ t('filters.clear') }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFormat, LOT_STATUSES } from '../../composables/useFormat.js'
import { EMPTY_LOT_FILTERS } from '../../composables/lotFilters.js'

// Filtros de lotes (lista de lotes e "Adicionar lotes" do pacote). "-" = valor vazio na planilha.

const model = defineModel({ type: Object, required: true })
const props = defineProps({
  id: { type: String, required: true },
  facets: { type: Object, default: null },
  withWithdrawn: { type: Boolean, default: false }
})
const f = useFormat()
const t = f.t

const groups = [
  { key: 'linkedSystem', facet: 'linkedSystem', label: 'lots.linkedSystem' },
  { key: 'family', facet: 'family', label: 'lots.family' },
  { key: 'subfamily', facet: 'subfamily', label: 'lots.subfamily' },
  { key: 'site', facet: 'site', label: 'lots.site' }
]
// Coluna ainda sem nenhum valor na planilha (ex.: subfamília): o filtro não aparece.
const shownGroups = computed(() => groups.filter((g) => (props.facets?.[g.facet] || []).some((o) => o.value !== null)))
const active = computed(() => Object.values(model.value).some(Boolean))

function clear() {
  Object.assign(model.value, EMPTY_LOT_FILTERS)
}
</script>
