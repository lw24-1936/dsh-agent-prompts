#!/usr/bin/env node
/**
 * Conservative static design anti-pattern checker.
 *
 * Advisory by default; pass --fail-on P1 to make it a gate.
 * It does NOT judge visual quality and does NOT replace the browser check.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const VERSION = '0.7.0';
const EXTENSIONS = new Set(['.html', '.vue', '.jsx', '.tsx', '.css', '.scss', '.sass', '.less']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'out', 'vendor', '.output']);

function usage() {
  return `Usage: node check-design.mjs [--root <dir>] [--format text|json] [--fail-on P1|P2|none] [--max N]

Checks conservative design anti-patterns in HTML/Vue/JSX/CSS files.
Exit 0 unless --fail-on is reached. This is advisory; always do the browser check too.`;
}

function parseArgs(argv) {
  const args = { root: '.', format: 'text', failOn: 'none', max: 200 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { console.log(usage()); process.exit(0); }
    if (arg === '--version') { console.log(VERSION); process.exit(0); }
    if (arg === '--root') { args.root = argv[++i]; continue; }
    if (arg === '--format') { args.format = argv[++i]; continue; }
    if (arg === '--fail-on') { args.failOn = argv[++i]; continue; }
    if (arg === '--max') { args.max = Number(argv[++i]); continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['text', 'json'].includes(args.format)) throw new Error('--format must be text or json');
  if (!['none', 'P1', 'P2'].includes(args.failOn)) throw new Error('--fail-on must be none, P1, or P2');
  if (!Number.isInteger(args.max) || args.max < 1) throw new Error('--max must be a positive integer');
  args.root = resolve(args.root);
  return args;
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (stat.isFile() && EXTENSIONS.has(extname(name).toLowerCase()) && !name.includes('.min.')) {
      out.push(full);
    }
  }
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

const PURPLE = /#(?:6d28d9|7c3aed|8b5cf6|a855f7|9333ea|a78bfa|c084fc|d8b4fe|e9d5ff)\b|\b(?:purple|violet|lavender)\b/i;

const RULES = [
  {
    id: 'D001',
    severity: 'P1',
    message: '紫色/淡紫渐变是常见 AI 模板信号；没有 brief 依据时改用中性色+一个强调色。',
    check(text, add) {
      for (const match of text.matchAll(/(?:linear|radial|conic)-gradient\([^;{}]*\)/gi)) {
        if (PURPLE.test(match[0])) add(match.index, '紫色渐变');
      }
    },
  },
  {
    id: 'D002',
    severity: 'P1',
    message: 'transition: all 会误触发/拖慢；明确 transition-property。',
    check(text, add) {
      for (const match of text.matchAll(/transition(?:-property)?\s*:\s*all\b/gi)) add(match.index, 'transition: all');
    },
  },
  {
    id: 'D003',
    severity: 'P1',
    message: 'lorem ipsum 不能作为交付文案；换真实文案或明确占位。',
    check(text, add) {
      for (const match of text.matchAll(/lorem\s+ipsum/gi)) add(match.index, 'lorem ipsum');
    },
  },
  {
    id: 'D004',
    severity: 'P1',
    message: '<img> 缺少 alt；装饰图用 alt=""，内容图写替代文本。',
    check(text, add) {
      for (const match of text.matchAll(/<img\b[^>]*>/gi)) {
        if (!/\balt\s*=/i.test(match[0])) add(match.index, 'img 缺 alt');
      }
    },
  },
  {
    id: 'D005',
    severity: 'P2',
    message: 'div/span 绑定 click 但没有 role/tabindex；键盘不可达，改用 button 或补键盘处理。',
    check(text, add) {
      for (const match of text.matchAll(/<(?:div|span)\b[^>]*(?:@click|v-on:click|onclick)\b[^>]*>/gi)) {
        if (!/\brole\s*=|\btabindex\s*=/i.test(match[0])) add(match.index, 'clickable div/span');
      }
    },
  },
  {
    id: 'D006',
    severity: 'P2',
    message: 'outline: none 会移除键盘焦点；提供 :focus-visible 替代。',
    check(text, add) {
      for (const match of text.matchAll(/outline\s*:\s*(?:none|0)\b/gi)) add(match.index, 'outline: none');
    },
  },
  {
    id: 'D007',
    severity: 'P2',
    message: 'z-index: 9999 是层级失控信号；用 token/局部 stacking context。',
    check(text, add) {
      for (const match of text.matchAll(/z-index\s*:\s*9999\b/gi)) add(match.index, 'z-index: 9999');
    },
  },
];

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`check-design: ${err.message}`);
    console.error(usage());
    process.exit(2);
  }

  let files;
  try {
    files = [];
    walk(args.root, files);
  } catch (err) {
    console.error(`check-design: cannot read ${args.root}: ${err.message}`);
    process.exit(2);
  }

  const findings = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const rule of RULES) {
      rule.check(text, (index, detail) => {
        findings.push({
          file: relative(args.root, file).replace(/\\/g, '/'),
          line: lineAt(text, index),
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
          detail,
        });
      });
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const shown = findings.slice(0, args.max);
  const counts = {
    P1: findings.filter((finding) => finding.severity === 'P1').length,
    P2: findings.filter((finding) => finding.severity === 'P2').length,
  };

  if (args.format === 'json') {
    console.log(JSON.stringify({
      version: VERSION,
      root: args.root,
      scannedFiles: files.length,
      counts,
      truncated: findings.length > shown.length,
      findings: shown,
    }, null, 2));
  } else {
    console.log(`Design anti-pattern check (v${VERSION})`);
    console.log(`Root: ${args.root}`);
    console.log(`Scanned: ${files.length} files`);
    console.log(`Findings: P1=${counts.P1} P2=${counts.P2}${findings.length > shown.length ? ` (showing first ${shown.length})` : ''}`);
    if (shown.length === 0) {
      console.log('No findings. This does not prove the design is good — still run the browser check.');
    } else {
      for (const finding of shown) {
        console.log(`${finding.file}:${finding.line} [${finding.severity}] ${finding.rule} ${finding.detail}`);
        console.log(`  ${finding.message}`);
      }
    }
  }

  const fail = args.failOn === 'P1' ? counts.P1 > 0 : args.failOn === 'P2' ? counts.P1 + counts.P2 > 0 : false;
  process.exit(fail ? 1 : 0);
}

main();
