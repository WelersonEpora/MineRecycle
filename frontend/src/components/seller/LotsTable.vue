<template>
  <DataTableCard
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="total"
    :loading="loading"
    :empty="!items.length"
    :empty-text="t('lots.none')"
    :clickable="clickable"
    :refreshable="refreshable"
    @refresh="$emit('refresh')"
  >
    <template v-if="$slots.filters" #filters><slot name="filters" /></template>
    <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>
    <template #head>
      <tr>
        <th v-if="selectable" style="width: 2.5rem">
          <input class="form-check-input" type="checkbox" :checked="allOnPage" :aria-label="t('lots.selectFiltered', { n: items.length })" @change="togglePage" />
        </th>
        <SortHeader v-model="sort" field="lotNumber" :label="t('lots.lotNumber')" />
        <SortHeader v-model="sort" field="title" :label="t('lots.title')" />
        <SortHeader v-model="sort" field="linkedSystem" :label="t('lots.linkedSystem')" />
        <SortHeader v-model="sort" field="commercialFamily" :label="t('lots.family')" />
        <SortHeader v-model="sort" field="siteName" :label="t('lots.site')" />
        <SortHeader v-model="sort" field="status" :label="t('lots.status')" />
        <th v-if="showPackages" class="mr-num">{{ t('lots.packages') }}</th>
        <th class="mr-num">{{ t('lots.files') }}</th>
      </tr>
    </template>
    <tr v-for="l in items" :key="l.id" @click="clickable && $emit('open', l)">
      <td v-if="selectable" @click.stop>
        <input class="form-check-input" type="checkbox" :checked="selected.includes(l.id)" :aria-label="l.lotNumber" @change="toggle(l.id)" />
      </td>
      <td class="mr-mono small text-nowrap">{{ l.lotNumber }}</td>
      <td>
        <div class="small">{{ l.title }}</div>
        <div v-if="l.masterSupplier" class="small text-secondary">{{ l.masterSupplier }}</div>
      </td>
      <td class="small">{{ l.linkedSystem }}</td>
      <td class="small">{{ l.commercialFamily }}<div v-if="l.subfamily" class="text-secondary">{{ l.subfamily }}</div></td>
      <td class="small text-nowrap">{{ l.siteName }}</td>
      <td class="text-nowrap"><LotStatusBadge :status="l.status" :withdrawn="Boolean(l.withdrawnAt)" /></td>
      <td v-if="showPackages" class="mr-num small">{{ l.packageCount }}</td>
      <td class="mr-num small">{{ l.attachmentCount || '' }}</td>
    </tr>
  </DataTableCard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PAGE_SIZES } from '../../utils/pagination.js'
import DataTableCard from '../table/DataTableCard.vue'
import SortHeader from '../table/SortHeader.vue'
import LotStatusBadge from '../LotStatusBadge.vue'

// Tabela de lotes (lista de lotes, lotes do pacote e "Adicionar lotes"). Paginação e ordenação no servidor: quem usa
// observa page, pageSize e sort e recarrega.
const props = defineProps({
  items: { type: Array, required: true },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: true },
  refreshable: { type: Boolean, default: true },
  showPackages: { type: Boolean, default: false }
})
// Ids marcados (podem incluir lotes de outras páginas).
const selected = defineModel('selected', { type: Array, default: () => [] })
const page = defineModel('page', { type: Number, default: 1 })
const pageSize = defineModel('pageSize', { type: Number, default: PAGE_SIZES[1] })
const sort = defineModel('sort', { type: Object, default: () => ({ field: '', order: 'asc' }) })
defineEmits(['open', 'refresh'])
const { t } = useI18n()

const allOnPage = computed(() => props.items.length > 0 && props.items.every((l) => selected.value.includes(l.id)))

function toggle(id) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]
}

function togglePage() {
  const ids = props.items.map((l) => l.id)
  selected.value = allOnPage.value ? selected.value.filter((x) => !ids.includes(x)) : [...new Set([...selected.value, ...ids])]
}
</script>
