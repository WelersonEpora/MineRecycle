import test from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_LOT_FILTERS, lotFiltersFromQuery, lotFiltersToQuery } from './lotFilters.js'

test('lot filters round-trip through the URL query', () => {
  const f = lotFiltersFromQuery({ q: ' motor ', linkedSystem: 'Kiln', family: '-', site: 'Site A', status: 'sold', withdrawn: '1' })
  assert.deepEqual(lotFiltersToQuery(f), { q: 'motor', linkedSystem: 'Kiln', family: '-', site: 'Site A', status: 'sold', withdrawn: '1' })
  assert.deepEqual(lotFiltersToQuery(lotFiltersFromQuery({})), {})
  assert.deepEqual(lotFiltersFromQuery({}), EMPTY_LOT_FILTERS)
})

test('withdrawn accepts only "1"', () => {
  assert.equal(lotFiltersFromQuery({ withdrawn: 'yes' }).withdrawn, '')
  assert.equal(lotFiltersFromQuery({ q: ['a', 'b'] }).q, 'a')
})
