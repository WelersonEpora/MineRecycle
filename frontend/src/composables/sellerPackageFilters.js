// Filtros da lista de pacotes do vendedor, refletidos na URL (?status=&type=&originId=&location=&q=) para a lista
// voltar filtrada depois de abrir um pacote e para o link poder ser passado a um colega. Regras puras, sem Vue.
export const EMPTY_SELLER_FILTERS = { status: '', type: '', originId: '', location: '', q: '' }

export function sellerFiltersFromQuery(query) {
  const one = (v) => String((Array.isArray(v) ? v[0] : v) || '')
  return {
    status: one(query.status),
    type: one(query.type),
    originId: one(query.originId),
    location: one(query.location),
    q: one(query.q).slice(0, 100)
  }
}

export function sellerFiltersToQuery(f) {
  const q = {}
  for (const k of ['status', 'type', 'originId', 'location']) if (f[k]) q[k] = f[k]
  if (f.q.trim()) q.q = f.q.trim()
  return q
}

// Situação em chips: a API devolve os pacotes dos outros filtros e a situação é filtrada aqui, para a contagem de
// cada situação considerar Tipo, Origem, Local e busca, mas não a própria situação (como os chips da vitrine).
export function applyStatus(packages, status, statuses) {
  const counts = new Map(statuses.map((s) => [s, 0]))
  for (const p of packages) counts.set(p.status, (counts.get(p.status) || 0) + 1)
  return {
    items: status ? packages.filter((p) => p.status === status) : packages,
    facet: { all: packages.length, options: statuses.map((value) => ({ value, count: counts.get(value) })) }
  }
}
