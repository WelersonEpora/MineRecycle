<template>
  <button
    ref="trigger"
    type="button"
    class="mr-helptip-btn"
    :aria-label="label"
    :aria-describedby="open ? id : undefined"
    :aria-expanded="open"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
    @click.prevent="show"
    @keydown.esc.stop="hide"
  >
    ?
  </button>
  <!-- Fora do fluxo (body), para não ser cortado por modal ou tabela com rolagem. -->
  <Teleport to="body">
    <div v-if="open" :id="id" ref="bubble" role="tooltip" class="mr-helptip" :class="`mr-helptip-${placement}`" :style="style">
      {{ text }}
      <span class="mr-helptip-arrow" :style="{ left: `${arrowLeft}px` }"></span>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'

// Ajuda curta ao lado de um rótulo: "?" que abre um balão no hover, no foco (teclado) e no toque. O clique só abre
// (no toque, mouseenter e click chegam juntos; alternar fecharia na hora); fecha no blur, ao sair o mouse ou com Esc.
defineProps({
  text: { type: String, required: true },
  label: { type: String, default: '' }
})

const id = `mr-helptip-${Math.random().toString(36).slice(2, 10)}`
const trigger = ref(null)
const bubble = ref(null)
const open = ref(false)
const placement = ref('top')
const style = ref({})
const arrowLeft = ref(0)

const GAP = 8
const MARGIN = 12

async function show() {
  if (open.value) return
  open.value = true
  style.value = { visibility: 'hidden' }
  await nextTick()
  position()
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
}

function hide() {
  open.value = false
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide)
}

// Acima do "?", centralizado e preso à janela; abaixo quando não cabe em cima.
function position() {
  if (!trigger.value || !bubble.value) return
  const t = trigger.value.getBoundingClientRect()
  const b = bubble.value.getBoundingClientRect()
  const center = t.left + t.width / 2
  const left = Math.min(Math.max(center - b.width / 2, MARGIN), window.innerWidth - b.width - MARGIN)
  const above = t.top - b.height - GAP
  placement.value = above < MARGIN ? 'bottom' : 'top'
  const top = placement.value === 'top' ? above : t.bottom + GAP
  arrowLeft.value = Math.min(Math.max(center - left, 12), b.width - 12)
  style.value = { left: `${left}px`, top: `${top}px` }
}

onBeforeUnmount(hide)
</script>

<style scoped>
.mr-helptip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  margin-left: 0.3rem;
  padding: 0;
  border: 1px solid var(--mr-border);
  border-radius: 50%;
  background: var(--mr-card);
  color: var(--mr-muted);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  vertical-align: 0.05em;
  cursor: help;
  transition:
    background-color 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.mr-helptip-btn:hover,
.mr-helptip-btn:focus-visible,
.mr-helptip-btn[aria-expanded='true'] {
  background: var(--mr-ink);
  border-color: var(--mr-ink);
  color: #fff;
}
.mr-helptip-btn:focus-visible {
  outline: 2px solid var(--mr-accent);
  outline-offset: 2px;
}
</style>

<style>
/* Global: o balão é teleportado para o body. Acima dos modais (1050/1070). */
.mr-helptip {
  position: fixed;
  z-index: 1090;
  max-width: min(320px, calc(100vw - 24px));
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--mr-ink);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.45;
  box-shadow: 0 10px 30px rgba(15, 20, 25, 0.28);
  pointer-events: none;
  animation: mr-helptip-in 0.12s ease-out;
}
.mr-helptip-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background: var(--mr-ink);
  transform: rotate(45deg);
}
.mr-helptip-top .mr-helptip-arrow {
  bottom: -5px;
}
.mr-helptip-bottom .mr-helptip-arrow {
  top: -5px;
}
@keyframes mr-helptip-in {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mr-helptip {
    animation: none;
  }
}
</style>
