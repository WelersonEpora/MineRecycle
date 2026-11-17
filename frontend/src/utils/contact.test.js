import test from 'node:test'
import assert from 'node:assert/strict'
import { whatsappUrl, mailtoUrl, whatsappLabel, telUrl } from './contact.js'

test('whatsapp link keeps digits and encodes the text', () => {
  assert.equal(whatsappUrl('+55 (11) 98765-4321', 'Pkg A & B'), 'https://wa.me/5511987654321?text=Pkg%20A%20%26%20B')
  assert.equal(whatsappUrl('5511987654321'), 'https://wa.me/5511987654321')
  assert.equal(whatsappUrl(null, 'x'), '')
  assert.equal(whatsappLabel('5511987654321'), '+5511987654321')
})

test('mailto link encodes subject and body', () => {
  assert.equal(mailtoUrl('sales@example.test', 'About: Pkg 1', 'Line 1\nhttps://x.test/packages/1'),
    'mailto:sales@example.test?subject=About%3A%20Pkg%201&body=Line%201%0Ahttps%3A%2F%2Fx.test%2Fpackages%2F1')
  assert.equal(mailtoUrl('sales@example.test'), 'mailto:sales@example.test')
  assert.equal(mailtoUrl(''), '')
})

test('tel link', () => {
  assert.equal(telUrl('+1 (555) 0100'), 'tel:+15550100')
  assert.equal(telUrl('11 98765-4321'), 'tel:11987654321')
  assert.equal(telUrl(''), '')
})
