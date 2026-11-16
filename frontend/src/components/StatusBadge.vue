<template>
  <span class="badge" :class="cls">{{ t(`enums.status.${status}`) }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ status: { type: String, required: true } })
const { t } = useI18n()

const cls = computed(
  () =>
    ({
      draft: 'text-bg-secondary',
      active: 'text-bg-success',
      under_negotiation: 'text-bg-warning',
      sold: 'text-bg-dark',
      inactive: 'text-bg-light border'
    })[props.status] || 'text-bg-secondary'
)
</script>
