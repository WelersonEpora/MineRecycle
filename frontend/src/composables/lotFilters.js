// Filtros de lotes (lista de lotes e "Adicionar lotes" do pacote), refletidos na URL na lista de lotes. Regras puras,
// sem Vue. "-" = valor vazio na planilha (ex.: lotes sem família comercial).
export const EMPTY_LOT_FILTERS = { q: '', linkedSystem: '', family: '', subfamily: '', site: '', status: '', withdrawn: '' }

const KEYS = Object.keys(EMPTY_LOT_FILTERS)

export function lotFiltersFromQuery(query) {
  const one = (v) => String((Array.isArray(v) ? v[0] : v) || '')
  const out = Object.fromEntries(KEYS.map((k) => [k, one(query[k]).slice(0, 200)]))
  out.q = out.q.slice(0, 100)
  out.withdrawn = out.withdrawn === '1' ? '1' : ''
  return out
}

export function lotFiltersToQuery(f) {
  const q = {}
  for (const k of KEYS) {
    const v = typeof f[k] === 'string' ? f[k].trim() : f[k]
    if (v) q[k] = v
  }
  return q
}
