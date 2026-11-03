# Changelog

## 0.5.0 — 2026-11-03

### Added

- **`software-engineering-process` 技能**：软件工程开发流程自动选择与执行。
  - 读项目约束（需求稳定性、合规/安全、合同/交付节奏、团队规模、存量占比、反馈通道），自动选 Waterfall / V-Model / 增量 / 迭代 / Spiral / Scrum / Kanban / XP / DevOps / 混合门禁。
  - 提供流程库、0→1/持续产品/固定范围/存量/合规/事故/AI Agent 场景模板、DoR/DoD、度量与反模式。
  - 输出「流程选择 + 依据 + 节奏 + 产物 + 门禁 + 何时重选」，不先让用户选方法论。
- 四个全栈技能与 `AGENTS.snippet.md` 接入流程选择；README/README.en 增加流程说明。

### Changed

- 技能数从 6 个增加到 7 个；CI/tarball 测试同步更新。
- 版本 0.5.0；扫描器版本同步。

## 0.4.0 — 2026-11-03

### Changed

- **移除技术版本硬绑定**：单体/微服务技能不再锁定 Spring Boot、Spring Cloud、Spring Cloud Alibaba、JDK、Vue、MySQL、ESLint 等版本；改为从项目 POM/BOM/package.json/父 POM 读取，缺版本时先问用户。
- **版本相关写法改为条件化**：Spring Boot 2/3 的 `javax`/`jakarta`、Vue 2/3 的 Options API/`<script setup>`、JDK 8–21 的语言特性、ESLint 8/9 配置均按项目版本选择，不强制升级。
- **现代 Java 文档**：`09-modern-java.md` 改为「按项目 JDK 版本选择」，新增特性最低 JDK 表；虚拟线程明确标注 JDK 21+。
- **F2E 工具链**：ESLint 9 / `eslint-config-ali` 16.x 示例改为参考，不再要求升级；Vue 2 给出等价配置说明。
- **Node 引擎**：`engines.node` 从 `>=22.6` 放宽到 `>=20`；CI 矩阵增加 Node 20。
- **文档**：README/README.en 增加「不锁版本」策略；`resources/reference/README.md` 说明历史原文中的版本锁定不生效。

## 0.3.0 — 2026-11-03

### Added

- **扫描器 CLI**：`dsh-agent-prompts-scan` bin + `exports["./scan"]`，可直接 `npx dsh-agent-prompts-scan`。
- **存量友好扫描**：`--changed-only`（git 工作区/暂存/未跟踪）、`--write-baseline` / `--baseline`、`--fail-on P0|P1|P2|none`、`--ignore`、`.dsh/redlines.json`（忽略规则/路径/级别覆盖）。
- **CI 输出**：`--format sarif` 与 `--format github`；保留 `--json`。
- **误报抑制**：扫描前去掉注释并遮罩字符串；`v-html` / `dangerouslySetInnerHTML` 检测到 DOMPurify 等消毒调用时降为 P2；新增 `JAVA_BIGDECIMAL_DOUBLE`、`F2E_INNER_HTML`。
- **Java 章节拆分**：原 1036 行 `01-coding-standards.md` 拆成 `01a-naming` … `01h-comments-frontend-other`，单文件 3–13 KB。
- **`09-modern-java.md`**：JDK 17/21 records、`var`、pattern matching、虚拟线程、Optional、CompletableFuture 与手册冲突裁决。
- **示例**：`resources/examples/` 6 组 before/after；`resources/AGENTS.snippet.md` 项目接入片段。
- **测试与 CI**：内容一致性、tarball 集成测试；`.github/workflows/ci.yml` Node 22/24 矩阵。
- **文档**：README FAQ（两个市场的区别、npm 门槛、误报、自动修复）、安全边界、英文 `README.en.md`。

### Changed

- Java 技能增加 Review 输出模板、`git diff` 改动范围判定、扫描器 CLI 用法。
- F2E 工具链更新到 `eslint-config-ali` 16.x flat config（`base`/`react`），补 Vue 3 + `vue-tsc` 组合与 F2ELint。
- `engines.node` 对齐到 `>=22.6`；扫描器版本 0.3.0。

### Fixed

- 配置/baseline JSON 支持 BOM；`BigDecimal` 规则不再误报整数字面量。
- `--changed-only` 在非 git 目录回退全量并提示；`--fail-on` 的 CLI 显式值优先于配置。

## 0.2.0 — 2026-10-31

### Added

- **`alibaba-java-standards`**：阿里巴巴 Java 开发手册（黄山版 v1.7.1）执行层技能。
  - 三级管控（P0 红线 / P1 新代码强制 / P2 建议）与执行矩阵；
  - P0 红线清单、推荐 API 速查、章节路由、触发词映射、冲突裁决与豁免协议；
  - 资源目录 `resources/alibaba-java/`：8 章条文、章节索引、项目规约模板。
- **`f2e-spec`**：阿里巴巴前端代码规范执行层技能。
  - 现代化为 Hooks / TypeScript / Vue 3，补齐 P0 安全分级、a11y、性能；
  - 资源目录 `resources/f2e-spec/`：原始 Skill 快照 + ESLint / Prettier / tsconfig 配置参考。
- **`resources/scan-redlines.mjs`**：零依赖、启发式 P0 红线扫描器，支持 `java` / `frontend` 两个 profile 与 `--json` 输出。
- **测试**：`node:test` 覆盖技能注册契约、资源存在性与扫描器正反用例。
- **`NOTICE.md`**：来源、版权与许可声明。

### Changed

- 四个全栈技能接入标准技能：Java / 前端编码细节交给 `alibaba-java-standards` / `f2e-spec`，本文件专注架构、流程、环境与门禁。
- 单体开发门禁 8 条 → 10 条；微服务开发门禁 10 条 → 12 条；新增 P0 扫描与前端 lint/typecheck。
- 四个全栈技能与两个标准技能全部声明 `resourceBase`，原始文档与章节条文可按需读取。
- `apply` 返回组合 disposer，插件卸载时注销全部技能。
- 技能目录重排：原始全栈文档移入 `resources/reference/`，`resources/` 统一承载标准条文、原始文档与扫描器。
- README 重写：6 技能目录、渐进披露、扫描器、安装方式、兼容性与来源声明。

### Fixed

- 修正原 README 声称「`reference/` 可随时对照」但技能未暴露资源路径的问题。
- 补充 npm 未发布时的可用安装方式（GitHub / 本地路径），避免市场命令解析失败。
- 统一技能 description 到 500 字符以内，避免会话技能目录截断关键触发词。

## 0.1.0 — 2026-10-17

### Added

- 首个版本：四个按场景加载的全栈技能（单体 / 微服务 × 开发 / 排查）。
- 四个技能的技术栈硬绑定、四套环境、RBAC、双文档同步与提交前门禁。
- 原始全栈文档完整保留在 `reference/`（0.2.0 起移入 `resources/reference/`）。
