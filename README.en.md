# dsh-agent-prompts

A **DeepSeek Harness skill pack** that turns full-stack development/debugging guidance, the Alibaba Java / F2E frontend conventions, and software-engineering process selection into seven on-demand skills. The agent loads the right skill when the task matches, so you no longer paste long prompts into every session.

[中文](./README.md) · English

[![version](https://img.shields.io/badge/version-0.5.0-4D6BFE)](https://github.com/lw24-1936/dsh-agent-prompts)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Skills

| Skill | Loads when |
|---|---|
| `alibaba-java-standards` | Writing, changing, or reviewing Java/SQL: thread pools, date/time, SQL injection, resources, exceptions, collections, ThreadLocal |
| `f2e-spec` | Writing, changing, or reviewing JS/TS/React/Vue (project versions): formatting, Hooks, Vue 3 examples, security, a11y |
| `software-engineering-process` | New project/module/major change, planning, "which process?", or a process that no longer fits |
| `fullstack-monolith-dev` | Monolith stack: Vue + TS + Vite + Pinia / Spring Boot + JDK + MyBatis-Plus + Sa-Token (project versions) |
| `fullstack-monolith-debug` | Monolith failures: 500/401/403/404, data inconsistency, slow queries, middleware connectivity |
| `fullstack-microservice-dev` | Spring Cloud Alibaba: Nacos / Gateway / OpenFeign / Sentinel / Seata + Maven multi-module |
| `fullstack-microservice-debug` | Microservice tracing: registration, gateway 404, Feign timeout/fallback, circuit breaker, Seata, MQ backlog |

## Process auto-selection

`software-engineering-process` reads the project constraints (requirement stability, compliance/safety, contract and delivery cadence, team size, legacy share, feedback channel) and chooses a primary process: Waterfall, V-Model, Incremental, Iterative, Spiral, Scrum, Kanban, XP, DevOps, or a hybrid with stage gates. It states the cadence, artifacts, gates, and re-selection triggers, then proceeds — it does not ask the user to pick a methodology first.

## Version policy: no hard technology pins

- Spring Boot / Spring Cloud / Spring Cloud Alibaba / JDK / Vue / MySQL / ESLint / TypeScript versions come from the project's `pom.xml`, `build.gradle`, `package.json`, parent POM, or BOM.
- Version numbers in examples (`3.5.x`, `2025.0.x`, `JDK 21`, `ESLint 9`) describe compatibility, not upgrade requirements.
- If the project has no version metadata, the agent asks; it never invents versions or upgrades dependencies on its own.
- Vue 2 / Spring Boot 2 / JDK 8/11/17 projects are not forced to migrate; the skills give equivalent patterns for the project's version.

## Three-tier enforcement

| Tier | Scope | Behavior |
|---|---|---|
| 🔴 **P0 red lines** | Thread pools, concurrency, security, resources/transactions, NPE, destructive SQL, XSS | New code must comply; touched legacy code is fixed; no verbal waiver |
| 🟡 **P1 new-code rules** | Naming, constants, formatting, OOP, comments, layering | Only new/rewritten code; no repo-wide renaming or noise |
| 🟢 **P2 suggestions** | Recommended/reference rules | Non-blocking |

## Progressive disclosure

Skill bodies contain execution policy and routing. Long content lives in `resources/` and is read on demand:

```
resources/
├── alibaba-java/     # 01a–01h split chapters + 02–08 + 09 modern Java + index/template
├── f2e-spec/         # original snapshot + ESLint/Prettier/tsconfig reference
├── examples/         # six before/after examples
├── reference/        # original full-stack documents
├── AGENTS.snippet.md # project AGENTS.md snippet
└── scan-redlines.mjs # heuristic P0 scanner
```

## Install

```bash
# GitHub (available now)
dsh plugin --profile web add git+https://github.com/lw24-1936/dsh-agent-prompts.git

# Local development
dsh plugin --profile web add file:/path/to/dsh-agent-prompts

# npm (after the package is published)
dsh plugin --profile web add dsh-agent-prompts
```

For the desktop profile, use **Plugin Settings → Install** and enter the GitHub URL or a local path.

## Scanner

When installed as a DSH plugin, run the script from the skill resource directory:

```bash
node "<resource dir>/scan-redlines.mjs" --profile java --root .
node "<resource dir>/scan-redlines.mjs" --profile java --changed-only --root .
node "<resource dir>/scan-redlines.mjs" --profile java --write-baseline .dsh/redlines-baseline.json
node "<resource dir>/scan-redlines.mjs" --profile java --baseline .dsh/redlines-baseline.json
node "<resource dir>/scan-redlines.mjs" --profile frontend --root .
node "<resource dir>/scan-redlines.mjs" --profile java --root . --format sarif
```

If the package is installed in the project's devDependencies, use the bin:

```bash
npx dsh-agent-prompts-scan --profile java --changed-only --root .
```

Options include `--changed-only`, `--baseline`, `--write-baseline`, `--fail-on P0|P1|P2|none`, `--ignore`, `--config`, and `--format text|json|sarif|github`. The scanner is heuristic; use P3C / PMD / ESLint and human review for real gates. It never executes target code or accesses the network.

## Verification

```bash
npm run verify   # syntax + unit/content/scanner/tarball tests
npm pack --dry-run
```

## Compatibility

- DeepSeek Harness with `ctx.skills.register` and `resourceBase` (tested on the 2026 desktop build).
- Node.js >= 20 for the plugin itself; the DSH host may require a newer Node version. The scanner runs on Node 20+.
- Windows / macOS / Linux; `--changed-only` requires git.

## Marketplaces

- **DSH Market** (`dsh.market`): listed as `lw24-1936/dsh-agent-prompts`; data-fix issue [#313](https://github.com/2BingLing/dsh-market/issues/313) points installs at GitHub until npm is available.
- **DSH Plugin Hub** (`dsh-plugin.org`): submission issue [#581](https://github.com/dshplugin/dsh-plugin-hub/issues/581); its in-app catalog only shows npm-installable packages, so the plugin enters that UI after the npm package is published.

## License and sources

- Plugin code and execution-layer rewrites: MIT.
- Java rules: *Java Development Manual (Huangshan edition)* v1.7.1, copyright Alibaba Group; wrapper inspired by [Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide) (MIT).
- Frontend rules: [alibaba/f2e-spec](https://github.com/alibaba/f2e-spec) (MIT).
- Original full-stack documents: retained in `resources/reference/` for comparison.

See [NOTICE.md](./NOTICE.md) for details.
