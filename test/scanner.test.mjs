import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCANNER = resolve(HERE, '..', 'resources', 'scan-redlines.mjs');

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-redlines-'));
  for (const [name, content] of Object.entries(files)) {
    const file = join(root, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
  }
  return root;
}

function run(profile, root, extra = []) {
  return spawnSync(
    process.execPath,
    [SCANNER, '--profile', profile, '--root', root, '--json', ...extra],
    { encoding: 'utf8' },
  );
}

function parse(result) {
  assert.equal(result.error, undefined);
  return JSON.parse(result.stdout);
}

test('java scanner fails on P0 red lines', () => {
  const root = fixture({
    'src/BadService.java': [
      'import java.text.SimpleDateFormat;',
      'import java.util.Date;',
      'import java.util.concurrent.Executors;',
      'public class BadService {',
      '  private final Object pool = Executors.newFixedThreadPool(8);',
      '  private static final ThreadLocal<String> CTX = new ThreadLocal<>();',
      '  public List<String> list() {',
      '    try { return db.query(); } catch (Exception e) {}',
      '    return null;',
      '  }',
      '  public String now() { return new SimpleDateFormat("yyyy").format(new Date()); }',
      '  @Update("update t_user set name = ${name}")',
      '  public int update(String name) { return 1; }',
      '}',
    ].join('\n'),
    'src/UserMapper.xml': [
      '<mapper namespace="demo.UserMapper">',
      '  <update id="touch">update t_user set name = #{name}</update>',
      '  <select id="page">select * from t_user where id = ${id}</select>',
      '</mapper>',
    ].join('\n'),
  });

  const result = run('java', root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const data = parse(result);
  assert.equal(data.profile, 'java');
  assert.ok(data.summary.P0 >= 7, JSON.stringify(data.summary));
  const ids = new Set(data.findings.map((finding) => finding.rule));
  for (const id of [
    'JAVA_THREADPOOL_FACTORY',
    'JAVA_SIMPLEDATEFORMAT',
    'JAVA_UTIL_DATE',
    'JAVA_EMPTY_CATCH',
    'JAVA_COLLECTION_RETURN_NULL',
    'JAVA_SQL_DOLLAR',
    'JAVA_SQL_NO_WHERE',
    'JAVA_THREADLOCAL_NO_REMOVE',
    'XML_SQL_DOLLAR',
    'XML_SQL_NO_WHERE',
  ]) {
    assert.ok(ids.has(id), `${id} not reported`);
  }
});

test('java scanner passes clean production-style code', () => {
  const root = fixture({
    'src/GoodService.java': [
      'import java.time.LocalDateTime;',
      'import java.time.format.DateTimeFormatter;',
      'import java.util.List;',
      'import java.util.concurrent.ArrayBlockingQueue;',
      'import java.util.concurrent.ThreadPoolExecutor;',
      'import java.util.concurrent.TimeUnit;',
      'public class GoodService {',
      '  private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");',
      '  private final ThreadPoolExecutor pool = new ThreadPoolExecutor(2, 4, 60L, TimeUnit.SECONDS,',
      '      new ArrayBlockingQueue<>(100), new NamedThreadFactory("good"), new ThreadPoolExecutor.AbortPolicy());',
      '  private static final ThreadLocal<String> CTX = new ThreadLocal<>();',
      '  public List<String> list() { return List.of(); }',
      '  public String now() { return LocalDateTime.now().format(FORMATTER); }',
      '  public void clear() { try { CTX.remove(); } finally { CTX.remove(); } }',
      '}',
    ].join('\n'),
    'src/UserMapper.xml': [
      '<mapper namespace="demo.UserMapper">',
      '  <update id="rename">update t_user set name = #{name} where id = #{id}</update>',
      '  <select id="page">select id from t_user where id = #{id}</select>',
      '</mapper>',
    ].join('\n'),
  });

  const result = run('java', root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const data = parse(result);
  assert.equal(data.summary.P0, 0);
  assert.equal(data.truncated, false);
});

test('frontend scanner reports P0 security issues', () => {
  const root = fixture({
    'src/Bad.vue': [
      '<template>',
      '  <a href="/x" target="_blank">x</a>',
      '  <div v-html="raw"></div>',
      '  <li v-for="item in items">{{ item }}</li>',
      '  <p v-for="row in rows" v-if="row.ok" :key="row.id">{{ row }}</p>',
      '</template>',
      '<script setup lang="ts">',
      'var a = 1;',
      "if (a == 1) { console.log('x'); }",
      "eval('1');",
      'debugger;',
      '</script>',
    ].join('\n'),
  });

  const result = run('frontend', root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const data = parse(result);
  const ids = new Set(data.findings.map((finding) => finding.rule));
  for (const id of ['F2E_TARGET_BLANK', 'F2E_V_HTML', 'F2E_EVAL', 'F2E_VAR', 'F2E_V_FOR_NO_KEY', 'F2E_V_IF_FOR']) {
    assert.ok(ids.has(id), `${id} not reported`);
  }
  assert.ok(data.summary.P0 >= 3);
});

test('frontend scanner passes clean Vue 3 code', () => {
  const root = fixture({
    'src/Good.vue': [
      '<template>',
      '  <ul>',
      '    <li v-for="item in items" :key="item.id">{{ item.name }}</li>',
      '  </ul>',
      '  <a href="/docs" target="_blank" rel="noopener noreferrer">docs</a>',
      '</template>',
      '<script setup lang="ts">',
      'const items = ref<{ id: string; name: string }[]>([]);',
      'const visible = computed(() => items.value.length > 0);',
      '</script>',
    ].join('\n'),
  });

  const result = run('frontend', root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const data = parse(result);
  assert.equal(data.summary.P0, 0);
});

test('rejects an unknown profile', () => {
  const root = fixture({ 'a.txt': 'x' });
  const result = spawnSync(process.execPath, [SCANNER, '--profile', 'nope', '--root', root], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--profile/);
});

test('emits SARIF 2.1.0 with locations and fingerprints', () => {
  const root = fixture({
    'src/Bad.java': 'public class Bad { Object p = java.util.concurrent.Executors.newFixedThreadPool(4); }',
  });
  const result = spawnSync(process.execPath, [SCANNER, '--profile', 'java', '--root', root, '--format', 'sarif'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const sarif = JSON.parse(result.stdout);
  assert.equal(sarif.version, '2.1.0');
  const runResult = sarif.runs[0];
  assert.equal(runResult.tool.driver.name, 'dsh-agent-prompts-scan');
  const finding = runResult.results[0];
  assert.equal(finding.ruleId, 'JAVA_THREADPOOL_FACTORY');
  assert.equal(finding.level, 'error');
  assert.equal(finding.locations[0].physicalLocation.region.startLine, 1);
  assert.match(finding.partialFingerprints.redlineFingerprint, /^[a-f0-9]{64}$/);
});

test('emits GitHub workflow annotations', () => {
  const root = fixture({
    'src/Bad.java': 'public class Bad { Object p = java.util.concurrent.Executors.newFixedThreadPool(4); }',
  });
  const result = spawnSync(process.execPath, [SCANNER, '--profile', 'java', '--root', root, '--format', 'github'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /::error file=src\/Bad\.java,line=1,title=JAVA_THREADPOOL_FACTORY::/);
  assert.match(result.stdout, /::notice::profile=java/);
});

test('baseline records existing issues and only fails on new ones', () => {
  const root = fixture({
    'src/Old.java': 'public class Old { Object p = java.util.concurrent.Executors.newFixedThreadPool(4); }',
  });
  const baselinePath = join(root, '.dsh', 'baseline.json');
  const write = spawnSync(process.execPath, [SCANNER, '--profile', 'java', '--root', root, '--write-baseline', baselinePath], { encoding: 'utf8' });
  assert.equal(write.status, 0, write.stderr);
  assert.ok(existsSync(baselinePath));
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  assert.equal(baseline.findings.length, 1);
  assert.match(baseline.findings[0].fingerprint, /^[a-f0-9]{64}$/);

  const clean = spawnSync(process.execPath, [SCANNER, '--profile', 'java', '--root', root, '--baseline', baselinePath, '--json'], { encoding: 'utf8' });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  const cleanData = JSON.parse(clean.stdout);
  assert.equal(cleanData.summary.P0, 0);
  assert.equal(cleanData.baselined, 1);

  writeFileSync(join(root, 'src', 'New.java'), 'public class New { Object p = java.util.concurrent.Executors.newFixedThreadPool(4); }', 'utf8');
  const dirty = spawnSync(process.execPath, [SCANNER, '--profile', 'java', '--root', root, '--baseline', baselinePath, '--json'], { encoding: 'utf8' });
  assert.equal(dirty.status, 1, dirty.stdout + dirty.stderr);
  const dirtyData = JSON.parse(dirty.stdout);
  assert.equal(dirtyData.summary.P0, 1);
  assert.equal(dirtyData.baselined, 1);
});

test('config ignores rules and overrides severity', () => {
  const root = fixture({
    'src/Bad.java': [
      'public class Bad {',
      '  Object p = java.util.concurrent.Executors.newFixedThreadPool(4);',
      '  void log() { System.out.println("x"); }',
      '}',
    ].join('\n'),
    '.dsh/redlines.json': JSON.stringify({
      ignoreRules: ['JAVA_THREADPOOL_FACTORY'],
      severity: { JAVA_SYSTEM_OUT: 'P0' },
    }),
  });
  const result = run('java', root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const data = parse(result);
  const ids = data.findings.map((finding) => finding.rule);
  assert.ok(!ids.includes('JAVA_THREADPOOL_FACTORY'));
  const systemOut = data.findings.find((finding) => finding.rule === 'JAVA_SYSTEM_OUT');
  assert.equal(systemOut.severity, 'P0');
});

test('changed-only scans only git changes', (t) => {
  const git = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (git.status !== 0) {
    t.skip('git not available');
    return;
  }
  const root = fixture({
    'src/Clean.java': 'public class Clean { String now() { return java.time.LocalDateTime.now().toString(); } }',
  });
  const gitRun = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(gitRun(['init', '-q']).status, 0);
  gitRun(['config', 'user.email', 'test@example.com']);
  gitRun(['config', 'user.name', 'test']);
  gitRun(['add', '-A']);
  assert.equal(gitRun(['commit', '-qm', 'init']).status, 0);
  writeFileSync(join(root, 'src', 'Bad.java'), 'public class Bad { Object p = java.util.concurrent.Executors.newFixedThreadPool(4); }', 'utf8');

  const result = run('java', root, ['--changed-only']);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const data = parse(result);
  assert.equal(data.mode, 'changed');
  assert.equal(data.scanned, 1);
  assert.equal(data.summary.P0, 1);
  assert.equal(data.findings[0].file, 'src/Bad.java');
});

test('does not flag red-line tokens inside comments or strings', () => {
  const root = fixture({
    'src/Clean.java': [
      'public class Clean {',
      '  // Executors.newFixedThreadPool(8) 只在注释里',
      '  /* SimpleDateFormat 也只在注释里 */',
      '  private static final String TEXT = "new SimpleDateFormat(\\"yyyy\\")";',
      '  private static final String ID = "eval(" + "x)";',
      '}',
    ].join('\n'),
    'pom.xml': '<project><version>${project.version}</version></project>',
  });
  const result = run('java', root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const data = parse(result);
  assert.equal(data.summary.P0, 0);
  assert.equal(data.findings.length, 0);
});

test('downgrades v-html when a sanitizer is used', () => {
  const root = fixture({
    'src/Demo.vue': [
      '<template>',
      '  <div v-html="DOMPurify.sanitize(raw)"></div>',
      '  <div v-html="raw"></div>',
      '</template>',
    ].join('\n'),
  });
  const result = run('frontend', root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const data = parse(result);
  const rows = data.findings.filter((finding) => finding.rule === 'F2E_V_HTML');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.severity).sort(), ['P0', 'P2']);
});

test('fail-on controls the exit code', () => {
  const root = fixture({
    'src/OnlyP1.ts': 'var x = 1;\n',
  });
  const defaultRun = run('frontend', root);
  assert.equal(defaultRun.status, 0, defaultRun.stdout + defaultRun.stderr);
  const strictRun = run('frontend', root, ['--fail-on', 'P1']);
  assert.equal(strictRun.status, 1, strictRun.stdout + strictRun.stderr);
  const data = parse(strictRun);
  assert.equal(data.summary.P1, 1);
});

