import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SKILLS, apply, inject, name } from '../lib/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(HERE, '..');

const EXPECTED = [
  'alibaba-java-standards',
  'spring-boot-engineering',
  'f2e-spec',
  'vue3-engineering',
  'frontend-design-craft',
  'software-engineering-process',
  'fullstack-monolith-dev',
  'fullstack-monolith-debug',
  'fullstack-microservice-dev',
  'fullstack-microservice-debug',
];

function fakeContext() {
  const registered = [];
  const warnings = [];
  return {
    ctx: {
      logger: { warn: (message) => warnings.push(message) },
      skills: {
        register(skill) {
          registered.push(skill);
          return () => {
            const index = registered.indexOf(skill);
            if (index >= 0) registered.splice(index, 1);
          };
        },
      },
    },
    registered,
    warnings,
  };
}

test('exports a Cordis plugin contract', () => {
  assert.equal(name, 'dsh-agent-prompts');
  assert.deepEqual(inject, ['skills']);
  assert.equal(typeof apply, 'function');
});

test('registers ten skills in the catalog order', () => {
  const { ctx, registered, warnings } = fakeContext();
  apply(ctx);
  assert.equal(warnings.length, 0);
  assert.deepEqual(registered.map((skill) => skill.name), EXPECTED);
  for (const skill of registered) {
    assert.ok(skill.description.length > 80, `${skill.name} description too short`);
    assert.ok(skill.description.length < 500, `${skill.name} description exceeds catalog cap`);
    assert.ok(skill.content.length > 1000, `${skill.name} content too short`);
    assert.equal(skill.source, 'bundled');
    assert.deepEqual(skill.invocation, { modelInvocable: true, userInvocable: true });
    assert.equal(skill.metadata.pack, 'dsh-agent-prompts');
    assert.equal(skill.resourceBase.kind, 'directory');
    assert.ok(existsSync(skill.resourceBase.path), `${skill.name} resourceBase missing`);
    assert.ok(statSync(skill.resourceBase.path).isDirectory());
  }
});

test('standards skills expose progressive-disclosure resources', () => {
  const { ctx, registered } = fakeContext();
  apply(ctx);
  const java = registered.find((skill) => skill.name === 'alibaba-java-standards');
  const f2e = registered.find((skill) => skill.name === 'f2e-spec');
  assert.equal(java.resourceBase.path, join(PACKAGE_ROOT, 'resources'));
  assert.equal(f2e.resourceBase.path, join(PACKAGE_ROOT, 'resources'));
  assert.match(java.content, /01a-naming\.md/);
  assert.match(java.content, /01f-concurrency\.md/);
  assert.match(java.content, /09-modern-java\.md/);
  assert.match(java.content, /scan-redlines\.mjs/);
  assert.match(java.content, /Alibaba-Java-P0-EXEMPT/);
  assert.match(f2e.content, /f2e-spec\/toolchain\.md/);
  assert.match(f2e.content, /scan-redlines\.mjs/);
  const spring = registered.find((skill) => skill.name === 'spring-boot-engineering');
  const vue = registered.find((skill) => skill.name === 'vue3-engineering');
  const design = registered.find((skill) => skill.name === 'frontend-design-craft');
  assert.match(spring.content, /spring-boot\/api-and-service\.md/);
  assert.match(vue.content, /vue3\/core\.md/);
  assert.match(design.content, /frontend-design\/browser-check\.md/);
  for (const file of [
    'alibaba-java/01a-naming.md',
    'alibaba-java/01f-concurrency.md',
    'alibaba-java/08-appendix.md',
    'alibaba-java/09-modern-java.md',
    'f2e-spec/original.md',
    'f2e-spec/toolchain.md',
    'spring-boot/README.md',
    'spring-boot/api-and-service.md',
    'spring-boot/testing-and-modulith.md',
    'spring-boot/quality-and-local.md',
    'spring-boot/anti-patterns.md',
    'vue3/README.md',
    'vue3/core.md',
    'vue3/component-patterns.md',
    'vue3/ecosystem.md',
    'vue3/debugging.md',
    'vue3/anti-patterns.md',
    'frontend-design/README.md',
    'frontend-design/brief-and-direction.md',
    'frontend-design/visual-review.md',
    'frontend-design/browser-check.md',
    'frontend-design/anti-slop.md',
    'frontend-design/patterns.md',
    'engineering/README.md',
    'engineering/evidence-and-review.md',
    'engineering/delivery.md',
    'engineering/simplify.md',
    'examples/java-threadpool.md',
    'examples/xss.md',
    'AGENTS.snippet.md',
    'scan-redlines.mjs',
  ]) {
    assert.ok(existsSync(join(PACKAGE_ROOT, 'resources', file)), `${file} missing`);
  }
});

test('fullstack skills point at the original documents inside resources', () => {
  const { ctx, registered } = fakeContext();
  apply(ctx);
  const fullstack = registered.filter((skill) => skill.name.startsWith('fullstack-'));
  assert.equal(fullstack.length, 4);
  for (const skill of fullstack) {
    assert.equal(skill.resourceBase.path, join(PACKAGE_ROOT, 'resources'));
    assert.match(skill.content, /alibaba-java-standards/);
    assert.match(skill.content, /f2e-spec/);
  }
  const monolith = fullstack.find((skill) => skill.name === 'fullstack-monolith-dev');
  const micro = fullstack.find((skill) => skill.name === 'fullstack-microservice-dev');
  assert.match(monolith.content, /reference\/fullstack-single\.original\.md/);
  assert.match(micro.content, /reference\/fullstack-microservice\.original\.md/);
});

test('disposal unregisters every skill', () => {
  const { ctx, registered } = fakeContext();
  const dispose = apply(ctx);
  assert.equal(registered.length, 10);
  dispose();
  assert.equal(registered.length, 0);
  dispose();
  assert.equal(registered.length, 0);
});

test('config can limit or disable skills', () => {
  const onlyContext = fakeContext();
  apply(onlyContext.ctx, { only: ['f2e-spec'] });
  assert.deepEqual(onlyContext.registered.map((skill) => skill.name), ['f2e-spec']);

  const disabledContext = fakeContext();
  apply(disabledContext.ctx, { disabled: ['f2e-spec', 'alibaba-java-standards'] });
  assert.equal(disabledContext.registered.length, 8);
  assert.ok(!disabledContext.registered.some((skill) => skill.name === 'f2e-spec'));

  const unknownContext = fakeContext();
  apply(unknownContext.ctx, { disabled: ['not-a-skill'] });
  assert.equal(unknownContext.registered.length, 10);
  assert.match(unknownContext.warnings.join('\n'), /not-a-skill/);
});

test('skill spec files all exist', () => {
  for (const skill of SKILLS) {
    assert.ok(existsSync(join(PACKAGE_ROOT, 'skills', skill.file)), `${skill.file} missing`);
  }
});
