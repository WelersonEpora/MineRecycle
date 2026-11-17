import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Estado dos filtros do catálogo e do link do comprador, refletido na URL (?q=&type=&origin=&location=&negotiation=1)
// para o link filtrado poder ser compartilhado. `load(params)` busca na API; a busca por texto espera o usuário parar
// de digitar.
export const EMPTY_FILTERS = { q: '', type: '', origin: '', location: '', negotiation: false }

export function filtersFromQuery(query) {
  const one = (v) => (Array.isArray(v) ? v[0] : v) || ''
  return {
    q: String(one(query.q)).slice(0, 100),
    type: String(one(query.type)),
    origin: String(one(query.origin)).toUpperCase(),
    location: String(one(query.location)),
    negotiation: one(query.negotiation) === '1'
  }
}

export function filtersToQuery(f) {
  const q = {}
  if (f.q.trim()) q.q = f.q.trim()
  if (f.type) q.type = f.type
  if (f.origin) q.origin = f.origin
  if (f.location) q.location = f.location
  if (f.negotiation) q.negotiation = '1'
  return q
}

// Filtros ativos (para "Limpar filtros" e o número no botão "Filtros" do celular). A caixa de negociação não conta.
export function activeFilterCount(f) {
  return ['type', 'origin', 'location'].filter((k) => f[k]).length + (f.q.trim() ? 1 : 0)
}

export function useCatalogFilters(load) {
  const route = useRoute()
  const router = useRouter()
  const filters = reactive(filtersFromQuery(route.query))
  const result = ref(null)
  const loading = ref(true)
  const error = ref('')
  let timer = null
  let seq = 0

  async function run() {
    const mine = ++seq
    loading.value = true
    error.value = ''
    try {
      const r = await load(filtersToQuery(filters))
      if (mine === seq) result.value = r
    } catch (err) {
      if (mine === seq) error.value = err
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  let lastQ = filters.q
  watch(filters, () => {
    clearTimeout(timer)
    const typing = filters.q !== lastQ
    lastQ = filters.q
    timer = setTimeout(
      () => {
        router.replace({ query: filtersToQuery(filters) })
        run()
      },
      typing ? 300 : 0
    )
  })

  function reset() {
    Object.assign(filters, { ...EMPTY_FILTERS, negotiation: filters.negotiation })
  }

  run()
  return { filters, result, loading, error, reset }
}
