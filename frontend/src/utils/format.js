// Formatação dependente do idioma. Funções puras: recebem o locale do Intl ('en-US' ou 'pt-BR').

export function formatQuantity(value, intlLocale) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 4 }).format(n)
}

export function formatDate(value, intlLocale, { withTime = false } = {}) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(d)
}

export function formatBytes(bytes, intlLocale) {
  if (bytes === null || bytes === undefined) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = Number(bytes)
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: i === 0 ? 0 : 1 }).format(n)} ${units[i]}`
}

// Data local (yyyy-mm-dd) para um <input type="date">, a partir de hoje + dias.
export function dateInputValue(daysFromNow, now = new Date()) {
  const d = new Date(now.getTime() + daysFromNow * 86400000)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Fim do dia escolhido, no fuso do navegador, em ISO (o link vale até 23:59 do dia).
export function endOfDayIso(dateInput) {
  const [y, m, d] = String(dateInput).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 23, 59, 59).toISOString()
}

// Mensagem de erro da API, traduzida pelo `code` quando houver tradução.
export function apiErrorMessage(err, t, te) {
  if (!err?.response) return t('errors.network')
  const code = err.response.data?.error?.code
  if (code && te(`errors.${code}`)) return t(`errors.${code}`)
  if (err.response.status === 401) return t('errors.UNAUTHORIZED')
  return err.response.data?.error?.message || t('errors.generic')
}

// Mostra a coluna só se alguma linha da página tiver valor nela.
export function usedColumns(lines, columns) {
  return columns.filter((c) => lines.some((l) => l[c] !== null && l[c] !== undefined && l[c] !== ''))
}

// Número digitado num campo, no formato do idioma da tela: inglês "1,234.5", português "1.234,5".
// -> número, null (vazio) ou NaN (inválido).
export function parseLocaleNumber(text, intlLocale) {
  const s = String(text ?? '').trim().replace(/\s/g, '')
  if (!s) return null
  const [group, decimal] = intlLocale === 'pt-BR' ? ['.', ','] : [',', '.']
  const normalized = s.split(group).join('').replace(decimal, '.')
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN
}

// Número para um campo editável, sem separador de milhar.
export function numberInputValue(value, intlLocale) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 4, useGrouping: false }).format(n)
}
