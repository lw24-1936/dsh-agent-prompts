import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SKILLS } from '../lib/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const SKILL_FILES = [
  'alibaba-java-standards.md',
  'f2e-spec.md',
  'software-engineering-process.md',
  'fullstack-monolith-dev.md',
  'fullstack-monolith-debug.md',
  'fullstack-microservice-dev.md',
  'fullstack-microservice-debug.md',
];

const JAVA_SECTIONS = [
  '00-index.md',
  '01a-naming.md',
  '01b-constants-format.md',
  '01c-oop.md',
  '01d-datetime.md',
  '01e-collections.md',
  '01f-concurrency.md',
  '01g-control-statements.md',
  '01h-comments-frontend-other.md',
  '02-exception-logging.md',
  '03-unit-testing.md',
  '04-security-standards.md',
  '05-mysql-database.md',
  '06-project-structure.md',
  '07-design-standards.md',
  '08-appendix.md',
  '09-modern-java.md',
  'project-template.md',
];

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

test('package metadata advertises the scanner and Node 20+', () => {
  assert.equal(pkg.version, '0.5.0');
  assert.equal(pkg.bin['dsh-agent-prompts-scan'], './resources/scan-redlines.mjs');
  assert.equal(pkg.exports['./scan'], './resources/scan-redlines.mjs');
  assert.match(pkg.engines.node, />=20/);
  assert.ok(pkg.files.includes('resources'));
  assert.ok(pkg.files.includes('skills'));
  assert.match(pkg.scripts.verify, /npm run check/);
});

test('all seven skills exist, are unique, and fit the catalog description cap', () => {
  const names = new Set();
  for (const file of SKILL_FILES) {
    const path = join(ROOT, 'skills', file);
    assert.ok(existsSync(path), `${file} missing`);
    const content = readFileSync(path, 'utf8');
    assert.ok(content.length > 1000, `${file} too short`);
    const match = content.match(/^# (.+)$/m);
    assert.ok(match, `${file} missing heading`);
    assert.ok(!names.has(file), `duplicate skill file ${file}`);
    names.add(file);
  }
  assert.equal(SKILL_FILES.length, 7);
});

test('catalog descriptions are unique, version-agnostic, and under 500 chars', () => {
  const names = new Set();
  for (const spec of SKILLS) {
    assert.ok(spec.description.length <= 500, `${spec.name} description is ${spec.description.length} chars`);
    assert.ok(spec.description.length > 80, `${spec.name} description too short`);
    assert.ok(!names.has(spec.name), `duplicate skill name ${spec.name}`);
    names.add(spec.name);
    assert.doesNotMatch(spec.description, /Spring Boot 3|JDK 21|Vue 3|MySQL 8|3\.5|2025\.0/, `${spec.name} description pins a version`);
  }
});

test('java chapter is split and no stale monolith reference remains', () => {
  for (const file of JAVA_SECTIONS) {
    assert.ok(existsSync(join(ROOT, 'resources', 'alibaba-java', file)), `alibaba-java/${file} missing`);
  }
  assert.ok(!existsSync(join(ROOT, 'resources', 'alibaba-java', '01-coding-standards.md')));
  for (const file of SKILL_FILES) {
    const content = read(join('skills', file));
    assert.ok(!content.includes('01-coding-standards.md'), `${file} still references old monolith`);
  }
  const index = read('resources/alibaba-java/00-index.md');
  for (const file of JAVA_SECTIONS) {
    if (file === 'project-template.md' || file === '00-index.md') continue;
    assert.ok(index.includes(`\`${file}\``), `00-index.md missing ${file}`);
  }
});

test('resource references in skill bodies resolve', () => {
  const known = new Set([
    ...JAVA_SECTIONS.map((file) => `alibaba-java/${file}`),
    'f2e-spec/original.md',
    'f2e-spec/toolchain.md',
    'reference/fullstack-single.original.md',
    'reference/fullstack-microservice.original.md',
    'examples/README.md',
    'examples/java-threadpool.md',
    'examples/java-datetime.md',
    'examples/java-sql.md',
    'examples/java-empty-catch.md',
    'examples/vue-key.md',
    'examples/xss.md',
    'AGENTS.snippet.md',
    'scan-redlines.mjs',
  ]);
  for (const file of SKILL_FILES) {
    const content = read(join('skills', file));
    for (const match of content.matchAll(/`((?:alibaba-java|f2e-spec|reference|examples)\/[^`\s]+|scan-redlines\.mjs|AGENTS\.snippet\.md)`/g)) {
      const ref = match[1];
      assert.ok(known.has(ref), `${file} references unknown resource ${ref}`);
      assert.ok(existsSync(join(ROOT, 'resources', ref)), `${file} references missing ${ref}`);
    }
  }
});

test('modern Java and examples are wired into the Java skill', () => {
  const java = read('skills/alibaba-java-standards.md');
  assert.match(java, /01a-naming\.md/);
  assert.match(java, /01f-concurrency\.md/);
  assert.match(java, /09-modern-java\.md/);
  assert.match(java, /examples\//);
  assert.match(java, /git diff --name-only/);
  assert.match(java, /Review 输出格式/);
});

test('process skill auto-selects and fullstack skills link to it', () => {
  const process = read('skills/software-engineering-process.md');
  for (const token of ['自动选择', 'V-Model', 'Spiral', 'Scrum', 'Kanban', 'XP', 'DevOps', 'PROCESS.md', 'DoR', 'DoD']) {
    assert.ok(process.includes(token), `process skill missing ${token}`);
  }
  assert.match(process, /不要停下来问|不先问/);
  for (const file of [
    'fullstack-monolith-dev.md',
    'fullstack-monolith-debug.md',
    'fullstack-microservice-dev.md',
    'fullstack-microservice-debug.md',
  ]) {
    assert.match(read(`skills/${file}`), /software-engineering-process/, `${file} does not link process skill`);
  }
});

test('active skills do not pin technology versions', () => {
  const active = [
    ...SKILL_FILES.map((file) => `skills/${file}`),
    'resources/alibaba-java/09-modern-java.md',
    'resources/f2e-spec/toolchain.md',
    'resources/AGENTS.snippet.md',
  ];
  for (const file of active) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /Spring Boot\s*3\.5|Spring Cloud\s*2025|Spring Cloud Alibaba\s*2025|java\.version\s*=\s*21|JDK 21（LTS）|MySQL\s*8\b/,
      `${file} still pins a technology version`,
    );
  }
  assert.match(read('skills/fullstack-microservice-dev.md'), /版本与兼容（以项目为准）/);
  assert.match(read('resources/alibaba-java/09-modern-java.md'), /按项目 JDK 版本选择/);
  assert.match(read('resources/alibaba-java/09-modern-java.md'), /不要求升级/);
  assert.match(read('resources/reference/README.md'), /不再作为强制约束|版本锁定不再生效/);
});

test('scanner is executable, documented, and has a bin shebang', () => {
  const scanner = read('resources/scan-redlines.mjs');
  assert.match(scanner, /^#!\/usr\/bin\/env node/);
  assert.match(scanner, /--changed-only/);
  assert.match(scanner, /--baseline/);
  assert.match(scanner, /--write-baseline/);
  assert.match(scanner, /--format sarif/);
  assert.match(scanner, /\.dsh\/redlines\.json/);
});

test('README documents the two marketplaces and the npm gate', () => {
  const readme = read('README.md');
  assert.match(readme, /DSH Market/);
  assert.match(readme, /DSH Plugin Hub/);
  assert.match(readme, /npm/);
  assert.match(readme, /dsh-agent-prompts-scan/);
  assert.match(readme, /## FAQ|## 常见问题/);
  assert.match(readme, /AGENTS\.snippet\.md|AGENTS\.md/);
});

test('examples index lists every example file', () => {
  const examples = readdirSync(join(ROOT, 'resources', 'examples')).filter((file) => file.endsWith('.md') && file !== 'README.md');
  const index = read('resources/examples/README.md');
  for (const file of examples) {
    assert.ok(index.includes(`\`${file}\``), `examples/README.md missing ${file}`);
  }
});

test('CHANGELOG records 0.5.0 and 0.3.0', () => {
  const changelog = read('CHANGELOG.md');
  assert.match(changelog, /## 0\.5\.0/);
  assert.match(changelog, /software-engineering-process/);
  assert.match(changelog, /## 0\.3\.0/);
  assert.match(changelog, /changed-only|baseline|拆分|SARIF/i);
});
