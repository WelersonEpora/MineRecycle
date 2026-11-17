<template>
  <RouterLink :to="{ name: 'package', params: { number: pkg.number } }" class="text-decoration-none text-reset">
    <article class="mr-card mr-package-card h-100 d-flex flex-column">
      <img v-if="pkg.coverUrl" :src="pkg.coverUrl" class="mr-cover" :alt="pkg.name" loading="lazy" />
      <div v-else class="mr-cover-empty"><i :class="pkg.type === 'equipment' ? 'bi bi-gear-wide-connected' : 'bi bi-boxes'"></i></div>
      <div class="p-3 d-flex flex-column flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1 small">
          <span class="badge rounded-pill text-bg-light border">{{ f.typeLabel(pkg.type) }}</span>
          <StatusBadge v-if="pkg.status !== 'active'" :status="pkg.status" />
        </div>
        <h3 class="h6 mb-2">{{ pkg.name }}</h3>
        <div class="mt-auto small text-secondary d-flex justify-content-between">
          <span><i class="bi bi-geo-alt"></i> {{ f.locationsLabel(pkg.locations) }}</span>
          <span v-if="pkg.lineCount !== undefined">{{ t('catalog.lines', pkg.lineCount) }}</span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat.js'
import StatusBadge from './StatusBadge.vue'

defineProps({ pkg: { type: Object, required: true } })
const { t } = useI18n()
const f = useFormat()
</script>
