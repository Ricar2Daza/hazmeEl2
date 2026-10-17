const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeMessageContent } = require('../../src/utils/chatMessage');

test('normaliza espacios alrededor del mensaje', () => {
  assert.equal(normalizeMessageContent('  Hola, ¿cómo estás?  '), 'Hola, ¿cómo estás?');
});

test('rechaza mensajes vacíos o compuestos solo por espacios', () => {
  for (const content of ['', '   \n  ']) {
    assert.throws(
      () => normalizeMessageContent(content),
      (error) => error.statusCode === 400 && /no puede estar vacío/.test(error.message)
    );
  }
});

test('acepta el límite de 2000 caracteres y rechaza el siguiente', () => {
  assert.equal(normalizeMessageContent('x'.repeat(2000)).length, 2000);
  assert.throws(
    () => normalizeMessageContent('x'.repeat(2001)),
    (error) => error.statusCode === 400 && /2000 caracteres/.test(error.message)
  );
});