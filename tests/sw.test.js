import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

test('service worker precaches every JS module and the files it lists exist', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const listed = [...sw.matchAll(/'([^']+\.(?:js|css|html|svg|png|webmanifest))'/g)].map((m) => m[1]);
  for (const f of listed) assert.ok(existsSync(f), `missing ${f}`);
  const js = ['js', 'js/core', 'js/data', 'js/games'].flatMap((d) =>
    readdirSync(d).filter((f) => f.endsWith('.js')).map((f) => `${d}/${f}`));
  for (const f of js) assert.ok(listed.includes(f), `sw.js does not precache ${f}`);
});
