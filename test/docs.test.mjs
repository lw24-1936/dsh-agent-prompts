import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SKILLS } from '../lib/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const IGNORED = new Set(['node_modules', '.git']);

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function markdownFiles(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORED.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) markdownFiles(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

test('all local markdown links resolve', () => {
  let checked = 0;
  for (const file of markdownFiles()) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let href = match[1].trim();
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
      href = href.split('#')[0];
      if (!href) continue;
      const target = resolve(dirname(file), href);
      assert.ok(existsSync(target), `${file.replace(ROOT, '')} -> missing ${href}`);
      checked++;
    }
  }
  assert.ok(checked > 50, `expected many links, checked ${checked}`);
});

test('skill names are consistent across README, AGENTS and snippet', () => {
  const files = ['README.md', 'README.en.md', 'AGENTS.md', 'resources/AGENTS.snippet.md'];
  for (const file of files) {
    const text = read(file);
    for (const spec of SKILLS) {
      assert.ok(text.includes(`\`${spec.name}\``), `${file} missing ${spec.name}`);
    }
  }
});

test('README skill table lists exactly the registered skills', () => {
  const readme = read('README.md');
  const start = readme.indexOf('## 技能矩阵');
  assert.ok(start >= 0, 'README missing skill section');
  const end = readme.indexOf('\n## ', start + 1);
  const section = readme.slice(start, end === -1 ? undefined : end);
  const listed = new Set([...section.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]));
  assert.deepEqual([...listed].sort(), SKILLS.map((skill) => skill.name).sort());
});

test('agent entry points and maintenance docs exist', () => {
  for (const file of ['AGENTS.md', 'docs/TRIGGER-MATRIX.md', 'docs/REFERENCE-SKILL-ANALYSIS.md', 'docs/SKILL-AUTHORING.md', '.gitattributes']) {
    assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
  }
  const agents = read('AGENTS.md');
  assert.ok(agents.length > 3000, 'AGENTS.md should be a full document');
  assert.match(agents, /## 2\. 最小工作流/);
  assert.match(agents, /spring-boot-engineering/);
  assert.match(agents, /check-design\.mjs/);
  assert.match(read('.gitattributes'), /text=auto/);
});
