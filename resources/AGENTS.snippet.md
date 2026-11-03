# 项目 AGENTS.md 片段：Java / 前端规约自动加载

> 把下面这段追加到项目根 `AGENTS.md`（或 `CLAUDE.md` 等 agent 指令文件），让 agent 在进入项目时就知道该加载哪些技能、提交前跑什么检查。按项目实际情况改路径与命令。

```md
## 编码规约（dsh-agent-prompts）

- 写、改或 review Java/SQL 前，先加载技能 `alibaba-java-standards`，按其「P0 红线」执行；条文按需读 `alibaba-java/01a…09`。
- 写、改或 review 前端（JS/TS/React/Vue，框架版本按项目）前，先加载技能 `f2e-spec`。
- 技术版本以项目 `pom.xml` / `build.gradle` / `package.json` / 父 POM / BOM 为准；不要求升级，没有版本信息时先问用户。
- 修复线上问题时同样受 P0 约束：不得用「先让它不报错」绕过空 catch、SQL 拼接、线程池红线。
- 「被本次改动触碰的代码」= `git diff --name-only` + `git diff --cached --name-only` + 新增未跟踪文件；P0 在这份清单内发现即修复，P1 只约束新增/重写行。
- 提交前跑（`<资源目录>` 替换为技能加载时给出的 base directory；若项目已 `npm i -D dsh-agent-prompts`，可改用 `npx dsh-agent-prompts-scan`）：
  `node "<资源目录>/scan-redlines.mjs" --profile java --changed-only --root .`
  `node "<资源目录>/scan-redlines.mjs" --profile frontend --changed-only --root .`
  存量仓库第一次用 `--write-baseline .dsh/redlines-baseline.json` 建立基线，之后用 `--baseline` 只拦新增问题。
- 项目自定义规约放 `.dsh/java-standards.md`（可从技能资源 `alibaba-java/project-template.md` 复制）；团队规约可以覆盖风格，但不能关闭 P0。
```

## 说明

- 技能名必须与目录中的完全一致：`alibaba-java-standards`、`f2e-spec`。
- 作为 DSH 插件安装时，扫描器在技能资源目录的 `scan-redlines.mjs`；只有把本包装进项目 devDependencies 时才有 `dsh-agent-prompts-scan` 这个 bin。
- 扫描器是启发式提示，正式门禁仍以 P3C / PMD / ESLint 与人工 review 为准。
