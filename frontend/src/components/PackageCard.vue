<template>
  <RouterLink :to="{ name: 'package', params: { number: pkg.number } }" class="text-decoration-none text-reset">
    <article class="mr-card mr-package-card h-100 d-flex flex-column">
      <img v-if="pkg.coverUrl" :src="pkg.coverUrl" class="mr-cover" :alt="pkg.name" loading="lazy" />
      <!-- Sem foto pública: etiqueta de inventário (cor e ícone da categoria, número em destaque). -->
      <div v-else class="mr-cover-tag" :class="`mr-cat-${category}`" role="img" :aria-label="coverLabel">
        <span class="mr-cover-water"><CategoryIcon :category="category" /></span>
        <span class="mr-cover-stencil">{{ f.categoryLabel(category) }}</span>
        <template v-if="highlight">
          <span class="mr-cover-num">{{ highlight.value }}</span>
          <span class="mr-cover-lbl">{{ highlight.label }}</span>
        </template>
      </div>
      <div class="p-3 d-flex flex-column flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1 small">
          <span class="badge rounded-pill text-bg-light border">{{ f.typeLabel(pkg.type) }}</span>
          <StatusBadge v-if="pkg.status !== 'active'" :status="pkg.status" />
          <span class="text-secondary mr-mono ms-auto" :title="t('catalog.packageId')">#{{ pkg.number }}</span>
        </div>
        <h3 class="h6 mb-2">{{ pkg.name }}</h3>
        <div class="mt-auto small text-secondary d-flex justify-content-between">
          <span><i class="bi bi-geo-alt"></i> {{ f.locationsLabel(pkg.locations) }}</span>
          <span v-if="pkg.lineCount">{{ t('catalog.lines', pkg.lineCount) }}</span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat, CATEGORIES } from '../composables/useFormat.js'
import StatusBadge from './StatusBadge.vue'
import CategoryIcon from './CategoryIcon.vue'

const props = defineProps({ pkg: { type: Object, required: true } })
const { t } = useI18n()
const f = useFormat()

const category = computed(() => (CATEGORIES.includes(props.pkg.category) ? props.pkg.category : 'other'))

// Número em destaque calculado no servidor: peso (t), unidades ou itens. Peso abaixo de 1 t aparece em kg.
const highlight = computed(() => {
  const h = props.pkg.highlight
  if (!h) return null
  if (h.kind === 'weight') {
    if (h.value < 1) return { value: `${f.num(h.value * 1000)} kg`, label: t('catalog.highlight.weight') }
    return { value: `${f.num(h.value, h.value < 10 ? 1 : 0)} t`, label: t('catalog.highlight.weight') }
  }
  if (h.kind === 'units') return { value: f.num(h.value), label: t('catalog.highlight.units', h.value) }
  return { value: f.num(h.value), label: t('catalog.highlight.items', h.value) }
})
const coverLabel = computed(() => [f.categoryLabel(category.value), highlight.value && `${highlight.value.value} ${highlight.value.label}`].filter(Boolean).join(': '))
</script>
