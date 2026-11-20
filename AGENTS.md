# AGENTS.md — dsh-agent-prompts 维护指南

> 这是本仓库的 **agent 指令入口**，供参与开发、审查、发布此插件的 AI agent 使用。下游项目要复制的是 [`resources/AGENTS.snippet.md`](./resources/AGENTS.snippet.md)，不是本文件。

## 1. 项目是什么

`dsh-agent-prompts` 是一个 **DeepSeek Harness（DSH）Host-only 技能包**：

- 10 个按场景自动加载的技能：全栈单体/微服务 × 开发/排查、阿里 Java、Spring Boot、F2E、Vue 3、前端视觉设计、软件工程流程。
- 技能正文在 `skills/`，长内容在 `resources/`，按需读取。
- 零运行时依赖；`lib/index.js` 通过 `ctx.skills.register` 注册，`resourceBase` 指向 `resources/`。
- 附带 Java/前端 P0 红线扫描器 `resources/scan-redlines.mjs`。

## 2. 最小工作流

```bash
npm run check        # 语法检查
npm test             # node:test：注册/内容/扫描器/设计检查/tarball/文档一致性
npm run verify       # check + test（提交前必须）
npm pack --dry-run   # 检查打包内容
npm run check:design # 对本仓库跑设计反模式检查
```

新增/修改技能后：

1. 改 `skills/<name>.md` 或 `resources/`；
2. 更新 `lib/index.js` 的 `SKILLS`（名称、description ≤500 字符、whenToUse、file）；
3. 更新 `test/content.test.mjs` 的 `SKILL_FILES`、资源已知集合与断言；
4. 更新 `test/plugin.test.mjs` 的 `EXPECTED`、数量与资源断言；
5. 更新 `test/tarball.test.mjs` 的包内文件与技能列表；
6. 更新 `README.md`、`README.en.md`、`CHANGELOG.md`、`resources/AGENTS.snippet.md`（如果影响下游接入）；
7. 跑 `npm run verify` 与 `npm pack --dry-run`。

## 3. 技能编写规则

- **description 是加载触发器**：写“什么时候加载 + 覆盖什么 + 关键约束”，≤500 字符；不要写“本技能介绍……”。
- **渐进披露**：主文件只放触发、决策表、核心规则、按需资源索引、自检；细节放 `resources/<domain>/`。
- **一篇一主题**：资源文件按主题拆分，主文件用表格路由“何时读哪篇”。
- **自检可观察**：不写“确保质量”，写“测试分层/真实数据库/四视口/对比度/未验证项”。
- **版本中立**：技术版本从项目 `pom.xml` / `build.gradle` / `package.json` / 父 POM / BOM 读取；示例只说明条件分支，不要求升级。
- **不复制参考仓库**：只吸收方法并重写；来源与许可见 `NOTICE.md`、`docs/REFERENCE-SKILL-ANALYSIS.md`。
- **不 gaming 门禁**：不删断言、不跳测试、不弱化 lint、不伪造截图/证据。

## 4. 代码与内容边界

- `lib/index.js`：只做注册、配置过滤、资源基座；不引入运行时依赖。
- `skills/`：技能正文；改文案不需要改代码。
- `resources/`：长文、模板、扫描器、设计检查器；路径相对 `resources/`。
- `test/`：Node 内置 `node:test`，不引测试框架。
- `docs/`：面向维护者/使用者的说明；`docs/SCANNER.md`、`docs/DESIGN-CHECK.md`、`docs/TRIGGER-MATRIX.md`、`docs/ARCHITECTURE.md`、`docs/REFERENCE-SKILL-ANALYSIS.md`、`docs/SKILL-AUTHORING.md`。
- `cordis.patch.yml`：profile 补丁；Host-only，无 client 半。
- 不在运行时访问网络；扫描器/检查器只读本地文件，不执行目标代码。

## 5. 配置

`apply(ctx, config)` 支持：

```yaml
# profile 的 cordis 配置示例（按实际位置调整）
dsh-agent-prompts:
  only: [spring-boot-engineering, vue3-engineering]
  # 或
  disabled: [fullstack-microservice-debug]
```

- `only` / `disabled` 必须是字符串数组；非法类型会被忽略并 warn。
- 未知技能名会 warn，不阻断其它技能。
- 不传时注册全部 10 个技能。

## 6. 版本与发布

- 语义化版本：改文案/修 bug → patch；新增技能/资源/能力 → minor；破坏注册契约/结构调整 → major。
- 发布前：
  1. 更新 `package.json` `version`；
  2. 更新 `CHANGELOG.md`（Added/Changed/Fixed/Credits）；
  3. 更新 README/README.en 的版本、技能表、目录、兼容性；
  4. `npm run verify` + `npm pack --dry-run`；
  5. 提交、打 `v<version>` tag、推 GitHub；
  6. 等 CI 与 Release workflow 绿；
  7. 安装到 desktop profile 验证技能目录；如市场需要，更新 `PUBLISH.md` 与市场条目。
- 不登录 npm / 不发布 npm，除非用户明确授权。

## 7. 当前 10 个技能

| 技能 | 职责 |
|---|---|
| `alibaba-java-standards` | Java/SQL P0 红线、章节路由、扫描器 |
| `spring-boot-engineering` | Spring Boot 结构/API/事务/JPA/测试/Modulith |
| `f2e-spec` | F2E 前端代码规范与安全红线 |
| `vue3-engineering` | Vue 3 组件/响应式/Router/Pinia/测试 |
| `frontend-design-craft` | 视觉方向/评审/四视口验收/反 AI 味 |
| `software-engineering-process` | 流程自动选择 + 证据/审查/交付纪律 |
| `fullstack-monolith-dev` | 单体全栈架构/技术栈/门禁 |
| `fullstack-monolith-debug` | 单体故障排查 |
| `fullstack-microservice-dev` | 微服务拆分/网关/事务/门禁 |
| `fullstack-microservice-debug` | 微服务链路排查 |

## 8. 当前优化优先级

1. **触发命中率**：用 `docs/TRIGGER-MATRIX.md` 的样例 prompt 检查是否加载正确技能；重叠时先改 description，不继续加技能。
2. **CI 防线**：链接/名称/资源可达性/版本中立测试；新增资源必须进测试 known 集合。
3. **内容深度**：Spring Security 已补；设计检查器已补；高级工作流（worktree/多轴审查）仍可继续。
4. **发布**：npm 未发布是 DSH Plugin Hub「插件中心」不可见的唯一原因；需要账号交互。

## 9. 审查清单

- [ ] 新技能 description 有触发场景、≤500 字符、版本中立。
- [ ] 技能正文有资源索引与自检；资源路径可解析。
- [ ] `SKILLS`、README 表、`AGENTS.snippet` 三处名称一致。
- [ ] 测试全部通过；tarball 包含新文件。
- [ ] 没有硬编码技术版本/密钥/绝对路径。
- [ ] 来源与许可更新；没有复制大段原文。
- [ ] CHANGELOG/README/PUBLISH 同步。
- [ ] 扫描器/检查器只读，不执行目标代码。
