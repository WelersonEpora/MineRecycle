<template>
  <div>
    <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
      <div class="input-group input-group-sm" style="max-width: 420px">
        <span class="input-group-text"><i class="bi bi-search"></i></span>
        <input v-model="q" type="search" class="form-control" :placeholder="t('lines.searchPlaceholder')" />
      </div>
      <span class="small text-secondary">{{ t('common.results', total) }}</span>
      <div class="ms-auto d-flex gap-2"><slot name="toolbar" /></div>
    </div>

    <div class="table-responsive mr-card">
      <table class="table table-sm table-hover mb-0 mr-lines">
        <thead class="table-light">
          <tr>
            <th style="width: 6rem">{{ t('lines.itemNo') }}</th>
            <th>{{ t('lines.description') }}</th>
            <th class="mr-num">{{ t('lines.quantity') }}</th>
            <th>{{ t('lines.unit') }}</th>
            <th v-for="c in extraColumns" :key="c">{{ t(`lines.${c}`) }}</th>
            <th v-if="hasFiles" class="text-center">{{ t('lines.files') }}</th>
            <th v-if="editable" class="text-end">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="colspan" class="text-secondary">{{ t('common.loading') }}</td>
          </tr>
          <tr v-else-if="!items.length">
            <td :colspan="colspan" class="text-secondary">{{ t('lines.empty') }}</td>
          </tr>
          <tr v-for="line in items" v-else :key="line.id" :class="{ 'mr-child': line.parentLineId }">
            <td class="mr-mono">{{ line.itemNo }}</td>
            <td>
              <span v-if="line.parentLineId" class="text-secondary me-1">↳</span>{{ line.description }}
            </td>
            <td class="mr-num">{{ f.qty(line.quantity) }}</td>
            <td :title="line.unitRaw && line.unitRaw !== line.unit ? line.unitRaw : ''">{{ line.unit }}</td>
            <td v-for="c in extraColumns" :key="c" class="mr-mono small">{{ line[c] }}</td>
            <td v-if="hasFiles" class="text-center">
              <button
                v-if="filesByLine[line.id]?.length"
                class="btn btn-sm btn-outline-secondary py-0"
                @click="$emit('show-files', line)"
              >
                <i class="bi bi-paperclip"></i> {{ filesByLine[line.id].length }}
              </button>
            </td>
            <td v-if="editable" class="text-end text-nowrap">
              <button class="btn btn-sm btn-link py-0" :title="t('common.edit')" @click="$emit('edit', line)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-link text-danger py-0" :title="t('common.delete')" @click="$emit('delete', line)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-end mt-2">
      <PagerNav v-model:page="page" :page-size="pageSize" :total="total" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat.js'
import { usedColumns } from '../utils/format.js'
import PagerNav from './PagerNav.vue'

const props = defineProps({
  // (params) => Promise<{ items, total, page, pageSize }>
  loader: { type: Function, required: true },
  editable: { type: Boolean, default: false },
  attachments: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 50 }
})
defineEmits(['edit', 'delete', 'show-files'])
const { t } = useI18n()
const f = useFormat()

const q = ref('')
const page = ref(1)
const items = ref([])
const total = ref(0)
const loading = ref(false)
let timer = null
let requestSeq = 0

const extraColumns = computed(() => usedColumns(items.value, ['storCode', 'tag', 'warehouseLocation']))
const filesByLine = computed(() => {
  const map = {}
  for (const a of props.attachments) if (a.lineId) (map[a.lineId] ||= []).push(a)
  return map
})
const hasFiles = computed(() => props.attachments.some((a) => a.lineId))
const colspan = computed(() => 4 + extraColumns.value.length + (hasFiles.value ? 1 : 0) + (props.editable ? 1 : 0))

async function load() {
  const seq = ++requestSeq
  loading.value = true
  try {
    const r = await props.loader({ page: page.value, pageSize: props.pageSize, q: q.value || undefined })
    if (seq !== requestSeq) return
    items.value = r.items
    total.value = r.total
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (page.value !== 1) page.value = 1
    else load()
  }, 300)
})
watch(page, load)
onMounted(load)

defineExpose({ reload: load })
</script>
