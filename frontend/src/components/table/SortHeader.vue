<template>
  <th :class="{ 'mr-th-sorted': active }" :aria-sort="active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'">
    <button type="button" class="mr-th-sort" @click="toggle">
      {{ label }}
      <i class="bi" :class="active ? (sort.order === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up'" aria-hidden="true"></i>
    </button>
  </th>
</template>

<script setup>
import { computed } from 'vue'

// Cabeçalho ordenável. sort = { field, order: 'asc' | 'desc' }. Clicar na coluna atual inverte; em outra, começa
// por `firstOrder`.
const props = defineProps({
  field: { type: String, required: true },
  label: { type: String, required: true },
  firstOrder: { type: String, default: 'asc' }
})
const sort = defineModel({ type: Object, required: true })
const active = computed(() => sort.value.field === props.field)

function toggle() {
  sort.value = active.value ? { field: props.field, order: sort.value.order === 'asc' ? 'desc' : 'asc' } : { field: props.field, order: props.firstOrder }
}
</script>
