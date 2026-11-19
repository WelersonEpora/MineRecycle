import test from 'node:test'
import assert from 'node:assert/strict'
import { filtersFromQuery, filtersToQuery, activeFilterCount } from './useCatalogFilters.js'

test('filters round-trip through the URL query', () => {
  const f = filtersFromQuery({ q: ' brick ', level: 'family', origin: 'anm', site: 'Site A', negotiation: '1' })
  assert.deepEqual(f, { q: ' brick ', level: 'family', origin: 'ANM', site: 'Site A', negotiation: true })
  assert.deepEqual(filtersToQuery(f), { q: 'brick', level: 'family', origin: 'ANM', site: 'Site A', negotiation: '1' })
})

test('empty filters leave a clean URL', () => {
  assert.deepEqual(filtersToQuery(filtersFromQuery({})), {})
  assert.deepEqual(filtersFromQuery({ q: ['a', 'b'] }).q, 'a')
})

test('active filter count ignores the negotiation box', () => {
  assert.equal(activeFilterCount(filtersFromQuery({ negotiation: '1' })), 0)
  assert.equal(activeFilterCount(filtersFromQuery({ level: 'family', q: 'x', origin: 'VTM' })), 3)
})
