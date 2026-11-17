<template>
  <div class="mr-chip-group">
    <span :id="labelId" class="mr-chip-label">{{ label }}</span>
    <!-- Padrão "radiogroup": Tab entra no grupo (no chip selecionado), setas e Home/End mudam a seleção. -->
    <div ref="groupEl" class="mr-chips" role="radiogroup" :aria-labelledby="labelId" @keydown="onKey">
      <button
        v-for="o in all"
        :key="o.value"
        type="button"
        class="mr-chip"
        role="radio"
        :aria-checked="o.value === modelValue ? 'true' : 'false'"
        :tabindex="o.value === modelValue ? 0 : -1"
        :data-value="o.value"
        @click="select(o.value)"
      >
        {{ o.label }}<span v-if="o.count !== undefined" class="mr-chip-count">{{ o.count }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  allLabel: { type: String, required: true },
  allCount: { type: Number, default: undefined },
  // [{ value, label, count }]
  options: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])
const groupEl = ref(null)
const labelId = computed(() => `mr-chips-${props.id}`)
const all = computed(() => [{ value: '', label: props.allLabel, count: props.allCount }, ...props.options])

function select(value) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

async function onKey(e) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const values = all.value.map((o) => o.value)
  let i = values.indexOf(props.modelValue)
  if (e.key === 'Home') i = 0
  else if (e.key === 'End') i = values.length - 1
  else i = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + values.length) % values.length
  select(values[i])
  await nextTick()
  groupEl.value?.querySelector(`[data-value="${CSS.escape(values[i])}"]`)?.focus()
}
</script>
