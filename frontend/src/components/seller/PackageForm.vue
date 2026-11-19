<template>
  <div class="row g-3">
    <div class="col-12">
      <label class="form-label small" for="mr-pkg-name">{{ t('seller.fields.name') }}<HelpTip :text="t('seller.fields.nameHint')" :label="t('seller.fields.help', { field: t('seller.fields.name') })" /></label>
      <input id="mr-pkg-name" v-model="model.name" type="text" maxlength="200" class="form-control" required />
    </div>
    <div class="col-md-6">
      <label class="form-label small" for="mr-pkg-folder">{{ t('seller.fields.storFolder') }}<HelpTip :text="t('seller.fields.storFolderHint')" :label="t('seller.fields.help', { field: t('seller.fields.storFolder') })" /></label>
      <input id="mr-pkg-folder" v-model="model.storFolder" type="text" maxlength="200" class="form-control mr-mono" />
    </div>
    <div class="col-md-6">
      <label class="form-label small" for="mr-pkg-numbers">{{ t('seller.fields.storNumbers') }}<HelpTip :text="t('seller.fields.storNumbersHint')" :label="t('seller.fields.help', { field: t('seller.fields.storNumbers') })" /></label>
      <input id="mr-pkg-numbers" v-model.lazy="storNumbersText" type="text" inputmode="numeric" class="form-control mr-mono" />
    </div>
    <div class="col-6">
      <label class="form-label small" for="mr-pkg-type">{{ t('seller.fields.type') }}</label>
      <select id="mr-pkg-type" v-model="model.type" class="form-select">
        <option v-for="ty in TYPES" :key="ty" :value="ty">{{ f.typeLabel(ty) }}</option>
      </select>
    </div>
    <div class="col-6">
      <label class="form-label small" for="mr-pkg-category">{{ t('seller.fields.category') }}<HelpTip :text="t('seller.fields.categoryHint')" :label="t('seller.fields.help', { field: t('seller.fields.category') })" /></label>
      <select id="mr-pkg-category" v-model="model.category" class="form-select">
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ f.categoryLabel(c) }}</option>
      </select>
    </div>
    <div class="col-6">
      <label class="form-label small" for="mr-pkg-origin">{{ t('seller.fields.origin') }} <span class="text-danger">*</span><HelpTip :text="t('seller.fields.originHint')" :label="t('seller.fields.help', { field: t('seller.fields.origin') })" /></label>
      <select id="mr-pkg-origin" v-model="model.originId" class="form-select" required>
        <option value="" disabled>{{ t('seller.fields.originChoose') }}</option>
        <option v-for="o in originChoices" :key="o.id" :value="o.id">{{ o.name }} ({{ o.code }}){{ o.active ? '' : ` · ${t('origins.inactive')}` }}</option>
      </select>
    </div>
    <fieldset class="col-6">
      <legend class="form-label small mb-1">{{ t('seller.fields.location') }}<HelpTip :text="t('seller.fields.locationsHint')" :label="t('seller.fields.help', { field: t('seller.fields.location') })" /></legend>
      <div v-for="l in LOCATIONS" :key="l" class="form-check">
        <input :id="`mr-loc-${l}`" v-model="model.locations" class="form-check-input" type="checkbox" :value="l" />
        <label class="form-check-label small" :for="`mr-loc-${l}`">{{ f.locationLabel(l) }}</label>
      </div>
    </fieldset>
    <div class="col-12">
      <label class="form-label small" for="mr-stor-docs">{{ t('seller.fields.storDocuments') }}<HelpTip :text="t('seller.fields.storDocumentsHint')" :label="t('seller.fields.help', { field: t('seller.fields.storDocuments') })" /></label>
      <input id="mr-stor-docs" v-model.lazy="storDocumentsText" type="text" inputmode="numeric" class="form-control mr-mono" />
      <div v-if="validCodes.length" class="mt-2">
        <div class="small mb-1">{{ t('seller.fields.storDocumentsPending') }}<HelpTip :text="t('seller.fields.storDocumentsPendingHint')" :label="t('seller.fields.help', { field: t('seller.fields.storDocumentsPending') })" /></div>
        <div v-for="c in validCodes" :key="c" class="form-check form-check-inline">
          <input :id="`mr-pend-${c}`" v-model="model.storDocumentsPending" class="form-check-input" type="checkbox" :value="c" />
          <label class="form-check-label small mr-mono" :for="`mr-pend-${c}`">{{ c }}</label>
        </div>
      </div>
    </div>
    <div class="col-12">
      <label class="form-label small" for="mr-pkg-desc">{{ t('seller.fields.description') }}</label>
      <textarea id="mr-pkg-desc" v-model="model.description" rows="5" class="form-control"></textarea>
    </div>
    <div class="col-4 col-md-3">
      <label class="form-label small" for="mr-pkg-number">{{ t('seller.fields.number') }}<HelpTip :text="t('seller.fields.numberHint')" :label="t('seller.fields.help', { field: t('seller.fields.number') })" /></label>
      <input id="mr-pkg-number" v-model.number="model.number" type="number" min="1" class="form-control" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../services/api.js'
import HelpTip from '../HelpTip.vue'
import { useFormat, TYPES, LOCATIONS, CATEGORIES } from '../../composables/useFormat.js'

const model = defineModel({ type: Object, required: true })
const f = useFormat()
const t = f.t

const splitList = (text) => text.split(/[\s,;]+/).filter(Boolean)

// Códigos das planilhas no STOR, digitados separados por vírgula ou espaço. A API valida (7 dígitos cada).
const storDocumentsText = computed({
  get: () => (model.value.storDocuments || []).join(', '),
  set: (text) => {
    model.value.storDocuments = splitList(text)
    // Pendente só faz sentido para um código que continua na lista.
    model.value.storDocumentsPending = (model.value.storDocumentsPending || []).filter((c) => model.value.storDocuments.includes(c))
  }
})

// Números do pacote na planilha de estratégia: "1, 6" ou "7-8-11". A API valida e ordena.
const storNumbersText = computed({
  get: () => (model.value.storNumbers || []).join(', '),
  set: (text) => {
    model.value.storNumbers = text
      .split(/[\s,;-]+/)
      .filter(Boolean)
      .map((v) => (/^\d+$/.test(v) ? Number(v) : v))
  }
})

// Origens: só as ativas, mais a atual do pacote (mesmo inativa, para não sumir do campo).
const origins = ref([])
const originChoices = computed(() => origins.value.filter((o) => o.active || o.id === model.value.originId))
onMounted(async () => {
  try {
    origins.value = await api.origins()
    // Pacote novo: com uma só origem ativa, já vem escolhida.
    const active = origins.value.filter((o) => o.active)
    if (!model.value.originId && active.length === 1) model.value.originId = active[0].id
  } catch {
    origins.value = []
  }
})

const validCodes = computed(() => (model.value.storDocuments || []).filter((c) => /^\d{7}$/.test(c)))
</script>
