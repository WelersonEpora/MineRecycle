<template>
  <div class="mr-table-card">
    <div v-if="$slots.filters" class="mr-table-card__filters">
      <slot name="filters" />
    </div>
    <div v-if="paginated || refreshable || $slots.toolbar" class="mr-table-card__bar">
      <div class="mr-table-card__start">
        <button v-if="refreshable" type="button" class="mr-table-refresh" :title="t('table.refresh')" :aria-label="t('table.refresh')" :disabled="loading" @click="$emit('refresh')">
          <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <i v-else class="bi bi-arrow-clockwise"></i>
        </button>
        <slot name="toolbar" />
      </div>
      <TablePager v-if="paginated" class="mr-table-card__center" :page="page" :pages="pages" :total="total" @update:page="page = $event" />
      <div class="mr-table-card__end">
        <label v-if="paginated" class="mr-table-per-page">
          <span>{{ t('table.perPage') }}</span>
          <select v-model.number="pageSize" class="form-select form-select-sm">
            <option v-for="n in pageSizes" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table align-middle mb-0 mr-table" :class="{ 'mr-table--clickable': clickable, 'table-sm': dense }">
        <thead>
          <slot name="head" />
        </thead>
        <tbody>
          <slot />
          <tr v-if="empty" class="mr-table__empty">
            <td colspan="99" class="text-secondary">{{ loading ? t('common.loading') : emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="paginated && pages > 1" class="mr-table-card__bar mr-table-card__bar--bottom">
      <TablePager :page="page" :pages="pages" :total="total" :show-report="false" @update:page="page = $event" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PAGE_SIZES, pageCount } from '../../utils/pagination.js'
import TablePager from './TablePager.vue'

// Tabela no padrão "tabela-card" do FinMind (lá com o DataTable do PrimeVue; aqui com Bootstrap): filtros numa faixa
// no topo do cartão, barra com atualizar, paginação e "Por página" em cima, paginação de novo embaixo, linhas
// clicáveis com a seta no fim. As linhas vêm no slot padrão (<tr>), o cabeçalho no slot "head".
const props = defineProps({
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
  paginated: { type: Boolean, default: true },
  refreshable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  pageSizes: { type: Array, default: () => PAGE_SIZES }
})
defineEmits(['refresh'])
const page = defineModel('page', { type: Number, default: 1 })
const pageSize = defineModel('pageSize', { type: Number, default: PAGE_SIZES[0] })
const { t } = useI18n()

const pages = computed(() => pageCount(props.total, pageSize.value))
// Trocar o tamanho da página volta para a primeira; total menor (filtro) não deixa a página fora do fim.
watch(pageSize, () => (page.value = 1))
watch(pages, (n) => {
  if (page.value > n) page.value = n
})
</script>
