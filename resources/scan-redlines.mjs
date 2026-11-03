#!/usr/bin/env node
/**
 * dsh-agent-prompts 启发式红线扫描器。
 *
 * 把 Alibaba Java / F2E 规范里最容易在生成阶段踩中的 P0 反例，
 * 变成提交前可以跑的一条命令。它只做正则级提示，不替代
 * P3C / PMD / ESLint / 人工 review。
 *
 * 常用：
 *   npx dsh-agent-prompts-scan --profile java --changed-only --root .
 *   npx dsh-agent-prompts-scan --profile java --write-baseline .dsh/redlines-baseline.json
 *   npx dsh-agent-prompts-scan --profile frontend --format sarif > redlines.sarif
 *
 * 退出码：0 = 未达到 --fail-on（默认 P0）；1 = 达到阈值；2 = 参数/IO/配置错误。
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const SCANNER_VERSION = '0.5.0';
const SCANNER_NAME = 'dsh-agent-prompts/scan-redlines';

const IGNORED_DIRS = new Set([
  '.git', '.svn', '.hg', '.idea', '.vscode', 'node_modules', 'target', 'build',
  'dist', 'out', 'bin', 'obj', 'coverage', '.next', '.nuxt', '.output', 'vendor',
  '.gradle', '.mvn', 'generated', '__generated__',
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_BUFFER = 64 * 1024 * 1024;
const SEVERITY_LEVEL = { P0: 'error', P1: 'warning', P2: 'note' };
const SEVERITY_RANK = { P0: 0, P1: 1, P2: 2 };

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const PROFILES = {
  java: {
    label: 'java',
    extensions: new Set(['.java', '.xml']),
    rules: [
      {
        id: 'JAVA_THREADPOOL_FACTORY',
        severity: 'P0',
        source: 'code',
        message: '禁止用 Executors 工厂创建线程池，改用 new ThreadPoolExecutor(...) 显式参数（01-(七)）',
        pattern: /Executors\s*\.\s*(?:newFixedThreadPool|newCachedThreadPool|newSingleThreadExecutor|newScheduledThreadPool)\s*\(/g,
      },
      {
        id: 'JAVA_RAW_THREAD',
        severity: 'P0',
        source: 'code',
        message: '禁止裸 new Thread()，改用线程池或 CompletableFuture（01-(七)）',
        pattern: /\bnew\s+Thread\s*\(/g,
      },
      {
        id: 'JAVA_SIMPLEDATEFORMAT',
        severity: 'P0',
        source: 'code',
        message: 'SimpleDateFormat 非线程安全，改用 java.time + DateTimeFormatter（01-(五)）',
        pattern: /\bSimpleDateFormat\b/g,
      },
      {
        id: 'JAVA_UTIL_DATE',
        severity: 'P0',
        source: 'code',
        message: '禁止 java.util.Date，改用 java.time（LocalDateTime / Instant）（01-(五)）',
        pattern: /\bnew\s+(?:java\.util\.)?Date\s*\(|\bjava\.util\.Date\b/g,
      },
      {
        id: 'JAVA_CALENDAR',
        severity: 'P0',
        source: 'code',
        message: '禁止 Calendar.getInstance()，改用 java.time（01-(五)）',
        pattern: /\bCalendar\s*\.\s*getInstance\s*\(/g,
      },
      {
        id: 'JAVA_EMPTY_CATCH',
        severity: 'P0',
        source: 'code',
        message: '空 catch 吞异常；至少记录日志或重新抛出（02-(二)）',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      },
      {
        id: 'JAVA_PRINT_STACKTRACE',
        severity: 'P1',
        source: 'code',
        message: '禁止 printStackTrace()，用日志框架记录（02-(三)）',
        pattern: /\.printStackTrace\s*\(/g,
      },
      {
        id: 'JAVA_SYSTEM_OUT',
        severity: 'P1',
        source: 'code',
        message: '禁止 System.out / System.err 输出，用日志框架（02-(三)）',
        pattern: /System\s*\.\s*(?:out|err)\s*\.\s*print/g,
      },
      {
        id: 'JAVA_SQL_DOLLAR',
        severity: 'P0',
        source: 'raw',
        message: 'SQL 禁止 ${} 拼接，改用 #{} 或参数绑定（04 / 05-(八)）',
        pattern: /\$\{/g,
        fileFilter: (rel) => /\.java$/i.test(rel),
        lineFilter: (line) => {
          if (/@Value\s*\(|@ConfigurationProperties|@PropertySource/.test(line)) return false;
          return /@(?:Select|Insert|Update|Delete)\s*\(|\b(?:select|insert|update|delete|from|where|values|set)\b/i.test(line);
        },
      },
      {
        id: 'JAVA_SQL_NO_WHERE',
        severity: 'P0',
        source: 'raw',
        message: 'update / delete 注解 SQL 缺少 where，禁止全表操作（05-(三)）',
        custom: scanJavaAnnotationSql,
      },
      {
        id: 'JAVA_COLLECTION_RETURN_NULL',
        severity: 'P0',
        source: 'code',
        message: '集合返回值禁止 return null，返回空集合（01-(六)）',
        custom: scanCollectionReturnNull,
      },
      {
        id: 'JAVA_THREADLOCAL_NO_REMOVE',
        severity: 'P0',
        source: 'code',
        message: '使用 ThreadLocal 但未见 remove()，必须在 finally 中清理（01-(七)）',
        custom: scanThreadLocal,
      },
      {
        id: 'JAVA_BIGDECIMAL_DOUBLE',
        severity: 'P1',
        source: 'code',
        message: 'BigDecimal 不要用 double 构造器，改用 String 构造器或 BigDecimal.valueOf（01-(六)）',
        pattern: /new\s+BigDecimal\s*\(\s*[+-]?(?:\d+\.\d+|\d+[dDfF])\s*\)/g,
      },
      {
        id: 'XML_SQL_DOLLAR',
        severity: 'P0',
        source: 'raw',
        message: 'MyBatis SQL 禁止 ${} 拼接，改用 #{}（05-(八)）',
        custom: scanMapperXml,
        fileFilter: (rel) => /\.xml$/i.test(rel),
      },
      {
        id: 'XML_SQL_NO_WHERE',
        severity: 'P0',
        source: 'raw',
        message: 'Mapper 中 update / delete 必须带 where（05-(三)）',
        custom: scanMapperXml,
        fileFilter: (rel) => /\.xml$/i.test(rel),
      },
    ],
  },
  frontend: {
    label: 'frontend',
    extensions: new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue']),
    rules: [
      {
        id: 'F2E_EVAL',
        severity: 'P0',
        source: 'code',
        message: '禁止 eval / new Function，动态执行需求先确认（安全）',
        pattern: /\beval\s*\(|\bnew\s+Function\s*\(/g,
      },
      {
        id: 'F2E_DANGEROUS_HTML',
        severity: 'P0',
        source: 'raw',
        message: 'dangerouslySetInnerHTML 必须确认内容已消毒（安全 / XSS）',
        custom: scanDangerousHtml,
      },
      {
        id: 'F2E_V_HTML',
        severity: 'P0',
        source: 'raw',
        message: 'v-html 必须确认内容已消毒，禁止渲染未信任输入（安全 / XSS）',
        custom: scanVHtml,
      },
      {
        id: 'F2E_TARGET_BLANK',
        severity: 'P0',
        source: 'raw',
        message: 'target="_blank" 必须配 rel="noopener noreferrer"（安全）',
        custom: scanTargetBlank,
      },
      {
        id: 'F2E_DEBUGGER',
        severity: 'P1',
        source: 'code',
        message: '生产代码禁止 debugger',
        pattern: /\bdebugger\b/g,
      },
      {
        id: 'F2E_VAR',
        severity: 'P1',
        source: 'code',
        message: '禁止 var，使用 const / let',
        pattern: /\bvar\s+/g,
      },
      {
        id: 'F2E_EQEQ',
        severity: 'P1',
        source: 'code',
        message: '禁止 == / !=，使用 === / !==',
        pattern: /(^|[^=!<>])(?:==|!=)(?!=)/gm,
      },
      {
        id: 'F2E_ANY',
        severity: 'P1',
        source: 'code',
        message: '避免 any；未知类型用 unknown 并收窄',
        pattern: /:\s*any\b|\bas\s+any\b/g,
      },
      {
        id: 'F2E_INDEX_KEY',
        severity: 'P1',
        source: 'raw',
        message: '列表 key 不要用数组索引，使用稳定唯一 ID',
        pattern: /:key\s*=\s*["'](?:index|i|idx)["']|key\s*=\s*\{\s*(?:index|i|idx)\s*\}/g,
      },
      {
        id: 'F2E_V_FOR_NO_KEY',
        severity: 'P1',
        source: 'raw',
        message: 'v-for 必须带 :key',
        custom: scanVueFor,
      },
      {
        id: 'F2E_V_IF_FOR',
        severity: 'P1',
        source: 'raw',
        message: '禁止 v-if 与 v-for 同元素，用 template v-for 或 computed 过滤',
        custom: scanVueFor,
      },
      {
        id: 'F2E_INNER_HTML',
        severity: 'P1',
        source: 'code',
        message: '直接写 innerHTML 有 XSS 风险；优先 textContent 或先消毒',
        pattern: /\.innerHTML\s*=/g,
      },
      {
        id: 'F2E_TS_IGNORE',
        severity: 'P2',
        source: 'code',
        message: '避免 @ts-ignore；必须时写原因，优先 @ts-expect-error',
        pattern: /@ts-ignore/g,
      },
      {
        id: 'F2E_CONSOLE',
        severity: 'P2',
        source: 'code',
        message: '生产代码移除 console.log / debug / info',
        pattern: /\bconsole\s*\.\s*(?:log|debug|info)\s*\(/g,
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

/**
 * 一次扫描同时产出两份文本：
 *   - raw：去掉注释，保留字符串（SQL / HTML 规则需要）
 *   - code：去掉注释，并把字符串内容遮成空格（语法规则避免误报）
 * 两者与原文长度、换行一一对应，行号可直接复用。
 */
function sanitize(source, kind) {
  if (kind === 'xml') {
    const cleaned = source.replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ' '));
    return { raw: cleaned, code: cleaned };
  }
  const raw = [];
  const code = [];
  let state = 'code';
  const push = (rawText, codeText) => {
    raw.push(rawText);
    code.push(codeText);
  };
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (ch === '/' && next === '/') {
        push('  ', '  ');
        state = 'line';
        i += 1;
      } else if (ch === '/' && next === '*') {
        push('  ', '  ');
        state = 'block';
        i += 1;
      } else if (kind === 'java' && source.startsWith('"""', i)) {
        push('"""', '   ');
        state = 'textblock';
        i += 2;
      } else if (ch === "'") {
        push("'", ' ');
        state = 'single';
      } else if (ch === '"') {
        push('"', ' ');
        state = 'double';
      } else if (ch === '`' && kind !== 'java') {
        push('`', ' ');
        state = 'template';
      } else {
        push(ch, ch);
      }
    } else if (state === 'line') {
      if (ch === '\n') {
        push('\n', '\n');
        state = 'code';
      } else {
        push(' ', ' ');
      }
    } else if (state === 'block') {
      if (ch === '*' && next === '/') {
        push('  ', '  ');
        state = 'code';
        i += 1;
      } else {
        push(ch === '\n' ? '\n' : ' ', ch === '\n' ? '\n' : ' ');
      }
    } else {
      // 字符串/字符/模板/文本块：raw 保留，code 遮罩
      const isNewline = ch === '\n';
      if (state === 'textblock' && source.startsWith('"""', i)) {
        push('"""', '   ');
        state = 'code';
        i += 2;
        continue;
      }
      push(ch, isNewline ? '\n' : ' ');
      if (ch === '\\') {
        const escaped = source[i + 1] ?? '';
        push(escaped, escaped === '\n' ? '\n' : ' ');
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
  return { raw: raw.join(''), code: code.join('') };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

function lineText(source, index) {
  const start = source.lastIndexOf('\n', index) + 1;
  let end = source.indexOf('\n', index);
  if (end === -1) end = source.length;
  return source.slice(start, end);
}

function snippetAt(source, index, length = 160) {
  const text = lineText(source, index).trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function normalizeSnippet(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function fingerprintOf(rule, rel, snippet) {
  return createHash('sha256')
    .update(`${rule}\0${rel.replace(/\\/g, '/')}\0${normalizeSnippet(snippet)}`)
    .digest('hex');
}

function toPosix(path) {
  return path.replace(/\\/g, '/');
}

function isIgnoredPath(rel) {
  const parts = toPosix(rel).split('/');
  return parts.some((part) => IGNORED_DIRS.has(part));
}

function isRelevant(rel, extensions) {
  if (isIgnoredPath(rel)) return false;
  if (/\.(?:min|map)\.(?:js|css)$/i.test(rel)) return false;
  if (/\.d\.ts$/i.test(rel)) return false;
  return extensions.has(extname(rel).toLowerCase());
}

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function globToRegExp(pattern) {
  const parts = toPosix(pattern).replace(/\/+$/, '').split('/');
  let source = '^';
  parts.forEach((part, index) => {
    const last = index === parts.length - 1;
    if (part === '**') source += last ? '.*' : '(?:.*/)?';
    else {
      source += part
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      if (!last) source += '/';
    }
  });
  return new RegExp(`${source}$`);
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function isGitRepo(root) {
  try {
    return git(root, ['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
}

function listGitFiles(root) {
  return git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter(Boolean);
}

function listChangedFiles(root, base) {
  const files = new Set();
  const collect = (args) => {
    try {
      for (const file of git(root, args).split(/\r?\n/)) {
        if (file.trim()) files.add(file.trim());
      }
    } catch {
      // base 不存在/新仓库：其它通道会补上
    }
  };
  collect(['diff', '--name-only', '--diff-filter=ACMRTUXB', base]);
  collect(['diff', '--name-only', '--diff-filter=ACMRTUXB', '--cached', base]);
  collect(['ls-files', '--others', '--exclude-standard']);
  return [...files];
}

function walk(root, extensions, onFile, stats) {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
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
    if (!isRelevant(full, extensions)) continue;
    onFile(full);
  }
}

/* ------------------------------------------------------------------ */
/* Custom rules                                                        */
/* ------------------------------------------------------------------ */

function scanJavaAnnotationSql({ raw, add }) {
  const regex = /@(Update|Delete)\s*\(([\s\S]{0,1200}?)\)\s*(?:public|protected|private|default|;|\n)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const body = match[2];
    if (!/\b(?:update|delete)\b/i.test(body)) continue;
    if (/\bwhere\b|<where\b/i.test(body)) continue;
    add('JAVA_SQL_NO_WHERE', 'P0', 'update / delete 注解 SQL 缺少 where，禁止全表操作（05-(三)）', match.index);
  }
}

function scanCollectionReturnNull({ code, add, file, rel }) {
  if (!/\.java$/i.test(rel)) return;
  const returnNull = /return\s+null\s*;/g;
  let match;
  while ((match = returnNull.exec(code)) !== null) {
    const before = code.slice(Math.max(0, match.index - 4000), match.index);
    const signature = /(?:public|protected|private|static|final|synchronized|abstract|default|\s)+([A-Za-z_$][\w$.]*(?:\s*<[^;{}]*>)?(?:\s*\[\s*\])*)\s+([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*(?:throws[^{]+)?\{/g;
    let last = null;
    let sig;
    while ((sig = signature.exec(before)) !== null) last = sig;
    if (!last) continue;
    const type = last[1].replace(/\s+/g, ' ');
    if (!/\b(?:List|Set|Map|Collection|Iterable|ArrayList|LinkedList|HashMap|HashSet|TreeMap|TreeSet|Queue|Deque)\b/.test(type)) continue;
    add('JAVA_COLLECTION_RETURN_NULL', 'P0', `疑似集合返回值 ${type.trim()} 返回 null，返回空集合（01-(六)）`, match.index);
  }
}

function scanThreadLocal({ code, add, file, rel }) {
  if (!/\.java$/i.test(rel)) return;
  if (!/\bThreadLocal\b|\bInheritableThreadLocal\b/.test(code)) return;
  if (/\.remove\s*\(\s*\)/.test(code)) return;
  const index = code.search(/\b(?:Inheritable)?ThreadLocal\b/);
  add('JAVA_THREADLOCAL_NO_REMOVE', 'P0', '使用了 ThreadLocal 但文件中没有 remove()，必须在 finally 中清理（01-(七)）', index);
}

function scanMapperXml({ raw, add, file, rel }) {
  if (!/\.xml$/i.test(rel)) return;
  if (!/<mapper\b/i.test(raw)) return;
  const block = /<(select|insert|update|delete|sql)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
  let match;
  while ((match = block.exec(raw)) !== null) {
    const tag = match[1].toLowerCase();
    const body = match[3];
    const bodyStart = match.index + match[0].indexOf('>') + 1;
    const dollar = body.indexOf('${');
    if (dollar !== -1) {
      add('XML_SQL_DOLLAR', 'P0', 'MyBatis SQL 禁止 ${} 拼接，改用 #{}（05-(八)）', bodyStart + dollar);
    }
    if ((tag === 'update' || tag === 'delete') && !/\bwhere\b|<where\b/i.test(body)) {
      add('XML_SQL_NO_WHERE', 'P0', `<${tag}> 缺少 where，禁止全表操作（05-(三)）`, match.index);
    }
  }
}

function scanDangerousHtml({ raw, add }) {
  const regex = /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html\s*:\s*([\s\S]{0,240}?)\}\s*\}/g;
  let match;
  let found = false;
  while ((match = regex.exec(raw)) !== null) {
    found = true;
    const expr = match[1];
    if (/DOMPurify|sanitize|sanitizeHtml|purify/i.test(expr)) {
      add('F2E_DANGEROUS_HTML', 'P2', 'dangerouslySetInnerHTML 检测到消毒调用，请确认消毒范围与来源', match.index);
    } else {
      add('F2E_DANGEROUS_HTML', 'P0', 'dangerouslySetInnerHTML 必须确认内容已消毒（安全 / XSS）', match.index);
    }
  }
  if (found) return;
  const plain = /dangerouslySetInnerHTML/g;
  while ((match = plain.exec(raw)) !== null) {
    add('F2E_DANGEROUS_HTML', 'P0', 'dangerouslySetInnerHTML 必须确认内容已消毒（安全 / XSS）', match.index);
  }
}

function scanVHtml({ raw, add }) {
  const regex = /\bv-html\s*=\s*["']([^"']*)["']/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const expr = match[1] ?? '';
    if (/DOMPurify|sanitize|sanitizeHtml|purify/i.test(expr)) {
      add('F2E_V_HTML', 'P2', 'v-html 检测到消毒调用，请确认消毒范围与来源', match.index);
    } else {
      add('F2E_V_HTML', 'P0', 'v-html 必须确认内容已消毒，禁止渲染未信任输入（安全 / XSS）', match.index);
    }
  }
}

function scanTargetBlank({ raw, add }) {
  const regex = /target\s*=\s*["']_blank["']/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const tagStart = raw.lastIndexOf('<', match.index);
    const tagEnd = raw.indexOf('>', match.index);
    const window = raw.slice(tagStart === -1 ? Math.max(0, match.index - 200) : tagStart, tagEnd === -1 ? raw.length : tagEnd + 1);
    if (/rel\s*=\s*["'][^"']*noopener/i.test(window)) continue;
    add('F2E_TARGET_BLANK', 'P0', 'target="_blank" 缺少 rel="noopener noreferrer"', match.index);
  }
}

function scanVueFor({ raw, add, rel }) {
  if (!/\.vue$/i.test(rel)) return;
  const tagRegex = /<[A-Za-z][^<>]*\bv-for\s*=\s*["'][^"']*["'][^<>]*>/g;
  let match;
  while ((match = tagRegex.exec(raw)) !== null) {
    const tag = match[0];
    if (!/:key\s*=|v-bind:key\s*=/.test(tag)) {
      add('F2E_V_FOR_NO_KEY', 'P1', 'v-for 必须带 :key', match.index);
    }
    if (/\bv-if\s*=/.test(tag)) {
      add('F2E_V_IF_FOR', 'P1', '禁止 v-if 与 v-for 同元素', match.index);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Config / baseline                                                   */
/* ------------------------------------------------------------------ */

function loadConfig(root, explicitPath) {
  const path = explicitPath ? resolve(explicitPath) : join(root, '.dsh', 'redlines.json');
  if (!existsSync(path)) return { path: null, config: {} };
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`配置文件不是合法 JSON：${path}（${error.message}）`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`配置文件必须是对象：${path}`);
  }
  return { path, config: data };
}

function applyProfileConfig(data, profile) {
  const out = { ignoreRules: new Set(), ignorePaths: [], severity: {}, failOn: undefined };
  const merge = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.ignoreRules)) {
      for (const rule of value.ignoreRules) if (typeof rule === 'string') out.ignoreRules.add(rule);
    }
    if (Array.isArray(value.ignorePaths)) {
      for (const pattern of value.ignorePaths) {
        if (typeof pattern !== 'string') throw new Error('ignorePaths 必须是字符串数组');
        out.ignorePaths.push(globToRegExp(pattern));
      }
    }
    if (value.severity && typeof value.severity === 'object') {
      for (const [rule, severity] of Object.entries(value.severity)) {
        if (!['P0', 'P1', 'P2'].includes(severity)) throw new Error(`severity.${rule} 必须是 P0/P1/P2`);
        out.severity[rule] = severity;
      }
    }
    if (typeof value.failOn === 'string') out.failOn = value.failOn;
  };
  merge(data);
  merge(data.profiles?.[profile]);
  merge(data[profile]);
  return out;
}

function readBaseline(path) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`baseline 不是合法 JSON：${path}（${error.message}）`);
  }
  const list = Array.isArray(data) ? data : data.findings;
  if (!Array.isArray(list)) throw new Error(`baseline 缺少 findings 数组：${path}`);
  const keys = new Set();
  for (const item of list) {
    if (item && typeof item.fingerprint === 'string') keys.add(item.fingerprint);
    else if (item && item.rule && item.file && item.line) keys.add(`${item.rule}|${item.file}|${item.line}`);
  }
  return { data, keys };
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

function escapeGithub(value) {
  return String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeGithubProperty(value) {
  return escapeGithub(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function printText(state) {
  const { profile, root, findings, summary, stats, baselined, baselinePath, configPath, changedOnly, truncated, max } = state;
  console.log(`dsh-agent-prompts 红线扫描 · profile=${profile} · mode=${changedOnly ? 'changed' : 'all'}`);
  console.log(`root: ${root}`);
  if (configPath) console.log(`config: ${configPath}`);
  console.log(`files: scanned=${stats.scanned} skipped=${stats.skipped}${truncated ? ` (结果截断到 ${max} 条)` : ''}`);
  if (stats.skippedLarge.length) console.log(`oversize: ${stats.skippedLarge.join(', ')}`);
  if (baselinePath) console.log(`baseline: ${baselined} 条已匹配（${baselinePath}）`);
  for (const severity of ['P0', 'P1', 'P2']) {
    const rows = findings.filter((item) => item.severity === severity);
    if (rows.length === 0) continue;
    console.log(`\n${severity} (${rows.length})`);
    for (const row of rows) {
      console.log(`  ${row.file}:${row.line}  [${row.rule}] ${row.message}`);
      if (row.snippet) console.log(`    ${row.snippet}`);
    }
  }
  console.log(`\nsummary: P0=${summary.P0} P1=${summary.P1} P2=${summary.P2} baselined=${baselined}`);
  const failed = state.failOn !== 'none' && summary[state.failOn] > 0;
  if (failed) console.log(`结果：发现 ${state.failOn} 问题，修复后再提交。`);
  else console.log('结果：未发现达到阈值的问题（启发式扫描，不替代 P3C / PMD / ESLint / 人工 review）。');
}

function printSarif(state) {
  const ruleMap = new Map();
  for (const finding of state.findings) {
    if (!ruleMap.has(finding.rule)) {
      ruleMap.set(finding.rule, {
        id: finding.rule,
        shortDescription: { text: finding.message },
        defaultConfiguration: { level: SEVERITY_LEVEL[finding.severity] },
      });
    }
  }
  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'dsh-agent-prompts-scan',
          semanticVersion: SCANNER_VERSION,
          informationUri: 'https://github.com/lw24-1936/dsh-agent-prompts',
          rules: [...ruleMap.values()],
        },
      },
      results: state.findings.map((finding) => ({
        ruleId: finding.rule,
        level: SEVERITY_LEVEL[finding.severity],
        message: { text: finding.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: toPosix(finding.file) },
            region: { startLine: finding.line },
          },
        }],
        partialFingerprints: { redlineFingerprint: finding.fingerprint },
      })),
    }],
  };
  console.log(JSON.stringify(sarif, null, 2));
}

function printGithub(state) {
  for (const finding of state.findings) {
    const level = finding.severity === 'P0' ? 'error' : finding.severity === 'P1' ? 'warning' : 'notice';
    const title = escapeGithubProperty(finding.rule);
    const file = escapeGithubProperty(finding.file);
    const message = escapeGithub(`${finding.message}${finding.snippet ? ` — ${finding.snippet}` : ''}`);
    console.log(`::${level} file=${file},line=${finding.line},title=${title}::${message}`);
  }
  console.log(`::notice::${escapeGithub(`profile=${state.profile} P0=${state.summary.P0} P1=${state.summary.P1} P2=${state.summary.P2} baselined=${state.baselined}`)}`);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = {
    profile: '',
    root: process.cwd(),
    format: 'text',
    json: false,
    max: 200,
    changedOnly: false,
    base: 'HEAD',
    baseline: '',
    writeBaseline: '',
    failOn: 'P0',
    failOnExplicit: false,
    ignore: [],
    config: '',
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`${token} 缺少参数`);
      i += 1;
      return value;
    };
    if (token === '--profile') args.profile = next();
    else if (token === '--root') args.root = next();
    else if (token === '--format') args.format = next();
    else if (token === '--json') args.json = true;
    else if (token === '--max') args.max = Number(next());
    else if (token === '--changed-only') args.changedOnly = true;
    else if (token === '--base') args.base = next();
    else if (token === '--baseline') args.baseline = next();
    else if (token === '--write-baseline') args.writeBaseline = next();
    else if (token === '--fail-on') {
      args.failOn = next();
      args.failOnExplicit = true;
    }
    else if (token === '--ignore') args.ignore.push(...next().split(',').map((item) => item.trim()).filter(Boolean));
    else if (token === '--config') args.config = next();
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
    '  dsh-agent-prompts-scan --profile java|frontend [选项]',
    '',
    '选项：',
    '  --root <dir>             扫描根目录，默认当前目录',
    '  --changed-only           只扫 git 改动（工作区 + 暂存 + 未跟踪）',
    '  --base <ref>             --changed-only 的基准，默认 HEAD',
    '  --baseline <file>        过滤已记录的存量问题，只对新问题失败',
    '  --write-baseline <file>  把当前问题写入 baseline 并退出 0',
    '  --fail-on P0|P1|P2|none  退出码阈值，默认 P0',
    '  --ignore r1,r2           忽略规则',
    '  --config <file>          配置文件，默认 <root>/.dsh/redlines.json',
    '  --format text|json|sarif|github',
    '  --json                   等价于 --format json',
    '  --max <n>                最多输出多少条，默认 200',
    '',
    '退出码：0 未达阈值；1 达到阈值；2 参数/IO/配置错误。',
  ].join('\n');
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
  if (args.format === 'json' || args.json) args.format = 'json';
  if (!['text', 'json', 'sarif', 'github'].includes(args.format)) {
    console.error('--format 必须是 text / json / sarif / github');
    process.exit(2);
  }
  if (!['P0', 'P1', 'P2', 'none'].includes(args.failOn)) {
    console.error('--fail-on 必须是 P0 / P1 / P2 / none');
    process.exit(2);
  }
  if (!Number.isFinite(args.max) || args.max < 1) {
    console.error('--max 必须是正整数');
    process.exit(2);
  }
  if (args.baseline && args.writeBaseline) {
    console.error('--baseline 与 --write-baseline 不能同时使用');
    process.exit(2);
  }

  const root = resolve(args.root);
  try {
    if (!statSync(root).isDirectory()) throw new Error('不是目录');
  } catch (error) {
    console.error(`--root 不可用：${root}（${error.message}）`);
    process.exit(2);
  }

  let configState;
  try {
    if (args.config && !existsSync(resolve(args.config))) {
      throw new Error(`配置不存在：${resolve(args.config)}`);
    }
    configState = loadConfig(root, args.config);
  } catch (error) {
    console.error(`配置错误：${error.message}`);
    process.exit(2);
  }
  let config;
  try {
    config = applyProfileConfig(configState.config, args.profile);
  } catch (error) {
    console.error(`配置错误：${error.message}`);
    process.exit(2);
  }
  const ignoreRules = new Set([...config.ignoreRules, ...args.ignore]);
  const failOn = args.failOnExplicit ? args.failOn : (config.failOn ?? args.failOn);
  if (!['P0', 'P1', 'P2', 'none'].includes(failOn)) {
    console.error('配置 failOn 必须是 P0 / P1 / P2 / none');
    process.exit(2);
  }

  let baseline;
  if (args.baseline) {
    try {
      baseline = readBaseline(resolve(args.baseline));
    } catch (error) {
      console.error(error.message);
      process.exit(2);
    }
  }

  const profile = PROFILES[args.profile];
  const findings = [];
  const seen = new Set();
  const stats = { scanned: 0, skipped: 0, skippedDirs: 0, skippedLarge: [] };
  const max = args.max;

  const add = (file, rel, index, rule, severity, message, rawSource, starts) => {
    const line = lineAt(starts, index);
    const key = `${rule}:${rel}:${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    const snippet = snippetAt(rawSource, index);
    findings.push({
      rule,
      severity: config.severity[rule] ?? severity,
      file: toPosix(rel),
      line,
      message,
      snippet,
      fingerprint: fingerprintOf(rule, rel, snippet),
    });
  };

  const scanFile = (file) => {
    let raw;
    try {
      const size = statSync(file).size;
      if (size > MAX_FILE_BYTES) {
        stats.skipped += 1;
        stats.skippedLarge.push(relative(root, file));
        return;
      }
      raw = readFileSync(file, 'utf8');
      stats.scanned += 1;
    } catch {
      stats.skipped += 1;
      return;
    }
    const rel = relative(root, file);
    const kind = /\.xml$/i.test(file) ? 'xml' : 'code';
    const sanitized = sanitize(raw, kind);
    const starts = buildLineIndex(sanitized.raw);
    const context = {
      raw: sanitized.raw,
      code: sanitized.code,
      file,
      rel,
      starts,
      add: (rule, severity, message, index) => add(file, rel, index, rule, severity, message, raw, starts),
    };
    for (const rule of profile.rules) {
      if (rule.fileFilter && !rule.fileFilter(rel)) continue;
      if (rule.custom) {
        rule.custom(context);
        continue;
      }
      const source = rule.source === 'raw' ? sanitized.raw : sanitized.code;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      while ((match = regex.exec(source)) !== null) {
        if (rule.lineFilter && !rule.lineFilter(lineText(source, match.index))) {
          if (match.index === regex.lastIndex) regex.lastIndex += 1;
          continue;
        }
        context.add(rule.id, rule.severity, rule.message, match.index);
        if (match.index === regex.lastIndex) regex.lastIndex += 1;
      }
    }
  };

  let mode = 'all';
  if (args.changedOnly) {
    if (isGitRepo(root)) {
      mode = 'changed';
      for (const rel of listChangedFiles(root, args.base)) {
        if (!isRelevant(rel, profile.extensions)) continue;
        const file = join(root, rel);
        if (isFile(file)) scanFile(file);
      }
    } else {
      console.error('警告：--changed-only 需要 git 仓库，已回退为全量扫描');
    }
  }
  if (mode === 'all') {
    if (isGitRepo(root)) {
      for (const rel of listGitFiles(root)) {
        if (!isRelevant(rel, profile.extensions)) continue;
        const file = join(root, rel);
        if (isFile(file)) scanFile(file);
      }
    } else {
      walk(root, profile.extensions, scanFile, stats);
    }
  }

  // 配置过滤
  const filtered = [];
  for (const finding of findings) {
    if (ignoreRules.has(finding.rule)) continue;
    if (config.ignorePaths.some((regex) => regex.test(finding.file))) continue;
    filtered.push(finding);
  }

  let baselined = 0;
  let active = filtered;
  if (baseline) {
    active = [];
    for (const finding of filtered) {
      const legacyKey = `${finding.rule}|${finding.file}|${finding.line}`;
      if (baseline.keys.has(finding.fingerprint) || baseline.keys.has(legacyKey)) baselined += 1;
      else active.push(finding);
    }
  }

  const summary = { P0: 0, P1: 0, P2: 0 };
  for (const finding of active) summary[finding.severity] += 1;
  active.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  const truncated = active.length > max;
  const shown = truncated ? active.slice(0, max) : active;

  if (args.writeBaseline) {
    const outPath = resolve(args.writeBaseline);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify({
      scanner: SCANNER_NAME,
      version: SCANNER_VERSION,
      profile: args.profile,
      generatedAt: new Date().toISOString(),
      findings: active.map(({ rule, severity, file, line, snippet, fingerprint }) => ({ rule, severity, file, line, snippet, fingerprint })),
    }, null, 2), 'utf8');
    console.log(`baseline 已写入：${outPath}（${active.length} 条）`);
    process.exit(0);
  }

  const state = {
    profile: args.profile,
    root,
    findings: shown,
    summary,
    stats,
    baselined,
    baselinePath: args.baseline ? resolve(args.baseline) : null,
    configPath: configState.path,
    changedOnly: mode === 'changed',
    truncated,
    max,
    failOn,
  };

  if (args.format === 'json') {
    console.log(JSON.stringify({
      scanner: SCANNER_NAME,
      version: SCANNER_VERSION,
      profile: args.profile,
      root,
      mode,
      changedOnly: mode === 'changed',
      scanned: stats.scanned,
      skipped: stats.skipped,
      baselined,
      summary,
      truncated,
      findings: shown,
    }, null, 2));
  } else if (args.format === 'sarif') {
    printSarif(state);
  } else if (args.format === 'github') {
    printGithub(state);
  } else {
    printText(state);
  }

  const failed = failOn !== 'none' && summary[failOn] > 0;
  process.exit(failed ? 1 : 0);
}

main();
