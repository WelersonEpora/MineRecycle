<template>
  <ModalDialog :show="show" :title="line ? t('seller.editLine') : t('seller.addLine')" @update:show="$emit('update:show', $event)">
    <form class="row g-3" @submit.prevent="save">
      <div class="col-4">
        <label class="form-label small">{{ t('lines.itemNo') }}</label>
        <input v-model="form.itemNo" class="form-control" maxlength="40" required />
      </div>
      <div class="col-4">
        <label class="form-label small">{{ t('lines.quantity') }}</label>
        <input v-model="form.quantity" class="form-control" inputmode="decimal" />
      </div>
      <div class="col-4">
        <label class="form-label small">{{ t('lines.unit') }}</label>
        <input v-model="form.unit" class="form-control" list="mr-units" maxlength="32" />
        <datalist id="mr-units"><option v-for="u in UNITS" :key="u" :value="u" /></datalist>
      </div>
      <div class="col-12 form-text mt-1">{{ t('seller.unitHint') }}</div>
      <div class="col-12">
        <label class="form-label small">{{ t('lines.description') }}</label>
        <textarea v-model="form.description" class="form-control" rows="3" required></textarea>
      </div>
      <div class="col-4">
        <label class="form-label small">{{ t('lines.storCode') }} <span class="text-secondary">({{ t('common.optional') }})</span></label>
        <input v-model="form.storCode" class="form-control" maxlength="64" />
      </div>
      <div class="col-4">
        <label class="form-label small">{{ t('lines.tag') }} <span class="text-secondary">({{ t('common.optional') }})</span></label>
        <input v-model="form.tag" class="form-control" maxlength="64" />
      </div>
      <div class="col-4">
        <label class="form-label small">{{ t('lines.warehouseLocation') }}</label>
        <input v-model="form.warehouseLocation" class="form-control" maxlength="128" />
      </div>
      <div class="col-12">
        <label class="form-label small">{{ t('lines.parent') }} <span class="text-secondary">({{ t('common.optional') }})</span></label>
        <select v-model="form.parentLineId" class="form-select">
          <option :value="null">{{ t('common.none') }}</option>
          <option v-for="o in parentOptions" :key="o.id" :value="o.id">{{ o.itemNo }} — {{ o.description.slice(0, 80) }}</option>
        </select>
      </div>
      <div v-if="error" class="col-12"><div class="alert alert-danger py-2 small mb-0">{{ error }}</div></div>
      <button type="submit" class="d-none"></button>
    </form>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="$emit('update:show', false)">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="busy" @click="save">{{ t('common.save') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormat, UNITS } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'
import ModalDialog from '../ModalDialog.vue'
import { parseLocaleNumber, numberInputValue } from '../../utils/format.js'
import { currentIntlLocale } from '../../i18n/index.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  packageId: { type: String, required: true },
  line: { type: Object, default: null }
})
const emit = defineEmits(['update:show', 'saved'])
const f = useFormat()
const t = f.t

const form = ref({})
const error = ref('')
const busy = ref(false)
const allLines = ref([])
const parentOptions = computed(() => allLines.value.filter((l) => l.id !== props.line?.id && !l.parentLineId))

watch(
  () => props.show,
  async (open) => {
    if (!open) return
    error.value = ''
    const l = props.line
    form.value = {
      itemNo: l?.itemNo || '',
      description: l?.description || '',
      quantity: numberInputValue(l?.quantity, currentIntlLocale()),
      unit: l?.unitRaw || l?.unit || '',
      storCode: l?.storCode || '',
      tag: l?.tag || '',
      warehouseLocation: l?.warehouseLocation || '',
      parentLineId: l?.parentLineId || null
    }
    allLines.value = (await api.sellerLines(props.packageId, { pageSize: 500 })).items
  }
)

async function save() {
  error.value = ''
  const quantity = parseLocaleNumber(form.value.quantity, currentIntlLocale())
  if (Number.isNaN(quantity)) {
    error.value = `${t('lines.quantity')}: ${t('import.codes.quantity_invalid')}`
    return
  }
  const body = { ...form.value, quantity }
  busy.value = true
  try {
    if (props.line) await api.updateLine(props.line.id, body)
    else await api.createLine(props.packageId, body)
    emit('update:show', false)
    emit('saved')
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}
</script>
