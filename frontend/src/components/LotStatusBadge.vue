<template>
  <span class="badge" :class="cls">{{ t(`enums.lotStatus.${status}`) }}</span>
  <span v-if="withdrawn" class="badge text-bg-light border text-secondary ms-1">{{ t('lots.withdrawn') }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Situação do lote: disponível, vendido (em todos os pacotes) ou indisponível (saiu da venda). "Retirado" = sumiu da
// planilha (só o vendedor vê).
const props = defineProps({ status: { type: String, required: true }, withdrawn: { type: Boolean, default: false } })
const { t } = useI18n()
const cls = computed(() => ({ available: 'text-bg-success', sold: 'text-bg-dark', unavailable: 'text-bg-warning' })[props.status] || 'text-bg-secondary')
</script>
