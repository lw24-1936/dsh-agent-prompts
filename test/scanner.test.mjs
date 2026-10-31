import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
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
