import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

const password = 'test-only:password-É';
const login = value => `Basic ${Buffer.from(value).toString('base64')}`;
const request = (path, authorization) => new Request(`https://example.com${path}`, {
  headers: authorization ? { Authorization: authorization } : {},
});

test('missing secret fails closed', async () => {
  const response = await worker.fetch(request('/'), {});
  assert.equal(response.status, 503);
});

for (const path of ['/', '/index.html', '/little-spoon.html', '/anything']) {
  for (const auth of [undefined, 'Basic !!!', 'Bearer token', login('Crystal:wrong'), login(`crystal:${password}`)]) {
    test(`denies invalid credentials for ${path}: ${auth?.slice(0, 12) ?? 'none'}`, async () => {
      const response = await worker.fetch(request(path, auth), { PASSWORD: password });
      assert.equal(response.status, 401);
      assert.match(response.headers.get('WWW-Authenticate'), /^Basic /);
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    });
  }
}

test('valid credentials serve asset without passing password to binding', async () => {
  const response = await worker.fetch(request('/', login(`Crystal:${password}`)), {
    PASSWORD: password,
    ASSETS: { fetch: async req => {
      assert.equal(req.headers.get('Authorization'), null);
      return new Response('calculator', { headers: { 'Content-Type': 'text/html' } });
    } },
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'calculator');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Content-Type'), 'text/html');
});
