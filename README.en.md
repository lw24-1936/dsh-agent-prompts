# dsh-agent-prompts

**On-demand DeepSeek Harness skills for full-stack development, Spring Boot / Vue 3 engineering, frontend visual design, and software-engineering process selection.**

No more pasting long prompts into every session: the agent loads the right skill when the task matches, and long references stay in the package, read only when needed. Critical red lines and acceptance checks are executable.

[中文](./README.md) · English

[![version](https://img.shields.io/badge/version-0.7.1-4D6BFE)](https://github.com/lw24-1936/dsh-agent-prompts/releases)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org/)
[![DSH Market](https://img.shields.io/badge/DSH%20Market-listed-2EA043)](https://dsh.market/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](./CONTRIBUTING.md)

## Quick start

```bash
# DSH web profile
dsh plugin --profile web add git+https://github.com/lw24-1936/dsh-agent-prompts.git

# Local development
dsh plugin --profile web add file:/path/to/dsh-agent-prompts
```

Desktop app: **Plugin Settings → Install**, enter the GitHub URL or a local path. Refresh the page; the skills appear in the skill catalog.

> The npm package is not published yet. DSH Plugin Hub's in-app catalog only shows npm-installable packages; use the GitHub install until then. See [FAQ](#faq).

## Skills

| Skill | Loads when | Covers |
|---|---|---|
| `alibaba-java-standards` | Writing/changing/reviewing Java or SQL | P0 red lines, three-tier enforcement, chapter routing |
| `spring-boot-engineering` | Spring Boot structure/API/transactions/JPA/tests/Modulith | Domain modules, REST/ProblemDetail, transactions, Testcontainers/ArchUnit, Security |
| `f2e-spec` | Writing/changing/reviewing JS/TS/React/Vue | Formatting, Hooks, Vue examples, security, a11y |
| `vue3-engineering` | Vue 3 components/reactivity/composables/Router/Pinia/tests | Reactivity/components, ecosystem, Vitest/Playwright, debugging |
| `frontend-design-craft` | Designing/changing/reviewing pages, landing pages, dashboards, design systems | Brief/visual direction, review rubric, four-viewport browser check, anti-slop, design checker |
| `software-engineering-process` | New project/module/major change, planning, "which process?" | Automatic selection, flow library, DoR/DoD, evidence/review/delivery discipline |
| `fullstack-monolith-dev` | Monolith full-stack development | Vue + Spring Boot stack, environments, RBAC, docs, gates |
| `fullstack-monolith-debug` | Monolith failures | 500/401/403/404, data inconsistency, slow queries, middleware |
| `fullstack-microservice-dev` | Microservice development | Nacos/Gateway/OpenFeign/Sentinel/Seata, multi-module |
| `fullstack-microservice-debug` | Microservice tracing | registration, gateway 404, Feign timeout, circuit breaker, Seata, MQ backlog |

## How it works

```text
skills/<name>.md       triggers + decision tables + core rules + resource index + self-check
        │
        ├── resources/alibaba-java/        split Java manual chapters
        ├── resources/f2e-spec/            F2E snapshot + toolchain
        ├── resources/spring-boot/         architecture/API/JPA/tests/Modulith/Security
        ├── resources/vue3/                reactivity/components/ecosystem/debugging
        ├── resources/frontend-design/     brief/review/browser check/design checker
        ├── resources/engineering/         evidence/review/delivery/simplify
        ├── resources/templates/           PROCESS/REQUIREMENTS/DESIGN/REVIEW/DELIVERY
        └── resources/scan-redlines.mjs    P0 scanner
```

`lib/index.js` registers skills with `ctx.skills.register`; each skill declares `resourceBase`. Long references are read on demand. Zero runtime dependencies, no network access; the scanners are read-only.

## Process auto-selection

`software-engineering-process` reads project constraints (requirement stability, compliance/safety, contract/delivery cadence, team size, legacy share, feedback channel) and chooses a primary process: Waterfall, V-Model, Incremental, Iterative, Spiral, Scrum, Kanban, XP, DevOps, or a hybrid with stage gates. It states cadence, artifacts, gates, and re-selection triggers, then proceeds — it does not ask the user to pick a methodology first. Record the result with [PROCESS.md](./resources/templates/PROCESS.md).

## Two executable gates

### P0 red-line scanner

```bash
node "<resource dir>/scan-redlines.mjs" --profile java --root .
node "<resource dir>/scan-redlines.mjs" --profile java --changed-only --root .
node "<resource dir>/scan-redlines.mjs" --profile java --write-baseline .dsh/redlines-baseline.json --root .
node "<resource dir>/scan-redlines.mjs" --profile java --baseline .dsh/redlines-baseline.json --root .
node "<resource dir>/scan-redlines.mjs" --profile frontend --root .
node "<resource dir>/scan-redlines.mjs" --profile java --root . --format sarif
```

If installed in devDependencies: `npx dsh-agent-prompts-scan --profile java --changed-only --root .`.

Heuristic, not a full linter; use P3C/PMD/ESLint and human review for formal gates. See [SCANNER.md](./docs/SCANNER.md).

### Design anti-pattern checker

```bash
node "<resource dir>/frontend-design/check-design.mjs" --root . --fail-on P1
```

Conservative checks: purple gradients, `transition: all`, lorem ipsum, missing `alt`, clickable div/span, `outline: none`, `z-index: 9999`. It does not judge visual quality and does not replace the four-viewport browser check. See [DESIGN-CHECK.md](./docs/DESIGN-CHECK.md). If installed in devDependencies: `npx dsh-agent-prompts-design --root . --fail-on P1`.

## Examples

```text
Use software-engineering-process to choose a process for this project.
Use spring-boot-engineering to design this module's API and tests.
Use vue3-engineering to refactor this composable.
Use frontend-design-craft to review this landing page.
Use fullstack-microservice-dev to scaffold a microservice project.
```

More prompts and overlap handling: [TRIGGER-MATRIX.md](./docs/TRIGGER-MATRIX.md).

## Configuration

```yaml
dsh-agent-prompts:
  only: [spring-boot-engineering, vue3-engineering]
  # or
  disabled: [fullstack-microservice-debug]
```

`only`/`disabled` must be string arrays; invalid shapes are ignored with a warning; duplicates are de-duplicated; unknown names warn. `only` wins over `disabled`. Omit to register all ten. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Version policy

- Spring Boot / Spring Cloud / JDK / Vue / MySQL / ESLint / TypeScript versions come from the project's `pom.xml`, `build.gradle`, `package.json`, parent POM, or BOM.
- Version numbers in examples describe compatibility, not upgrade requirements.
- Vue 2 / Boot 2 / JDK 8/11/17 projects are not forced to migrate; equivalent patterns are provided.
- The package's own Node floor is in `package.json`; the DSH host may require newer.

## Project integration

Append [resources/AGENTS.snippet.md](./resources/AGENTS.snippet.md) to the project's `AGENTS.md` so the agent knows which skills to load and which checks to run. Record process decisions with [PROCESS.md](./resources/templates/PROCESS.md); use [REQUIREMENTS](./resources/templates/REQUIREMENTS.md), [DESIGN](./resources/templates/DESIGN.md), [REVIEW](./resources/templates/REVIEW.md), and [DELIVERY](./resources/templates/DELIVERY.md) for the rest.

## Docs

| Doc | Content |
|---|---|
| [AGENTS.md](./AGENTS.md) | Repository agent instructions, commands, release |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Registration, progressive disclosure, config, compatibility |
| [SCANNER.md](./docs/SCANNER.md) | Scanner rules/config/baseline |
| [DESIGN-CHECK.md](./docs/DESIGN-CHECK.md) | Design checker usage/rules/limits |
| [TRIGGER-MATRIX.md](./docs/TRIGGER-MATRIX.md) | 22 trigger examples and overlap handling |
| [REFERENCE-SKILL-ANALYSIS.md](./docs/REFERENCE-SKILL-ANALYSIS.md) | What was adopted from 8 reference skills |
| [SKILL-AUTHORING.md](./docs/SKILL-AUTHORING.md) | Skill authoring practices |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) / [SECURITY.md](./SECURITY.md) | Contributing and vulnerability reporting |

## Development

```bash
npm run check        # syntax
npm test             # node:test: registration/content/scanner/design/tarball
npm run verify       # check + test
npm pack --dry-run   # package contents
npm run check:design # run the design checker on this repo
```

No dependencies; Node.js >= 20. Adding a skill requires updating `lib/index.js`, tests, README/AGENTS, and CHANGELOG. See [AGENTS.md](./AGENTS.md).

## Compatibility

- DSH with `ctx.skills.register` and `resourceBase`.
- Node.js >= 20 for the package itself.
- Windows/macOS/Linux; `--changed-only` requires git.

## FAQ

<details>
<summary><b>Why can't I find it in DSH Plugin Hub's in-app marketplace?</b></summary>

That catalog only shows npm-installable packages, and this package is not published to npm yet. DSH Market lists `lw24-1936/dsh-agent-prompts`; installs use GitHub until npm is available. See [PUBLISH.md](./PUBLISH.md).
</details>

<details>
<summary><b>Do the scanners modify code?</b></summary>

No. They read local files only, do not execute target code, and do not access the network.
</details>

## License and credits

- Plugin code and execution-layer rewrites: MIT (see [LICENSE](./LICENSE)).
- Java rules: *Java Development Manual (Huangshan edition)* v1.7.1, copyright Alibaba Group; wrapper inspired by [Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide) (MIT).
- Frontend rules: [alibaba/f2e-spec](https://github.com/alibaba/f2e-spec) (MIT).
- Eight reference skills studied since 0.6.0, with an adoption map: [REFERENCE-SKILL-ANALYSIS.md](./docs/REFERENCE-SKILL-ANALYSIS.md).
- Full notices: [NOTICE.md](./NOTICE.md).
