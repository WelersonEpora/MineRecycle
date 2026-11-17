<template>
  <HelpTabs />
  <!-- Como funciona: o processo de ponta a ponta, do pacote no STOR até a venda. Textos em how.* (en.js/pt.js). -->
  <div class="d-flex flex-column gap-4">
    <header class="text-center">
      <h1 class="h4 mb-1"><i class="bi bi-diagram-3"></i> {{ t('how.title') }}</h1>
      <p class="text-secondary mb-2">{{ t('how.intro') }}</p>
      <div class="d-flex flex-wrap justify-content-center align-items-center gap-2 small">
        <span v-for="w in WHO" :key="w" class="mr-who" :class="`mr-who-${w}`">{{ t(`how.who.${w}`) }}</span>
        <button type="button" class="btn btn-link btn-sm" @click="toggleAll">{{ allOpen ? t('how.collapseAll') : t('how.expandAll') }}</button>
      </div>
    </header>

    <div class="mr-flow">
      <template v-for="(lane, li) in LANES" :key="lane.key">
        <section class="mr-lane" :aria-labelledby="`how-lane-${lane.key}`">
          <h2 :id="`how-lane-${lane.key}`" class="h6 text-center mb-1"><span class="mr-lane-n">{{ li + 1 }}</span> {{ t(`how.lanes.${lane.key}`) }}</h2>
          <template v-for="(step, si) in lane.steps" :key="step.key">
            <div v-if="si > 0" class="mr-down" aria-hidden="true"><i class="bi bi-chevron-down"></i></div>
            <div class="mr-step mr-card">
              <button
                type="button"
                class="mr-step-head"
                :aria-expanded="open.has(step.key) ? 'true' : 'false'"
                :aria-controls="`how-step-${step.key}`"
                @click="toggle(step.key)"
              >
                <span class="mr-step-n">{{ step.n }}</span>
                <span class="mr-step-title">
                  <span class="fw-semibold">{{ t(`how.steps.${step.key}.title`) }}</span>
                  <span class="mr-who" :class="`mr-who-${step.who}`">{{ t(`how.who.${step.who}`) }}</span>
                </span>
                <i class="bi" :class="open.has(step.key) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              </button>
              <div v-show="open.has(step.key)" :id="`how-step-${step.key}`" class="mr-step-body small">
                <p v-if="has(step.key, 'intro')" class="mb-2">{{ t(`how.steps.${step.key}.intro`) }}</p>
                <ul class="mb-0">
                  <li v-for="k in keys(`how.steps.${step.key}.items`)" :key="k">{{ t(`how.steps.${step.key}.items.${k}`) }}</li>
                </ul>
                <div v-if="has(step.key, 'where')" class="text-secondary mt-2">
                  <span class="fw-semibold">{{ t('how.where') }}</span> {{ t(`how.steps.${step.key}.where`) }}
                </div>
              </div>
            </div>
          </template>
        </section>
        <div v-if="li < LANES.length - 1" class="mr-arrow" aria-hidden="true"><i class="bi bi-arrow-right"></i></div>
      </template>
    </div>

    <!-- Situação do pacote: o que cada uma libera (mesma regra de access-policy.js). -->
    <section class="mr-card p-3">
      <h2 class="h6 text-center mb-1">{{ t('how.states.title') }}</h2>
      <p class="small text-secondary text-center">{{ t('how.states.intro') }}</p>
      <div class="table-responsive">
        <table class="table table-sm small align-middle mb-2">
          <thead class="table-light">
            <tr>
              <th>{{ t('how.states.status') }}</th>
              <th>{{ t('how.states.catalog') }}</th>
              <th>{{ t('how.states.link') }}</th>
              <th>{{ t('how.states.requests') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in STATES" :key="s.status">
              <td><StatusBadge :status="s.status" /></td>
              <td v-for="col in ['catalog', 'link', 'requests']" :key="col">
                <span v-if="s[col] === true" class="text-success fw-semibold"><i class="bi bi-check-lg"></i> {{ t('common.yes') }}</span>
                <span v-else-if="s[col] === false" class="text-secondary">{{ t('common.no') }}</span>
                <span v-else>{{ t(`how.states.${s[col]}`) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small text-secondary text-center mb-0">{{ t('how.states.path') }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTabs from '../../components/seller/HelpTabs.vue'
import StatusBadge from '../../components/StatusBadge.vue'

const { t, tm } = useI18n()

const WHO = ['outside', 'seller', 'buyer']
// Ordem e quem age em cada passo; o texto vem de how.steps.<chave>.
const LANES = [
  { key: 'prepare', steps: [{ key: 'stor', who: 'outside' }, { key: 'register', who: 'seller' }, { key: 'import', who: 'seller' }, { key: 'files', who: 'seller' }] },
  { key: 'publish', steps: [{ key: 'activate', who: 'seller' }, { key: 'browse', who: 'buyer' }, { key: 'link', who: 'seller' }] },
  { key: 'serve', steps: [{ key: 'ask', who: 'buyer' }, { key: 'direct', who: 'seller' }, { key: 'take', who: 'seller' }, { key: 'negotiate', who: 'seller' }] },
  { key: 'close', steps: [{ key: 'outcome', who: 'seller' }, { key: 'package', who: 'seller' }, { key: 'others', who: 'seller' }] }
]
let n = 0
for (const lane of LANES) for (const step of lane.steps) step.n = ++n

// Catálogo, link do comprador e pedidos para cada situação (PUBLIC_STATUSES, BUYER_HIDDEN_STATUSES e canSendInquiry).
const STATES = [
  { status: 'draft', catalog: false, link: false, requests: false },
  { status: 'active', catalog: true, link: true, requests: true },
  { status: 'under_negotiation', catalog: 'withToggle', link: true, requests: true },
  { status: 'sold', catalog: false, link: true, requests: false },
  { status: 'inactive', catalog: false, link: false, requests: false }
]

const keys = (path) => Object.keys(tm(path) || {})
const has = (step, part) => Boolean(tm(`how.steps.${step}`)?.[part])

const allKeys = LANES.flatMap((l) => l.steps.map((s) => s.key))
const open = reactive(new Set())
const allOpen = computed(() => allKeys.every((k) => open.has(k)))
function toggle(key) {
  if (open.has(key)) open.delete(key)
  else open.add(key)
}
function toggleAll() {
  const close = allOpen.value
  for (const k of allKeys) close ? open.delete(k) : open.add(k)
}
</script>

<style scoped>
.mr-flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
}
.mr-lane {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}
.mr-lane-n,
.mr-step-n {
  font-family: var(--mr-font-num);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.mr-lane-n {
  color: var(--mr-accent);
  font-size: 1.3rem;
}
.mr-arrow {
  align-self: center;
  color: var(--mr-accent);
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--mr-border);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--mr-card);
}
.mr-down {
  text-align: center;
  color: var(--mr-muted);
  line-height: 1;
  font-size: 0.8rem;
}
.mr-step-head {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  background: none;
  border: 0;
  padding: 0.75rem 0.85rem;
  text-align: left;
  color: inherit;
}
.mr-step-head:focus-visible {
  outline: 2px solid var(--mr-accent);
  outline-offset: 2px;
}
.mr-step-n {
  color: var(--mr-muted);
  font-size: 1.5rem;
  line-height: 1;
  min-width: 1.4em;
  text-align: right;
}
.mr-step-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  line-height: 1.25;
  min-width: 0;
}
.mr-step-body {
  border-top: 1px solid var(--mr-border);
  margin: 0 0.85rem;
  padding: 0.6rem 0 0.85rem;
  color: var(--mr-ink-soft);
}
.mr-step-body ul {
  padding-left: 1.1rem;
}
.mr-who {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}
.mr-who::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.mr-who-outside {
  color: #6f6457;
  background: #efebe5;
}
.mr-who-seller {
  color: #2f6f8f;
  background: #e5f0f5;
}
.mr-who-buyer {
  color: #6d4a9b;
  background: #efe8f7;
}
@media (max-width: 1199.98px) {
  .mr-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mr-arrow {
    display: none;
  }
}
@media (max-width: 575.98px) {
  .mr-flow {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
