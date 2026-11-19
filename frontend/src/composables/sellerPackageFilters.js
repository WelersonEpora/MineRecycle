// Filtros da lista de pacotes do vendedor, refletidos na URL (?status=&level=&originId=&site=&q=) para a lista
// voltar filtrada depois de abrir um pacote e para o link poder ser passado a um colega. Regras puras, sem Vue.
// Nível = de onde veio o pacote (sistema, família, subfamília ou montado pelo vendedor); site = onde estão os lotes.
export const EMPTY_SELLER_FILTERS = { status: '', level: '', originId: '', site: '', q: '' }

export function sellerFiltersFromQuery(query) {
  const one = (v) => String((Array.isArray(v) ? v[0] : v) || '')
  return {
    status: one(query.status),
    level: one(query.level),
    originId: one(query.originId),
    site: one(query.site).slice(0, 120),
    q: one(query.q).slice(0, 100)
  }
}

export function sellerFiltersToQuery(f) {
  const q = {}
  for (const k of ['status', 'level', 'originId', 'site']) if (f[k]) q[k] = f[k]
  if (f.q.trim()) q.q = f.q.trim()
  return q
}

// Situação em chips: a API devolve os pacotes dos outros filtros e a situação é filtrada aqui, para a contagem de
// cada situação considerar Nível, Origem, Site e busca, mas não a própria situação (como os chips do catálogo).
export function applyStatus(packages, status, statuses) {
  const counts = new Map(statuses.map((s) => [s, 0]))
  for (const p of packages) counts.set(p.status, (counts.get(p.status) || 0) + 1)
  return {
    items: status ? packages.filter((p) => p.status === status) : packages,
    facet: { all: packages.length, options: statuses.map((value) => ({ value, count: counts.get(value) })) }
  }
}
