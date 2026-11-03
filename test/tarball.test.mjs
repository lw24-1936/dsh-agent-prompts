import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const NPM = 'npm';

function runNpm(args, cwd) {
  const options = { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 };
  if (process.platform === 'win32') {
    // Windows 的 npm 是 .cmd，node 直接 spawn 会 EINVAL；用 shell 执行单个命令串，
    // 避免「shell + args 数组」的 DEP0190。测试参数均为本地生成、不含空格。
    return spawnSync(`${NPM} ${args.join(' ')}`, { ...options, shell: true });
  }
  return spawnSync(NPM, args, options);
}

test('packed tarball installs and exposes six skills plus scanner', { timeout: 120000 }, async () => {
  const npmVersion = runNpm(['--version'], ROOT);
  if (npmVersion.status !== 0) {
    test.skip('npm not available');
    return;
  }
  const packDir = mkdtempSync(join(tmpdir(), 'dsh-pack-'));
  const installDir = mkdtempSync(join(tmpdir(), 'dsh-install-'));
  try {
    const pack = runNpm(['pack', '--json', '--pack-destination', packDir], ROOT);
    assert.equal(pack.status, 0, pack.stderr);
    let parsed;
    try {
      parsed = JSON.parse(pack.stdout.trim());
    } catch {
      parsed = JSON.parse(pack.stdout.slice(pack.stdout.indexOf('[')));
    }
    const filename = parsed[0].filename;
    const tarball = join(packDir, filename);
    assert.ok(existsSync(tarball), `tarball missing: ${tarball}`);

    writeFileSync(join(installDir, 'package.json'), JSON.stringify({
      name: 'dsh-agent-prompts-tarball-check',
      private: true,
      type: 'module',
    }), 'utf8');
    const install = runNpm(['install', tarball, '--no-audit', '--no-fund', '--ignore-scripts'], installDir);
    assert.equal(install.status, 0, install.stderr);

    const installed = join(installDir, 'node_modules', 'dsh-agent-prompts');
    const pkg = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
    assert.equal(pkg.version, '0.4.0');
    assert.equal(pkg.bin['dsh-agent-prompts-scan'], './resources/scan-redlines.mjs');
    for (const file of [
      'lib/index.js',
      'skills/alibaba-java-standards.md',
      'resources/scan-redlines.mjs',
      'resources/alibaba-java/01a-naming.md',
      'resources/alibaba-java/09-modern-java.md',
      'resources/reference/fullstack-single.original.md',
      'cordis.patch.yml',
      'README.md',
      'README.en.md',
      'CHANGELOG.md',
      'NOTICE.md',
      'docs/SCANNER.md',
    ]) {
      assert.ok(existsSync(join(installed, file)), `tarball missing ${file}`);
    }
    assert.match(readFileSync(join(installed, 'resources', 'scan-redlines.mjs'), 'utf8'), /^#!\/usr\/bin\/env node/);

    const moduleUrl = pathToFileURL(join(installed, 'lib', 'index.js')).href;
    const mod = await import(moduleUrl);
    assert.equal(mod.name, 'dsh-agent-prompts');
    assert.deepEqual(mod.inject, ['skills']);
    assert.equal(mod.SKILLS.length, 6);
    assert.deepEqual(mod.SKILLS.map((skill) => skill.name).sort(), [
      'alibaba-java-standards',
      'f2e-spec',
      'fullstack-microservice-debug',
      'fullstack-microservice-dev',
      'fullstack-monolith-debug',
      'fullstack-monolith-dev',
    ]);
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(installDir, { recursive: true, force: true });
  }
});
