#!/usr/bin/env node
/**
 * dsh-agent-prompts 启发式红线扫描器。
 *
 * 用途：把 Alibaba Java / F2E 规范里最容易在生成阶段踩中的 P0 反例，
 *      变成提交前可以跑的一条命令。它只做正则级提示，不替代 P3C / PMD /
 *      ESLint / 人工 review。
 *
 * 用法：
 *   node scan-redlines.mjs --profile java --root <项目目录>
 *   node scan-redlines.mjs --profile frontend --root <前端目录> --json
 *
 * 退出码：0 = 无 P0；1 = 发现 P0；2 = 参数或 IO 错误。
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const SCANNER_VERSION = '0.2.0';

const IGNORED_DIRS = new Set([
  '.git', '.svn', '.hg', '.idea', '.vscode', 'node_modules', 'target', 'build',
  'dist', 'out', 'bin', 'obj', 'coverage', '.next', '.nuxt', '.output', 'vendor',
  '.gradle', '.mvn', 'generated', '__generated__',
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const PROFILES = {
  java: {
    extensions: new Set(['.java', '.xml']),
    rules: [
      {
        id: 'JAVA_THREADPOOL_FACTORY',
        severity: 'P0',
        message: '禁止用 Executors 工厂创建线程池，改用 new ThreadPoolExecutor(...) 显式参数（01-(七)）',
        pattern: /Executors\s*\.\s*(?:newFixedThreadPool|newCachedThreadPool|newSingleThreadExecutor|newScheduledThreadPool)\s*\(/g,
      },
      {
        id: 'JAVA_RAW_THREAD',
        severity: 'P0',
        message: '禁止裸 new Thread()，改用线程池或 CompletableFuture（01-(七)）',
        pattern: /\bnew\s+Thread\s*\(/g,
      },
      {
        id: 'JAVA_SIMPLEDATEFORMAT',
        severity: 'P0',
        message: 'SimpleDateFormat 非线程安全，改用 java.time + DateTimeFormatter（01-(九)）',
        pattern: /\bSimpleDateFormat\b/g,
      },
      {
        id: 'JAVA_UTIL_DATE',
        severity: 'P0',
        message: '禁止 java.util.Date，改用 java.time（LocalDateTime / Instant）（01-(九)）',
        pattern: /\bnew\s+(?:java\.util\.)?Date\s*\(|\bjava\.util\.Date\b/g,
      },
      {
        id: 'JAVA_CALENDAR',
        severity: 'P0',
        message: '禁止 Calendar.getInstance()，改用 java.time（01-(九)）',
        pattern: /\bCalendar\s*\.\s*getInstance\s*\(/g,
      },
      {
        id: 'JAVA_EMPTY_CATCH',
        severity: 'P0',
        message: '空 catch 吞异常；至少记录日志或重新抛出（02-(二)）',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      },
      {
        id: 'JAVA_PRINT_STACKTRACE',
        severity: 'P1',
        message: '禁止 printStackTrace()，用日志框架记录（02-(三)）',
        pattern: /\.printStackTrace\s*\(/g,
      },
      {
        id: 'JAVA_SYSTEM_OUT',
        severity: 'P1',
        message: '禁止 System.out / System.err 输出，用日志框架（02-(三)）',
        pattern: /System\s*\.\s*(?:out|err)\s*\.\s*print/g,
      },
      {
        id: 'JAVA_SQL_DOLLAR',
        severity: 'P0',
        message: 'SQL 禁止 ${} 拼接，改用 #{} 或参数绑定（04 / 05-(八)）',
        pattern: /\$\{/g,
        fileFilter: (file) => /\.(java)$/i.test(file),
        lineFilter: (line) => {
          if (/@Value\s*\(|@ConfigurationProperties|@PropertySource/.test(line)) return false;
          return /@(?:Select|Insert|Update|Delete)\s*\(|\b(?:select|insert|update|delete|from|where|values|set)\b/i.test(line);
        },
      },
      {
        id: 'JAVA_SQL_NO_WHERE',
        severity: 'P0',
        message: 'update / delete 必须带 where，禁止全表操作（05-(三)）',
        custom: scanJavaAnnotationSql,
      },
      {
        id: 'JAVA_COLLECTION_RETURN_NULL',
        severity: 'P0',
        message: '集合返回值禁止 return null，返回空集合（01-(六)）',
        custom: scanCollectionReturnNull,
      },
      {
        id: 'JAVA_THREADLOCAL_NO_REMOVE',
        severity: 'P0',
        message: '使用 ThreadLocal 但未见 remove()，必须在 finally 中清理（01-(七)）',
        custom: scanThreadLocal,
      },
      {
        id: 'XML_SQL_DOLLAR',
        severity: 'P0',
        message: 'MyBatis SQL 禁止 ${} 拼接，改用 #{}（05-(八)）',
        custom: scanMapperXml,
      },
      {
        id: 'XML_SQL_NO_WHERE',
        severity: 'P0',
        message: 'Mapper 中 update / delete 必须带 where（05-(三)）',
        custom: scanMapperXml,
      },
    ],
  },
  frontend: {
    extensions: new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue']),
    rules: [
      {
        id: 'F2E_EVAL',
        severity: 'P0',
        message: '禁止 eval / new Function，动态执行需求先确认（安全）',
        pattern: /\beval\s*\(|\bnew\s+Function\s*\(/g,
      },
      {
        id: 'F2E_DANGEROUS_HTML',
        severity: 'P0',
        message: 'dangerouslySetInnerHTML 必须确认内容已消毒（安全 / XSS）',
        pattern: /dangerouslySetInnerHTML/g,
      },
      {
        id: 'F2E_V_HTML',
        severity: 'P0',
        message: 'v-html 必须确认内容已消毒，禁止渲染未信任输入（安全 / XSS）',
        pattern: /\bv-html\s*=/g,
      },
      {
        id: 'F2E_TARGET_BLANK',
        severity: 'P0',
        message: 'target="_blank" 必须配 rel="noopener noreferrer"（安全）',
        pattern: /target\s*=\s*["']_blank["']/g,
        custom: scanTargetBlank,
      },
      {
        id: 'F2E_DEBUGGER',
        severity: 'P1',
        message: '生产代码禁止 debugger',
        pattern: /\bdebugger\b/g,
      },
      {
        id: 'F2E_VAR',
        severity: 'P1',
        message: '禁止 var，使用 const / let',
        pattern: /\bvar\s+/g,
      },
      {
        id: 'F2E_EQEQ',
        severity: 'P1',
        message: '禁止 == / !=，使用 === / !==',
        pattern: /(^|[^=!<>])(?:==|!=)(?!=)/gm,
      },
      {
        id: 'F2E_ANY',
        severity: 'P1',
        message: '避免 any；未知类型用 unknown 并收窄',
        pattern: /:\s*any\b|\bas\s+any\b/g,
      },
      {
        id: 'F2E_INDEX_KEY',
        severity: 'P1',
        message: '列表 key 不要用数组索引，使用稳定唯一 ID',
        pattern: /:key\s*=\s*["'](?:index|i|idx)["']|key\s*=\s*\{\s*(?:index|i|idx)\s*\}/g,
      },
      {
        id: 'F2E_V_FOR_NO_KEY',
        severity: 'P1',
        message: 'v-for 必须带 :key',
        custom: scanVueFor,
      },
      {
        id: 'F2E_V_IF_FOR',
        severity: 'P1',
        message: '禁止 v-if 与 v-for 同元素，用 template v-for 或 computed 过滤',
        custom: scanVueFor,
      },
      {
        id: 'F2E_TS_IGNORE',
        severity: 'P2',
        message: '避免 @ts-ignore；必须时写原因，优先 @ts-expect-error',
        pattern: /@ts-ignore/g,
      },
      {
        id: 'F2E_CONSOLE',
        severity: 'P2',
        message: '生产代码移除 console.log / debug / info',
        pattern: /\bconsole\s*\.\s*(?:log|debug|info)\s*\(/g,
      },
    ],
  },
};

function parseArgs(argv) {
  const args = { profile: '', root: process.cwd(), json: false, max: 200 };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--profile') args.profile = argv[++i] ?? '';
    else if (token === '--root') args.root = argv[++i] ?? '';
    else if (token === '--json') args.json = true;
    else if (token === '--max') args.max = Number(argv[++i] ?? 200);
    else if (token === '--help' || token === '-h') args.help = true;
    else throw new Error(`未知参数：${token}`);
  }
  return args;
}

function usage() {
  return [
    'dsh-agent-prompts 红线扫描器',
    '',
    '用法：',
    '  node scan-redlines.mjs --profile java --root <目录> [--json] [--max 200]',
    '  node scan-redlines.mjs --profile frontend --root <目录> [--json] [--max 200]',
    '',
    '退出码：0 无 P0；1 发现 P0；2 参数/IO 错误。',
  ].join('\n');
}

function stripComments(source, kind) {
  if (kind === 'xml') {
    return source.replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ' '));
  }
  let out = '';
  let state = 'code';
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (ch === '/' && next === '/') {
        state = 'line';
        out += '  ';
        i += 1;
      } else if (ch === '/' && next === '*') {
        state = 'block';
        out += '  ';
        i += 1;
      } else if (ch === "'") {
        state = 'single';
        out += ch;
      } else if (ch === '"') {
        state = 'double';
        out += ch;
      } else if (ch === '`') {
        state = 'template';
        out += ch;
      } else {
        out += ch;
      }
    } else if (state === 'line') {
      if (ch === '\n') {
        state = 'code';
        out += '\n';
      } else {
        out += ' ';
      }
    } else if (state === 'block') {
      if (ch === '*' && next === '/') {
        state = 'code';
        out += '  ';
        i += 1;
      } else {
        out += ch === '\n' ? '\n' : ' ';
      }
    } else {
      out += ch;
      if (ch === '\\') {
        out += source[i + 1] ?? '';
        i += 1;
      } else if (
        (state === 'single' && ch === "'") ||
        (state === 'double' && ch === '"') ||
        (state === 'template' && ch === '`')
      ) {
        state = 'code';
      }
    }
  }
  return out;
}

function buildLineIndex(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineAt(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return Math.max(1, high + 1);
}

function snippetAt(source, index, length = 160) {
  const start = Math.max(0, source.lastIndexOf('\n', index) + 1);
  let end = source.indexOf('\n', index);
  if (end === -1) end = source.length;
  const line = source.slice(start, end).trim();
  return line.length > length ? `${line.slice(0, length)}…` : line;
}

function collectRegex(rule, source, file, starts, findings, add) {
  if (rule.fileFilter && !rule.fileFilter(file)) return;
  const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
  let match;
  while ((match = regex.exec(source)) !== null) {
    const line = lineAt(starts, match.index);
    if (rule.lineFilter) {
      const start = source.lastIndexOf('\n', match.index) + 1;
      let end = source.indexOf('\n', match.index);
      if (end === -1) end = source.length;
      if (!rule.lineFilter(source.slice(start, end))) continue;
    }
    add(rule.id, rule.severity, rule.message, file, line, snippetAt(source, match.index));
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
}

/* ---------- Java custom rules ---------- */

function scanJavaAnnotationSql(source, file, starts, add) {
  if (!/\.java$/i.test(file)) return;
  const regex = /@(Update|Delete)\s*\(([\s\S]{0,1200}?)\)\s*(?:public|protected|private|default|;|\n)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const body = match[2];
    if (!/\b(?:update|delete)\b/i.test(body)) continue;
    if (/\bwhere\b|<where\b|\bWHERE\b/.test(body)) continue;
    add(
      'JAVA_SQL_NO_WHERE',
      'P0',
      'update / delete 注解 SQL 缺少 where，禁止全表操作（05-(三)）',
      file,
      lineAt(starts, match.index),
      snippetAt(source, match.index),
    );
  }
}

function scanCollectionReturnNull(source, file, starts, add) {
  if (!/\.java$/i.test(file)) return;
  const returnNull = /return\s+null\s*;/g;
  let match;
  while ((match = returnNull.exec(source)) !== null) {
    const before = source.slice(Math.max(0, match.index - 4000), match.index);
    const signature = /(?:public|protected|private|static|final|synchronized|abstract|default|\s)+([A-Za-z_$][\w$.]*(?:\s*<[^;{}]*>)?(?:\s*\[\s*\])*)\s+([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*(?:throws[^{]+)?\{/g;
    let last = null;
    let sig;
    while ((sig = signature.exec(before)) !== null) last = sig;
    if (!last) continue;
    const type = last[1].replace(/\s+/g, ' ');
    if (!/\b(?:List|Set|Map|Collection|Iterable|ArrayList|LinkedList|HashMap|HashSet|TreeMap|TreeSet|Queue|Deque)\b/.test(type)) continue;
    add(
      'JAVA_COLLECTION_RETURN_NULL',
      'P0',
      `疑似集合返回值 ${type.trim()} 返回 null，返回空集合（01-(六)）`,
      file,
      lineAt(starts, match.index),
      snippetAt(source, match.index),
    );
  }
}

function scanThreadLocal(source, file, starts, add) {
  if (!/\.java$/i.test(file)) return;
  if (!/\bThreadLocal\b|\bInheritableThreadLocal\b/.test(source)) return;
  if (/\.remove\s*\(\s*\)/.test(source)) return;
  const idx = source.search(/\b(?:Inheritable)?ThreadLocal\b/);
  add(
    'JAVA_THREADLOCAL_NO_REMOVE',
    'P0',
    '使用了 ThreadLocal 但文件中没有 remove()，必须在 finally 中清理（01-(七)）',
    file,
    lineAt(starts, idx),
    snippetAt(source, idx),
  );
}

/* ---------- Mapper XML ---------- */

function scanMapperXml(source, file, starts, add) {
  if (!/\.xml$/i.test(file)) return;
  if (!/<mapper\b/i.test(source)) return;
  const block = /<(select|insert|update|delete|sql)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
  let match;
  while ((match = block.exec(source)) !== null) {
    const tag = match[1].toLowerCase();
    const body = match[3];
    const bodyStart = match.index + match[0].indexOf('>') + 1;
    const dollar = body.indexOf('${');
    if (dollar !== -1) {
      add(
        'XML_SQL_DOLLAR',
        'P0',
        'MyBatis SQL 禁止 ${} 拼接，改用 #{}（05-(八)）',
        file,
        lineAt(starts, bodyStart + dollar),
        snippetAt(source, bodyStart + dollar),
      );
    }
    if ((tag === 'update' || tag === 'delete') && !/\bwhere\b|<where\b/i.test(body)) {
      add(
        'XML_SQL_NO_WHERE',
        'P0',
        `<${tag}> 缺少 where，禁止全表操作（05-(三)）`,
        file,
        lineAt(starts, match.index),
        snippetAt(source, match.index),
      );
    }
  }
}

/* ---------- Vue custom rules ---------- */

function scanVueFor(source, file, starts, add) {
  if (!/\.vue$/i.test(file)) return;
  const tagRegex = /<[A-Za-z][^<>]*\bv-for\s*=\s*["'][^"']*["'][^<>]*>/g;
  let match;
  while ((match = tagRegex.exec(source)) !== null) {
    const tag = match[0];
    if (!/:key\s*=|v-bind:key\s*=/.test(tag)) {
      add('F2E_V_FOR_NO_KEY', 'P1', 'v-for 必须带 :key', file, lineAt(starts, match.index), tag.trim().slice(0, 160));
    }
    if (/\bv-if\s*=/.test(tag)) {
      add('F2E_V_IF_FOR', 'P1', '禁止 v-if 与 v-for 同元素', file, lineAt(starts, match.index), tag.trim().slice(0, 160));
    }
  }
}

function scanTargetBlank(source, file, starts, add) {
  const regex = /target\s*=\s*["']_blank["']/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const line = lineAt(starts, match.index);
    const windowStart = starts[Math.max(0, line - 1)] ?? 0;
    const windowEnd = starts[Math.min(starts.length - 1, line + 1)] ?? source.length;
    const window = source.slice(windowStart, windowEnd);
    if (/rel\s*=\s*["'][^"']*noopener/i.test(window)) continue;
    add('F2E_TARGET_BLANK', 'P0', 'target="_blank" 缺少 rel="noopener noreferrer"', file, line, snippetAt(source, match.index));
  }
}

/* ---------- walk ---------- */

function walk(rootDir, extensions, onFile, stats) {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(rootDir, entry.name);
    if (entry.isSymbolicLink()) {
      stats.skipped += 1;
      continue;
    }
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        stats.skippedDirs += 1;
        continue;
      }
      walk(full, extensions, onFile, stats);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!extensions.has(extname(entry.name).toLowerCase())) continue;
    if (/\.(?:min|map)\.(?:js|css)$/i.test(entry.name) || /\.d\.ts$/i.test(entry.name)) {
      stats.skipped += 1;
      continue;
    }
    try {
      const size = statSync(full).size;
      if (size > MAX_FILE_BYTES) {
        stats.skipped += 1;
        stats.skippedLarge.push(relative(process.cwd(), full));
        continue;
      }
      onFile(full);
      stats.scanned += 1;
    } catch {
      stats.skipped += 1;
    }
  }
}

function severityRank(value) {
  return value === 'P0' ? 0 : value === 'P1' ? 1 : 2;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`参数错误：${error.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.profile || !PROFILES[args.profile]) {
    console.error(`--profile 必须是 ${Object.keys(PROFILES).join(' / ')}`);
    console.error(usage());
    process.exit(2);
  }
  const root = resolve(args.root);
  try {
    if (!statSync(root).isDirectory()) throw new Error('不是目录');
  } catch (error) {
    console.error(`--root 不可用：${root}（${error.message}）`);
    process.exit(2);
  }

  const profile = PROFILES[args.profile];
  const findings = [];
  const seen = new Set();
  const stats = { scanned: 0, skipped: 0, skippedDirs: 0, skippedLarge: [] };
  const truncated = { value: false };

  const add = (rule, severity, message, file, line, snippet) => {
    const key = `${rule}:${file}:${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (findings.length >= args.max) {
      truncated.value = true;
      return;
    }
    findings.push({ rule, severity, file: relative(root, file) || file, line, message, snippet });
  };

  walk(root, profile.extensions, (file) => {
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      return;
    }
    const kind = /\.xml$/i.test(file) ? 'xml' : 'code';
    const source = stripComments(raw, kind);
    const starts = buildLineIndex(source);
    for (const rule of profile.rules) {
      if (rule.custom) rule.custom(source, file, starts, add);
      else if (rule.pattern) collectRegex(rule, source, file, starts, findings, add);
    }
  }, stats);

  findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  const summary = { P0: 0, P1: 0, P2: 0 };
  for (const finding of findings) summary[finding.severity] += 1;

  if (args.json) {
    console.log(JSON.stringify({
      scanner: 'dsh-agent-prompts/scan-redlines',
      version: SCANNER_VERSION,
      profile: args.profile,
      root,
      scanned: stats.scanned,
      skipped: stats.skipped,
      summary,
      truncated: truncated.value,
      findings,
    }, null, 2));
    process.exit(summary.P0 > 0 ? 1 : 0);
  }

  console.log(`dsh-agent-prompts 红线扫描 · profile=${args.profile}`);
  console.log(`root: ${root}`);
  console.log(`files: scanned=${stats.scanned} skipped=${stats.skipped}${truncated.value ? ` (结果已截断到 ${args.max} 条)` : ''}`);
  if (stats.skippedLarge.length) console.log(`oversize: ${stats.skippedLarge.join(', ')}`);
  for (const severity of ['P0', 'P1', 'P2']) {
    const rows = findings.filter((item) => item.severity === severity);
    if (rows.length === 0) continue;
    console.log(`\n${severity} (${rows.length})`);
    for (const row of rows) {
      console.log(`  ${row.file}:${row.line}  [${row.rule}] ${row.message}`);
      if (row.snippet) console.log(`    ${row.snippet}`);
    }
  }
  console.log(`\nsummary: P0=${summary.P0} P1=${summary.P1} P2=${summary.P2}`);
  console.log(summary.P0 > 0
    ? '结果：发现 P0 红线，按技能正文修复后再提交。'
    : '结果：未发现 P0 红线（启发式扫描，不替代 P3C / PMD / ESLint / 人工 review）。');
  process.exit(summary.P0 > 0 ? 1 : 0);
}

main();
