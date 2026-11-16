import { createI18n } from 'vue-i18n'
import en from './en.js'
import pt from './pt.js'
import { readStoredLocale, storeLocale, intlLocale } from './locale.js'

const storage = typeof window !== 'undefined' ? window.localStorage : null

export const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale(storage),
  fallbackLocale: 'en',
  messages: { en, pt }
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  storeLocale(storage, locale)
  document.documentElement.setAttribute('lang', intlLocale(locale))
}

export function currentIntlLocale() {
  return intlLocale(i18n.global.locale.value)
}
