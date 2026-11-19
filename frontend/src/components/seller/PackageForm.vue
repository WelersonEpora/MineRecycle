<template>
  <div class="row g-3">
    <div class="col-12">
      <label class="form-label small" for="mr-pkg-name">{{ t('seller.fields.name') }}<HelpTip :text="t('seller.fields.nameHint')" :label="t('seller.fields.help', { field: t('seller.fields.name') })" /></label>
      <input id="mr-pkg-name" v-model="model.name" type="text" maxlength="200" class="form-control" required />
    </div>
    <div class="col-6">
      <label class="form-label small" for="mr-pkg-category">{{ t('seller.fields.category') }}<HelpTip :text="t('seller.fields.categoryHint')" :label="t('seller.fields.help', { field: t('seller.fields.category') })" /></label>
      <select id="mr-pkg-category" v-model="model.category" class="form-select">
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ f.categoryLabel(c) }}</option>
      </select>
    </div>
    <div class="col-6">
      <label class="form-label small" for="mr-pkg-origin">{{ t('seller.fields.origin') }}<HelpTip :text="t('seller.fields.originHint')" :label="t('seller.fields.help', { field: t('seller.fields.origin') })" /></label>
      <select id="mr-pkg-origin" v-model="model.originId" class="form-select">
        <option value="">{{ t('seller.fields.originNone') }}</option>
        <option v-for="o in originChoices" :key="o.id" :value="o.id">{{ o.name }} ({{ o.code }}){{ o.active ? '' : ` · ${t('origins.inactive')}` }}</option>
      </select>
    </div>
    <div class="col-12">
      <label class="form-label small" for="mr-pkg-desc">{{ t('seller.fields.description') }}</label>
      <textarea id="mr-pkg-desc" v-model="model.description" rows="5" class="form-control"></textarea>
    </div>
    <div class="col-4 col-md-3">
      <label class="form-label small" for="mr-pkg-number">{{ t('seller.fields.number') }}<HelpTip :text="t(numberLocked ? 'seller.fields.numberLockedHint' : 'seller.fields.numberHint')" :label="t('seller.fields.help', { field: t('seller.fields.number') })" /></label>
      <input id="mr-pkg-number" v-model.number="model.number" type="number" min="1" class="form-control mr-mono" :readonly="numberLocked" :class="{ 'bg-body-tertiary': numberLocked }" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../services/api.js'
import HelpTip from '../HelpTip.vue'
import { useFormat, CATEGORIES } from '../../composables/useFormat.js'

// Dados do pacote que o vendedor edita (desde 2026-11-19 o pacote é um agrupamento de lotes: tipo, locais e campos do
// STOR saíram; os locais vêm dos sites dos lotes). Origem é opcional.
const model = defineModel({ type: Object, required: true })
// Na edição o ID (nº do catálogo) é só leitura: fixo depois de criado (endereço público).
defineProps({ numberLocked: { type: Boolean, default: false } })
const f = useFormat()
const t = f.t

// Origens: só as ativas, mais a atual do pacote (mesmo inativa, para não sumir do campo).
const origins = ref([])
const originChoices = computed(() => origins.value.filter((o) => o.active || o.id === model.value.originId))
onMounted(async () => {
  try {
    origins.value = await api.origins()
  } catch {
    origins.value = []
  }
})
</script>
