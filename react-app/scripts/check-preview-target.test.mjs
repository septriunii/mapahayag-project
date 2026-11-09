import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-preview-target.mjs', import.meta.url));
function run(overrides) {
  return spawnSync(process.execPath, [script], {
    env: { ...process.env, VERCEL: '', VERCEL_ENV: '', VERCEL_GIT_COMMIT_REF: '', ...overrides }, encoding: 'utf8',
  });
}
test('accepts the approved Git preview target', () => {
  assert.equal(run({ VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/react-migration-drilldown' }).status, 0);
});
test('allows main to deploy to production and preview', () => {
  const result = run({ VERCEL: '1', VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /production target accepted/);
  assert.equal(run({ VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'main' }).status, 0);
});

test('rejects production builds from the migration branch', () => {
  const result = run({ VERCEL: '1', VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'codex/react-migration-drilldown' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /React release from main/);
});
test('rejects an unspecified cloud environment and an unapproved branch', () => {
  assert.notEqual(run({ VERCEL: '1' }).status, 0);
  assert.notEqual(run({ VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'unreviewed' }).status, 0);
});
test('allows local validation without Vercel environment variables', () => {
  assert.equal(run({}).status, 0);
});
