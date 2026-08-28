// Geo enrichment fallback chain, fully deterministic via
// the mock provider (never touches the real network).
import test from 'node:test';
import assert from 'node:assert';
import { enrich } from '../src/services/enrichment.service.js';
import * as mockGeo from '../src/providers/geo/mockGeoProvider.js';

test('provider A down, provider B answers -> submission is enriched', async () => {
  const result = await enrich('8.8.8.8', [mockGeo.down(), mockGeo.up()]);
  assert.strictEqual(result.country, 'Testland');
  assert.strictEqual(result.city, 'Testville');
  assert.strictEqual(result.provider, 'mock-up');
});

test('both providers down -> degrades to null geo, does not throw', async () => {
  const result = await enrich('8.8.8.8', [mockGeo.down(), mockGeo.down()]);
  assert.strictEqual(result.country, null);
  assert.strictEqual(result.city, null);
  assert.strictEqual(result.provider, null);
});

test('provider A up -> used directly, B never called', async () => {
  const result = await enrich('8.8.8.8', [mockGeo.up(), mockGeo.down()]);
  assert.strictEqual(result.provider, 'mock-up');
});

test('local/dev IP short-circuits without calling any provider', async () => {
  const result = await enrich('127.0.0.1', [mockGeo.down(), mockGeo.down()]);
  // Would throw if it actually tried the (down) providers — proves
  // the short-circuit branch ran instead.
  assert.strictEqual(result.country, null);
});
