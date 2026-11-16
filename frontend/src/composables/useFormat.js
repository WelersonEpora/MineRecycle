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
    typeLabel: (v) => t(`enums.type.${v}`),
    locationLabel: (v) => t(`enums.location.${v}`),
    statusLabel: (v) => t(`enums.status.${v}`),
    kindLabel: (v) => t(`enums.kind.${v}`)
  }
}

export const TYPES = ['bulk', 'equipment']
export const LOCATIONS = ['conceicao_do_araguaia', 'uberaba', 'niquelandia']
export const STATUSES = ['draft', 'active', 'under_negotiation', 'sold', 'inactive']
export const KINDS = ['photo', 'datasheet', 'drawing', 'list', 'proposal']
export const UNITS = ['PC', 'M', 'M2', 'M3', 'KG', 'T', 'L', 'SET', 'KIT', 'ROLL', 'BOX', 'PAIR', 'LOT', 'GAL', 'BAG', 'CAN', 'SHEET', 'BAR', 'TUBE']
