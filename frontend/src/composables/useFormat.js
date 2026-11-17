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
    typeLabel: (v) => t(`enums.type.${v}`),
    categoryLabel: (v) => t(`enums.category.${v || 'other'}`),
    locationLabel: (v) => t(`enums.location.${v}`),
    locationsLabel: (list) => (list || []).map((v) => t(`enums.location.${v}`)).join(' · '),
    statusLabel: (v) => t(`enums.status.${v}`),
    kindLabel: (v) => t(`enums.kind.${v}`)
  }
}

export const TYPES = ['bulk', 'equipment']
export const CATEGORIES = ['refractories', 'electrical', 'piping', 'process_equipment', 'office', 'other']
export const LOCATIONS = ['conceicao_do_araguaia', 'uberaba', 'niquelandia', 'belo_horizonte', 'at_supplier', 'to_be_confirmed']
export const STATUSES = ['draft', 'active', 'under_negotiation', 'sold', 'inactive']
export const KINDS = ['photo', 'datasheet', 'drawing', 'list', 'proposal']
export const UNITS = ['PC', 'M', 'M2', 'M3', 'KG', 'T', 'L', 'SET', 'KIT', 'ROLL', 'BOX', 'PAIR', 'LOT', 'GAL', 'BAG', 'CAN', 'SHEET', 'BAR', 'TUBE']
