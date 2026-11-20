import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SCRIPT = join(ROOT, 'resources', 'frontend-design', 'check-design.mjs');

function run(root) {
  return spawnSync(process.execPath, [SCRIPT, '--root', root, '--format', 'json', '--fail-on', 'P1'], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
}

test('design checker reports conservative anti-patterns and fails on P1', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-design-'));
  try {
    writeFileSync(join(dir, 'index.html'), `<!doctype html>
<style>
.hero { background: linear-gradient(135deg, #8b5cf6, #d8b4fe); transition: all .3s; outline: none; }
</style>
<h1>Lorem ipsum dolor</h1>
<img src="hero.png">
<div @click="go">Open</div>
<div style="z-index: 9999">bad</div>
`, 'utf8');
    const result = run(dir);
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.counts.P1 >= 4, true);
    const rules = new Set(report.findings.map((finding) => finding.rule));
    for (const rule of ['D001', 'D002', 'D003', 'D004']) {
      assert.ok(rules.has(rule), `missing ${rule}`);
    }
    assert.ok(rules.has('D005'));
    assert.ok(rules.has('D006'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('design checker passes clean markup', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-design-clean-'));
  try {
    writeFileSync(join(dir, 'index.html'), `<!doctype html>
<style>
.hero { background: #0f172a; transition: transform .2s ease; }
.hero:focus-visible { outline: 2px solid #fff; }
</style>
<button type="button">Save changes</button>
<img src="product.png" alt="Product dashboard">
<p>Real product copy.</p>
`, 'utf8');
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.counts.P1, 0);
    assert.equal(report.counts.P2, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
