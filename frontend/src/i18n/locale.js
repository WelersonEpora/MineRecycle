// Idioma escolhido pelo visitante: inglês por padrão; a escolha fica no navegador (localStorage) quando disponível.
export const LOCALES = ['en', 'pt']
export const DEFAULT_LOCALE = 'en'
const STORAGE_KEY = 'mr_locale'

export function readStoredLocale(storage) {
  try {
    const value = storage?.getItem(STORAGE_KEY)
    return LOCALES.includes(value) ? value : DEFAULT_LOCALE
  } catch (_err) {
    return DEFAULT_LOCALE
  }
}

export function storeLocale(storage, locale) {
  try {
    storage?.setItem(STORAGE_KEY, locale)
  } catch (_err) {
    // Navegador sem armazenamento (janela privada, bloqueio): a escolha vale só nesta visita.
  }
}

// Locale do Intl para datas e números.
export function intlLocale(locale) {
  return locale === 'pt' ? 'pt-BR' : 'en-US'
}
