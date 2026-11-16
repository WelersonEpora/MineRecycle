<template>
  <ul v-if="documents.length" class="list-group">
    <li v-for="d in documents" :key="d.id" class="list-group-item d-flex align-items-center gap-2">
      <i class="bi" :class="icon(d)"></i>
      <div class="flex-grow-1 min-w-0">
        <a :href="d.url" target="_blank" rel="noopener" class="text-break">{{ d.title || d.originalName }}</a>
        <div class="small text-secondary">
          {{ f.kindLabel(d.kind) }}<span v-if="d.sizeBytes"> · {{ f.bytes(d.sizeBytes) }}</span>
        </div>
      </div>
      <span v-if="d.visibility === 'restricted' || d.kind === 'proposal'" class="badge text-bg-warning">
        <i class="bi bi-lock"></i> {{ t('package.restricted') }}
      </span>
    </li>
  </ul>
  <p v-else class="text-secondary small mb-0">{{ t('package.noDocuments') }}</p>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat.js'

defineProps({ documents: { type: Array, required: true } })
const { t } = useI18n()
const f = useFormat()

function icon(d) {
  if (d.mimeType === 'application/pdf') return 'bi-file-earmark-pdf text-danger'
  if (d.mimeType?.includes('sheet') || d.mimeType?.includes('excel')) return 'bi-file-earmark-spreadsheet text-success'
  if (d.mimeType?.startsWith('image/')) return 'bi-file-earmark-image'
  return 'bi-file-earmark'
}
</script>
