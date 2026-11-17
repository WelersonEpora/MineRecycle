import test from 'node:test'
import assert from 'node:assert/strict'
import { extensionForType, pastedFileName, mergeFiles, isTextField, isImageFile } from './pending-files.js'

const file = (name, size = 10, lastModified = 1) => ({ name, size, lastModified, type: 'image/png' })

test('extension comes from the image type', () => {
  assert.equal(extensionForType('image/png'), '.png')
  assert.equal(extensionForType('IMAGE/JPEG'), '.jpg')
  assert.equal(extensionForType('application/pdf'), null)
  assert.equal(extensionForType(undefined), null)
})

test('pasted file name has date, time and index', () => {
  const d = new Date(2026, 10, 17, 14, 5, 9)
  assert.equal(pastedFileName('image/png', d), 'pasted-2026-11-17-140509.png')
  assert.equal(pastedFileName('image/jpeg', d, 1), 'pasted-2026-11-17-140509-2.jpg')
  assert.equal(pastedFileName('image/x-unknown', d), 'pasted-2026-11-17-140509.png')
})

test('merge skips duplicates and respects the limit', () => {
  const a = file('a.png')
  const r1 = mergeFiles([a], [file('a.png'), file('b.png'), file('a.png', 10, 2)], 3)
  assert.deepEqual(r1.files.map((f) => `${f.name}:${f.lastModified}`), ['a.png:1', 'b.png:1', 'a.png:2'])
  assert.equal(r1.duplicates, 1)
  assert.equal(r1.overflow, 0)
  const r2 = mergeFiles(r1.files, [file('c.png'), file('d.png')], 3)
  assert.equal(r2.files.length, 3)
  assert.equal(r2.overflow, 2)
})

test('text fields keep the normal paste', () => {
  assert.equal(isTextField({ tagName: 'INPUT', type: 'text' }), true)
  assert.equal(isTextField({ tagName: 'INPUT' }), true)
  assert.equal(isTextField({ tagName: 'TEXTAREA' }), true)
  assert.equal(isTextField({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(isTextField({ tagName: 'INPUT', type: 'checkbox' }), false)
  assert.equal(isTextField({ tagName: 'SELECT' }), false)
  assert.equal(isTextField({ tagName: 'BODY' }), false)
  assert.equal(isTextField(null), false)
})

test('image detection by type', () => {
  assert.equal(isImageFile({ type: 'image/webp' }), true)
  assert.equal(isImageFile({ type: 'application/pdf' }), false)
  assert.equal(isImageFile(null), false)
})
