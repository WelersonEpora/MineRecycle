<template>
  <section class="mr-filters" :aria-label="t('filters.title')">
    <div class="mr-search">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input
        :id="`${idPrefix}-q`"
        type="search"
        class="form-control"
        :value="filters.q"
        :placeholder="t('filters.searchPlaceholder')"
        :aria-label="t('filters.searchPlaceholder')"
        maxlength="100"
        @input="emit('set', 'q', $event.target.value)"
      />
      <button v-if="filters.q" type="button" class="mr-search-clear" :aria-label="t('filters.clearSearch')" @click="emit('set', 'q', '')">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Celular: os chips ficam num painel aberto pelo botão "Filtros". -->
    <button
      type="button"
      class="mr-filters-toggle d-md-none"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="`${idPrefix}-groups`"
      @click="open = !open"
    >
      <i class="bi bi-sliders" aria-hidden="true"></i> {{ t('filters.button') }}
      <span v-if="chipCount" class="mr-filters-badge">{{ chipCount }}</span>
    </button>

    <div :id="`${idPrefix}-groups`" class="mr-filter-groups" :class="{ 'is-open': open }">
      <ChipGroup
        v-if="levelOptions.length > 1 || filters.level"
        :id="`${idPrefix}-level`"
        :label="t('filters.level')"
        :model-value="filters.level"
        :all-label="t('filters.all')"
        :all-count="facets?.level.all"
        :options="levelOptions"
        @update:model-value="emit('set', 'level', $event)"
      />
      <ChipGroup
        v-if="showOrigin"
        :id="`${idPrefix}-origin`"
        :label="t('filters.origin')"
        :model-value="filters.origin"
        :all-label="t('filters.all')"
        :all-count="facets?.origin.all"
        :options="originOptions"
        @update:model-value="emit('set', 'origin', $event)"
      />
      <ChipGroup
        :id="`${idPrefix}-site`"
        :label="t('filters.site')"
        :model-value="filters.site"
        :all-label="t('filters.all')"
        :all-count="facets?.site.all"
        :options="siteOptions"
        @update:model-value="emit('set', 'site', $event)"
      />
    </div>

    <div class="mr-filter-result">
      <span class="fw-semibold" aria-live="polite">{{ t('filters.count', total) }}</span>
      <div v-if="showNegotiation" class="form-check mb-0">
        <input
          :id="`${idPrefix}-neg`"
          class="form-check-input"
          type="checkbox"
          :checked="filters.negotiation"
          @change="emit('set', 'negotiation', $event.target.checked)"
        />
        <label class="form-check-label" :for="`${idPrefix}-neg`">{{ t('filters.showNegotiation') }}</label>
      </div>
      <button v-if="activeCount" type="button" class="btn btn-link btn-sm mr-filter-reset" @click="emit('reset')">
        {{ t('filters.clear') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useFormat, SOURCES } from '../composables/useFormat.js'
import { activeFilterCount } from '../composables/useCatalogFilters.js'
import ChipGroup from './ChipGroup.vue'

const props = defineProps({
  idPrefix: { type: String, default: 'mr-filters' },
  filters: { type: Object, required: true },
  // facets da API: { level, origin, site }, cada um com { all, options: [{ value, count, name? }] }
  facets: { type: Object, default: null },
  total: { type: Number, default: 0 },
  showNegotiation: { type: Boolean, default: false }
})
const emit = defineEmits(['set', 'reset'])
const f = useFormat()
const t = f.t
const open = ref(false)

const activeCount = computed(() => activeFilterCount(props.filters))
const chipCount = computed(() => ['level', 'origin', 'site'].filter((k) => props.filters[k]).length)

// A opção escolhida continua visível mesmo sem pacotes (ex.: veio de um link antigo), com contagem 0.
function withSelected(options, selected, label) {
  if (!selected || options.some((o) => o.value === selected)) return options
  return [...options, { value: selected, label: label(selected), count: 0 }]
}

// Nível: só os que têm pacote visível (o grupo some quando há um só).
const levelOptions = computed(() =>
  withSelected(
    SOURCES.map((v) => ({ value: v, label: f.sourceLabel(v), count: props.facets?.level.options.find((o) => o.value === v)?.count ?? 0 })).filter((o) => o.count > 0),
    props.filters.level,
    (v) => f.sourceLabel(v)
  )
)
const originOptions = computed(() =>
  withSelected(
    (props.facets?.origin.options || []).map((o) => ({ value: o.value, label: o.name || o.value, count: o.count })),
    props.filters.origin,
    (v) => v
  )
)
// Site como está na planilha (CDA, Dry Port...).
const siteOptions = computed(() =>
  withSelected(
    (props.facets?.site.options || []).map((o) => ({ value: o.value, label: o.value, count: o.count })),
    props.filters.site,
    (v) => v
  )
)
// Origem só aparece com pacotes visíveis de mais de uma origem (ou com uma origem já escolhida).
const showOrigin = computed(() => (props.facets?.origin.options || []).filter((o) => o.count > 0).length > 1 || !!props.filters.origin)
</script>
