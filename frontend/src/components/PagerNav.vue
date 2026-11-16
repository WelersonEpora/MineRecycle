<template>
  <nav v-if="pages > 1" class="d-flex align-items-center gap-2 small">
    <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="$emit('update:page', page - 1)">
      <i class="bi bi-chevron-left"></i> {{ t('common.previous') }}
    </button>
    <span>{{ t('common.pageOf', { page, pages }) }}</span>
    <button class="btn btn-sm btn-outline-secondary" :disabled="page >= pages" @click="$emit('update:page', page + 1)">
      {{ t('common.next') }} <i class="bi bi-chevron-right"></i>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true }
})
defineEmits(['update:page'])
const { t } = useI18n()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>
