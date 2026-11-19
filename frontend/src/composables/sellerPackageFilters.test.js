import test from 'node:test'
import assert from 'node:assert/strict'
import { sellerFiltersFromQuery, sellerFiltersToQuery, applyStatus } from './sellerPackageFilters.js'

test('seller filters round-trip through the URL query', () => {
  const f = sellerFiltersFromQuery({ status: 'draft', level: 'family', originId: 'abc', site: 'Site A', q: ' kiln ' })
  assert.deepEqual(f, { status: 'draft', level: 'family', originId: 'abc', site: 'Site A', q: ' kiln ' })
  assert.deepEqual(sellerFiltersToQuery(f), { status: 'draft', level: 'family', originId: 'abc', site: 'Site A', q: 'kiln' })
  assert.deepEqual(sellerFiltersToQuery(sellerFiltersFromQuery({})), {})
  assert.equal(sellerFiltersFromQuery({ q: ['a', 'b'] }).q, 'a')
})

test('status facet counts every status and filters the list', () => {
  const pkgs = [{ status: 'draft' }, { status: 'active' }, { status: 'draft' }]
  const { items, facet } = applyStatus(pkgs, 'draft', ['draft', 'active', 'sold'])
  assert.equal(items.length, 2)
  assert.deepEqual(facet, {
    all: 3,
    options: [
      { value: 'draft', count: 2 },
      { value: 'active', count: 1 },
      { value: 'sold', count: 0 }
    ]
  })
  assert.equal(applyStatus(pkgs, '', ['draft']).items.length, 3)
})
