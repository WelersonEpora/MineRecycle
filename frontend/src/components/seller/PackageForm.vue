<template>
  <div class="row g-3">
    <div class="col-4 col-md-3">
      <label class="form-label small">{{ t('seller.fields.number') }}</label>
      <input v-model.number="model.number" type="number" min="1" class="form-control" required />
    </div>
    <div class="col-8 col-md-9">
      <label class="form-label small">{{ t('seller.fields.name') }}</label>
      <input v-model="model.name" type="text" maxlength="200" class="form-control" required />
    </div>
    <div class="col-6">
      <label class="form-label small">{{ t('seller.fields.type') }}</label>
      <select v-model="model.type" class="form-select">
        <option v-for="ty in TYPES" :key="ty" :value="ty">{{ f.typeLabel(ty) }}</option>
      </select>
    </div>
    <div class="col-6">
      <label class="form-label small">{{ t('seller.fields.location') }}</label>
      <select v-model="model.location" class="form-select">
        <option v-for="l in LOCATIONS" :key="l" :value="l">{{ f.locationLabel(l) }}</option>
      </select>
    </div>
    <div class="col-12">
      <label class="form-label small">{{ t('seller.fields.description') }}</label>
      <textarea v-model="model.description" rows="5" class="form-control"></textarea>
    </div>
  </div>
</template>

<script setup>
import { useFormat, TYPES, LOCATIONS } from '../../composables/useFormat.js'

const model = defineModel({ type: Object, required: true })
const f = useFormat()
const t = f.t
</script>
