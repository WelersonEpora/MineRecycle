import test from 'node:test'
import assert from 'node:assert/strict'
import { formatQuantity, formatBytes, dateInputValue, endOfDayIso, apiErrorMessage, usedColumns } from './format.js'
import { readStoredLocale, storeLocale, intlLocale } from '../i18n/locale.js'

test('quantity follows the language', () => {
  assert.equal(formatQuantity('1234.5', 'en-US'), '1,234.5')
  assert.equal(formatQuantity('1234.5', 'pt-BR'), '1.234,5')
  assert.equal(formatQuantity(null, 'en-US'), '')
})

test('bytes', () => {
  assert.equal(formatBytes(512, 'en-US'), '512 B')
  assert.equal(formatBytes(1536, 'en-US'), '1.5 KB')
})

test('date input helpers', () => {
  assert.equal(dateInputValue(1, new Date(2026, 0, 31, 10)), '2026-02-01')
  const iso = endOfDayIso('2026-02-01')
  const d = new Date(iso)
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()], [2026, 1, 1, 23])
  assert.equal(endOfDayIso('bad'), null)
})

test('api error messages are translated by code', () => {
  const t = (k) => `T:${k}`
  const te = (k) => k === 'errors.LINK_EXPIRED'
  assert.equal(apiErrorMessage({ response: { status: 410, data: { error: { code: 'LINK_EXPIRED' } } } }, t, te), 'T:errors.LINK_EXPIRED')
  assert.equal(apiErrorMessage({ response: { status: 400, data: { error: { code: 'X', message: 'Raw' } } } }, t, te), 'Raw')
  assert.equal(apiErrorMessage({}, t, te), 'T:errors.network')
})

test('api error details become translation parameters', () => {
  const t = (k, p) => `${k}|${p.allowed}`
  const te = () => true
  const err = { response: { status: 400, data: { error: { code: 'ATTACHMENT_FILE_TYPE', details: { allowed: ['.pdf', '.xlsm'] } } } } }
  assert.equal(apiErrorMessage(err, t, te), 'errors.ATTACHMENT_FILE_TYPE|.pdf, .xlsm')
})

test('used columns', () => {
  assert.deepEqual(usedColumns([{ a: 1, b: null }, { a: null, b: '' }], ['a', 'b']), ['a'])
})

test('locale storage defaults to English and survives a broken storage', () => {
  const mem = new Map()
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
  assert.equal(readStoredLocale(storage), 'en')
  storeLocale(storage, 'pt')
  assert.equal(readStoredLocale(storage), 'pt')
  const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
  assert.equal(readStoredLocale(broken), 'en')
  assert.doesNotThrow(() => storeLocale(broken, 'pt'))
  assert.equal(intlLocale('pt'), 'pt-BR')
})

test('typed numbers follow the screen language', async () => {
  const { parseLocaleNumber, numberInputValue } = await import('./format.js')
  assert.equal(parseLocaleNumber('1.125', 'en-US'), 1.125)
  assert.equal(parseLocaleNumber('1,125', 'pt-BR'), 1.125)
  assert.equal(parseLocaleNumber('1.234,5', 'pt-BR'), 1234.5)
  assert.equal(parseLocaleNumber('1,234.5', 'en-US'), 1234.5)
  assert.equal(parseLocaleNumber('', 'en-US'), null)
  assert.ok(Number.isNaN(parseLocaleNumber('abc', 'en-US')))
  assert.equal(numberInputValue('1234.5', 'pt-BR'), '1234,5')
  assert.equal(numberInputValue('1234.5', 'en-US'), '1234.5')
})
