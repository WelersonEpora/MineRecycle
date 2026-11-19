import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '../i18n/locale.js'
import { formatQuantity, formatDate, formatBytes, apiErrorMessage } from '../utils/format.js'

// Formatação e rótulos no idioma atual, para usar nos componentes.
export function useFormat() {
  const { t, te, locale } = useI18n()
  const intl = computed(() => intlLocale(locale.value))
  return {
    t,
    qty: (v) => formatQuantity(v, intl.value),
    date: (v) => formatDate(v, intl.value),
    dateTime: (v) => formatDate(v, intl.value, { withTime: true }),
    bytes: (v) => formatBytes(v, intl.value),
    errorMessage: (err) => apiErrorMessage(err, t, te),
    // Número com até `max` casas decimais (ex.: peso em toneladas no cartão do catálogo).
    num: (v, max = 0) => new Intl.NumberFormat(intl.value, { maximumFractionDigits: max }).format(v),
    categoryLabel: (v) => t(`enums.category.${v || 'other'}`),
    statusLabel: (v) => t(`enums.status.${v}`),
    // Nível do pacote: montado pelo vendedor ou criado pela importação de lotes (2026-11-19).
    sourceLabel: (v) => t(`enums.source.${v || 'manual'}`),
    lotStatusLabel: (v) => t(`enums.lotStatus.${v}`),
    kindLabel: (v) => t(`enums.kind.${v}`)
  }
}

export const CATEGORIES = ['refractories', 'electrical', 'piping', 'process_equipment', 'office', 'other']
export const SOURCES = ['linked_system', 'family', 'subfamily', 'manual']
export const LOT_STATUSES = ['available', 'sold', 'unavailable']
export const STATUSES = ['draft', 'active', 'under_negotiation', 'sold', 'inactive']
export const KINDS = ['photo', 'datasheet', 'drawing', 'list', 'proposal']
