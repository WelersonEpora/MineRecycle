import test from 'node:test'
import assert from 'node:assert/strict'
import { pageCount, pageWindow, slicePage, sortItems } from './pagination.js'

test('page count is at least 1', () => {
  assert.equal(pageCount(0, 25), 1)
  assert.equal(pageCount(25, 25), 1)
  assert.equal(pageCount(26, 25), 2)
})

test('page window stays inside the pages', () => {
  assert.deepEqual(pageWindow(1, 591), [1, 2, 3, 4, 5])
  assert.deepEqual(pageWindow(10, 591), [8, 9, 10, 11, 12])
  assert.deepEqual(pageWindow(591, 591), [587, 588, 589, 590, 591])
  assert.deepEqual(pageWindow(2, 3), [1, 2, 3])
  assert.deepEqual(pageWindow(1, 1), [1])
})

test('slice a page of an in-memory list', () => {
  assert.deepEqual(slicePage([1, 2, 3, 4, 5], 2, 2), [3, 4])
})

test('sort: natural text order, numbers, empty values last, both directions', () => {
  const items = [{ n: 'Lot 10' }, { n: 'lot 2' }, { n: null }, { n: 'Lot 1' }]
  assert.deepEqual(sortItems(items, { field: 'n', order: 'asc' }).map((x) => x.n), ['Lot 1', 'lot 2', 'Lot 10', null])
  assert.deepEqual(sortItems(items, { field: 'n', order: 'desc' }).map((x) => x.n), ['Lot 10', 'lot 2', 'Lot 1', null])
  assert.deepEqual(sortItems([{ v: 10 }, { v: 9 }], { field: 'v', order: 'asc' }).map((x) => x.v), [9, 10])
  assert.equal(sortItems(items, null), items)
})
