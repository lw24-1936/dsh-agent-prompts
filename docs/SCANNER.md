# 红线扫描器使用文档

零依赖、启发式、只读。它把 P0 红线里最容易在生成阶段踩中的反例变成提交前可执行的一条命令；正式门禁仍以 P3C / PMD / ESLint / 人工 review 为准。

## 1. 入口

作为 DSH 插件安装时，脚本在技能资源目录下：

```bash
node "<资源目录>/scan-redlines.mjs" --profile java --root .
```

如果项目把本包装进了 devDependencies（`npm i -D dsh-agent-prompts`），也可以用 bin：

```bash
npx dsh-agent-prompts-scan --profile java --root .
```

`profile` 只有两个：`java`（`.java` / `.xml`）与 `frontend`（`.js/.mjs/.cjs/.jsx/.ts/.tsx/.vue`）。

## 2. 退出码与阈值

| 退出码 | 含义 |
|---|---|
| 0 | 未达到 `--fail-on` 阈值 |
| 1 | 达到阈值 |
| 2 | 参数 / IO / 配置 / baseline 错误 |

`--fail-on P0`（默认）/ `P1` / `P2` / `none`。`P1` 会同时拦 P0+P1，`P2` 会拦全部。

## 3. 常用选项

| 选项 | 说明 |
|---|---|
| `--root <dir>` | 扫描根目录，默认当前目录 |
| `--changed-only` | 只扫 git 工作区 + 暂存 + 未跟踪文件 |
| `--base <ref>` | `--changed-only` 基准，默认 `HEAD` |
| `--baseline <file>` | 过滤 baseline 中已记录的问题，只对新问题失败 |
| `--write-baseline <file>` | 把当前问题写入 baseline，退出 0 |
| `--ignore r1,r2` | 临时忽略规则（可重复） |
| `--config <file>` | 配置文件，默认 `<root>/.dsh/redlines.json` |
| `--format text\|json\|sarif\|github` | 输出格式；`--json` 等价 `json` |
| `--max <n>` | 最多输出条数，默认 200 |

## 4. 基线工作流（老仓库）

```bash
# 1. 第一次：记录存量问题（退出 0）
npx dsh-agent-prompts-scan --profile java --root . --write-baseline .dsh/redlines-baseline.json

# 2. 之后：只对新增问题失败
npx dsh-agent-prompts-scan --profile java --root . --baseline .dsh/redlines-baseline.json

# 3. 修复一批存量后，重建基线
npx dsh-agent-prompts-scan --profile java --root . --write-baseline .dsh/redlines-baseline.json
```

baseline 用 `rule + 文件 + 规范化片段` 的 SHA-256 指纹匹配，不依赖行号；改行号不会让旧问题重新出现。baseline 文件建议提交到仓库，团队共享。

## 5. 配置文件

`<root>/.dsh/redlines.json`：

```json
{
  "ignoreRules": ["F2E_CONSOLE"],
  "ignorePaths": ["**/generated/**", "**/*.d.ts", "**/legacy/**"],
  "severity": {
    "JAVA_SYSTEM_OUT": "P2",
    "F2E_ANY": "P0"
  },
  "failOn": "P0"
}
```

- `ignoreRules`：规则 ID 数组。
- `ignorePaths`：简单 glob（`*` / `**` / `?`），相对 `--root`。
- `severity`：覆盖单条规则的级别（`P0` / `P1` / `P2`）。
- `failOn`：配置级阈值；命令行显式 `--fail-on` 优先。
- 也支持按 profile 覆盖：`{ "java": { ... }, "frontend": { ... } }`，或 `{ "profiles": { "java": { ... } } }`。

配置文件支持 UTF-8 BOM（Windows 编辑器常见）。

## 6. CI 接入

### SARIF（GitHub Code Scanning）

```bash
npx dsh-agent-prompts-scan --profile java --root . --format sarif > redlines.sarif
```

```yaml
- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: redlines.sarif
```

### GitHub 注解

```bash
npx dsh-agent-prompts-scan --profile java --root . --format github
```

输出 `::error file=...,line=...,title=RULE::message`，GitHub Actions 会直接标在 diff 上。

### PR 只扫改动

```bash
npx dsh-agent-prompts-scan --profile java --root . --changed-only --base origin/main
```

## 7. 规则清单

### Java

| 规则 | 级别 | 说明 |
|---|---|---|
| `JAVA_THREADPOOL_FACTORY` | P0 | `Executors.newFixedThreadPool` 等工厂 |
| `JAVA_RAW_THREAD` | P0 | 裸 `new Thread()` |
| `JAVA_SIMPLEDATEFORMAT` | P0 | `SimpleDateFormat` |
| `JAVA_UTIL_DATE` | P0 | `java.util.Date` |
| `JAVA_CALENDAR` | P0 | `Calendar.getInstance()` |
| `JAVA_EMPTY_CATCH` | P0 | 空 `catch` |
| `JAVA_SQL_DOLLAR` | P0 | Java 字符串/注解里的 `${}` |
| `JAVA_SQL_NO_WHERE` | P0 | `@Update` / `@Delete` 缺 where |
| `XML_SQL_DOLLAR` | P0 | MyBatis `${}` |
| `XML_SQL_NO_WHERE` | P0 | Mapper update/delete 缺 where |
| `JAVA_COLLECTION_RETURN_NULL` | P0 | 集合方法 `return null`（启发式） |
| `JAVA_THREADLOCAL_NO_REMOVE` | P0 | 有 ThreadLocal 但无 `remove()` |
| `JAVA_BIGDECIMAL_DOUBLE` | P1 | `new BigDecimal(double)` |
| `JAVA_PRINT_STACKTRACE` | P1 | `printStackTrace()` |
| `JAVA_SYSTEM_OUT` | P1 | `System.out` / `System.err` |

### 前端

| 规则 | 级别 | 说明 |
|---|---|---|
| `F2E_EVAL` | P0 | `eval` / `new Function` |
| `F2E_DANGEROUS_HTML` | P0 | `dangerouslySetInnerHTML`（检测到消毒调用时 P2） |
| `F2E_V_HTML` | P0 | `v-html`（检测到消毒调用时 P2） |
| `F2E_TARGET_BLANK` | P0 | `target=_blank` 缺 `noopener` |
| `F2E_VAR` | P1 | `var` |
| `F2E_EQEQ` | P1 | `==` / `!=` |
| `F2E_ANY` | P1 | `any` |
| `F2E_INDEX_KEY` | P1 | 数组索引作为 key |
| `F2E_V_FOR_NO_KEY` | P1 | `v-for` 缺 key |
| `F2E_V_IF_FOR` | P1 | `v-if` 与 `v-for` 同元素 |
| `F2E_INNER_HTML` | P1 | `.innerHTML =` |
| `F2E_DEBUGGER` | P1 | `debugger` |
| `F2E_TS_IGNORE` | P2 | `@ts-ignore` |
| `F2E_CONSOLE` | P2 | `console.log/debug/info` |

## 8. 准确性边界

- 扫描前去掉注释；字符串内容遮罩后再跑语法规则，SQL/HTML 规则使用保留字符串的副本。因此注释/字符串里的 `Executors`、`SimpleDateFormat` 不会误报。
- `v-html="DOMPurify.sanitize(x)"` 会降为 P2，但仍需人工确认消毒范围。
- 仍是正则级：跨文件数据流、动态拼接、复杂表达式可能漏报；`JAVA_COLLECTION_RETURN_NULL` 是方法签名启发式。
- 不自动修复；不访问网络；不执行目标代码。

## 9. 建议的提交前门禁

```bash
npx dsh-agent-prompts-scan --profile java --changed-only --root .
npx dsh-agent-prompts-scan --profile frontend --changed-only --root .
npx eslint . --max-warnings=0
npm run typecheck
```

扫描器是提示层，ESLint/PMD/P3C 是规则层，人工 review 是语义层；三层都不要省。
