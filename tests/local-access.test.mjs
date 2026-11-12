import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedMutationOrigin, isLocalHost } from '../lib/local-access.ts';

test('acepta únicamente hosts locales', () => {
  assert.equal(isLocalHost('127.0.0.1:3000'), true);
  assert.equal(isLocalHost('localhost:3000'), true);
  assert.equal(isLocalHost('[::1]:3000'), true);
  assert.equal(isLocalHost('127.0.0.1.example.com:3000'), false);
  assert.equal(isLocalHost('example.com:3000'), false);
  assert.equal(isLocalHost(null), false);
});

test('rechaza orígenes externos y malformados', () => {
  assert.equal(
    isAllowedMutationOrigin('http://127.0.0.1:3000', '127.0.0.1:3000', 'same-origin'),
    true,
  );
  assert.equal(
    isAllowedMutationOrigin('https://example.com', '127.0.0.1:3000', 'cross-site'),
    false,
  );
  assert.equal(isAllowedMutationOrigin('not-an-origin', '127.0.0.1:3000', null), false);
  assert.equal(isAllowedMutationOrigin('http://localhost:3000', '127.0.0.1:3000', null), false);
  assert.equal(isAllowedMutationOrigin(null, 'example.com:3000', null), false);
});
