# Changelog

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
