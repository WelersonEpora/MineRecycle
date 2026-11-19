<template>
  <div class="mr-pager">
    <div v-if="showReport" class="mr-pager__report">{{ t('table.report', { page, pages, total: f.num(total) }) }}</div>
    <nav v-if="pages > 1" class="mr-pager__links" :aria-label="t('table.pages')">
      <button type="button" class="mr-pager__btn" :disabled="page <= 1" :aria-label="t('table.first')" @click="go(1)"><i class="bi bi-chevron-double-left"></i></button>
      <button type="button" class="mr-pager__btn" :disabled="page <= 1" :aria-label="t('common.previous')" @click="go(page - 1)"><i class="bi bi-chevron-left"></i></button>
      <button
        v-for="n in pageWindow(page, pages)"
        :key="n"
        type="button"
        class="mr-pager__btn mr-pager__num"
        :class="{ 'is-active': n === page }"
        :aria-current="n === page ? 'page' : undefined"
        @click="go(n)"
      >
        {{ n }}
      </button>
      <button type="button" class="mr-pager__btn" :disabled="page >= pages" :aria-label="t('common.next')" @click="go(page + 1)"><i class="bi bi-chevron-right"></i></button>
      <button type="button" class="mr-pager__btn" :disabled="page >= pages" :aria-label="t('table.last')" @click="go(pages)"><i class="bi bi-chevron-double-right"></i></button>
    </nav>
  </div>
</template>

<script setup>
import { useFormat } from '../../composables/useFormat.js'
import { pageWindow } from '../../utils/pagination.js'

// Paginador da tabela: "Página X de Y (N no total)" e os números de página, como no FinMind.
const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
  total: { type: Number, required: true },
  showReport: { type: Boolean, default: true }
})
const emit = defineEmits(['update:page'])
const f = useFormat()
const t = f.t

function go(n) {
  if (n >= 1 && n <= props.pages && n !== props.page) emit('update:page', n)
}
</script>
