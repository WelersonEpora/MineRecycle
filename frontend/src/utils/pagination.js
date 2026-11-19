// Paginação das tabelas (padrão "tabela-card" do FinMind). Regras puras, sem Vue.

export const PAGE_SIZES = [25, 50, 100, 200]

export function pageCount(total, pageSize) {
  return Math.max(1, Math.ceil((Number(total) || 0) / pageSize))
}

// Números de página mostrados: até `size` páginas em volta da atual, sem passar do começo nem do fim.
export function pageWindow(page, pages, size = 5) {
  const count = Math.min(size, pages)
  let start = Math.max(1, page - Math.floor(count / 2))
  start = Math.min(start, pages - count + 1)
  return Array.from({ length: count }, (_, i) => start + i)
}

// Página de uma lista que já está toda em memória (ex.: pacotes do vendedor).
export function slicePage(items, page, pageSize) {
  return items.slice((page - 1) * pageSize, page * pageSize)
}

// Ordenação em memória: sort = { field, order: 'asc' | 'desc' }. Texto pelo idioma (números dentro do texto em ordem
// natural); vazio sempre no fim.
export function sortItems(items, sort, locale = 'en') {
  if (!sort?.field) return items
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  const dir = sort.order === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    const x = a[sort.field]
    const y = b[sort.field]
    const xe = x === null || x === undefined || x === ''
    const ye = y === null || y === undefined || y === ''
    if (xe || ye) return xe === ye ? 0 : xe ? 1 : -1
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return collator.compare(String(x), String(y)) * dir
  })
}
