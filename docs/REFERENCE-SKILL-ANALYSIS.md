# 参考 Skill 分析与吸收映射

> 本文件记录 `dsh-agent-prompts` 0.6.0 对 8 个公开 Agent Skill/仓库的学习结果；0.7.0 又补上了 Spring Security、设计反模式检查器、触发矩阵与仓库协作文档。它记录哪些优点被吸收、落在哪个文件、哪些内容**没有**照搬，不是原文合集。

## 0. 结论先行

这 8 个来源的共同优点是：

1. **触发描述写场景**，不是写“本技能介绍……”
2. **渐进披露**：SKILL.md 只放索引/决策表，细节拆到 references，按需读。
3. **先定边界再写代码**：需求/架构/组件边界/验收先于实现。
4. **检查表/反模式/症状索引**：让模型能自查，而不是只给原则。
5. **证据与门禁**：测试、浏览器截图、截图前后对比、CI、审查发现关闭标准。
6. **版本/来源可追溯**：记录基于哪个版本/文档生成，避免过期 API。
7. **AGENTS.md 兜底**：高频规则常驻，减少技能加载的 false negative。

本插件把这些优点落到 3 个新技能、4 个资源包、4 个新模板与 2 份作者文档中，而不是复制原文。

## 1. SivaLabs Spring Boot Skill

- 仓库：<https://github.com/sivaprasadreddy/sivalabs-agent-skills>（MIT，约 196 星）
- 核心内容：Spring Boot 包结构、REST API、Service 事务、Spring Data JPA、Spring Modulith、Thymeleaf、测试策略、Testcontainers、ArchUnit、Maven 配置、Docker Compose、Taskfile。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 按业务域/模块分包，模块 API 门面，内部实现包内可见 | `resources/spring-boot/api-and-service.md`、`skills/spring-boot-engineering.md` |
| Controller 薄、DTO/Entity 分离、值对象绑定、ProblemDetail 统一错误 | 同上 |
| Service 事务边界、Command/Query/Result、领域事件 | 同上 |
| Repository 只给聚合根、显式映射、乐观锁、JPQL/投影、open-in-view | 同上 |
| 测试分层：单元/切片/冒烟/E2E 互补 | `resources/spring-boot/testing-and-modulith.md` |
| Testcontainers 真实数据库、`@ServiceConnection` vs 动态属性、Docker 缺失/CI 不静默跳过 | 同上 |
| 上下文缓存、测试数据通过 Service、ArchUnit/Taikai | 同上 |
| Spring Modulith 验证、NamedInterface、事件 | 同上 |
| 版本差异（Boot 2/3/4、Jackson 2/3、Testcontainers 1/2） | `resources/spring-boot/README.md` 只写“按项目选择”，**不锁定版本** |
| 反模式/评审顺序 | `resources/spring-boot/anti-patterns.md` |
| Maven 质量插件、Docker Compose、Taskfile、Thymeleaf、容器/部署 | `resources/spring-boot/quality-and-local.md` |
| Spring Security 认证/授权/CSRF/CORS/测试 | `resources/spring-boot/security.md` |

### 没有照搬

- 原文的 Boot 4.x / Jackson 3 / 具体依赖版本号：本插件坚持“版本按项目”，不要求升级。
- 原文的完整代码片段：改为原则+检查项，避免过期 API 误导。
- Thymeleaf/Taskfile 等非通用内容：保留为“按需”，不写进主技能。

## 2. AI Java Workflow

- 仓库：<https://github.com/Lanqiao-Luca/ai-java-workflow>（MIT，约 339 星）
- 核心内容：Brain → Graph → Loop → Workflow → Agent 的组织方法；Standards（需求、设计、验证、审查、交付）、20 个 Agent 角色、可运行 Spring 案例、worktree/Docker 隔离、收敛循环。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 候选身份（commit/diff/未提交改动）与允许写集 | `resources/engineering/evidence-and-review.md`、`templates/REVIEW.md` |
| 需求：改变项 vs 保持项、可观察验收、未决 | `resources/engineering/evidence-and-review.md`、`templates/REQUIREMENTS.md` |
| 行为保持：追真实调用者，标原样/等价/变更/不适用 | 同上 |
| 风险驱动验证：正常/拒绝/边界/并发/超时/部分成功 | 同上 |
| 证据状态 PASS/FAIL/NOT_RUN/BLOCKED/PARTIAL/UNKNOWN | 同上 |
| 审查发现：位置/触发/预期/实际/影响/关闭标准 | `templates/REVIEW.md` |
| 多轴审查（代码/语义/原则/查询/文档） | `resources/engineering/evidence-and-review.md` |
| 并行写集隔离、worktree/容器边界 | 同上 |
| 能力/预算不足时标 BLOCKED，不编造 | 同上 |
| 有界收敛：轮次/预算/最早失效点/停止条件 | `resources/engineering/evidence-and-review.md` |
| 高影响结论反证：竞争解释/证据矩阵/主动反例/敏感性 | 同上 |
| 交付状态分开记、恢复点、不重放未知副作用 | `resources/engineering/delivery.md`、`templates/DELIVERY.md` |
| 设计/测试/审查/交付模板 | `resources/templates/` |
| 把“证据/方法/工具”分层，不把方法文档当执行权限 | `software-engineering-process` 的“交付纪律” |

### 没有照搬

- 20 个 Agent 角色与 Brain/Graph/Loop 的完整实现：本插件是技能包，不内置多 Agent 运行时；吸收的是**纪律**与模板。
- 大量 Python/CLI 控制脚本、案例代码：不复制，避免维护面与许可证放大。
- 具体预算/轮次数值：保留“有界”原则，不硬编。

## 3. Vuejs AI Skills

- 仓库：<https://github.com/vuejs-ai/skills>（MIT，约 3.4k 星）
- 核心内容：Vue best practices、debug guides、Router、Pinia、testing、JSX、Options API、create composable，共大量按症状索引的 references。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| “MUST be used” 触发 + 核心参考必读 | `skills/vue3-engineering.md` |
| 先确认架构（Composition API/Options/JSX）再写 | 同上 |
| 组件边界/状态所有权/职责拆分 | `resources/vue3/core.md` |
| 响应式/计算/监听器选择与常见坑 | 同上 |
| props/emits/v-model/slots/provide/inject/defineExpose | 同上 |
| Composable 设计、MaybeRef/MaybeRefOrGetter、清理 | 同上 |
| Router 参数变化/守卫、Pinia 解构/setup store | `resources/vue3/ecosystem.md` |
| 测试：Vitest/VTU/Playwright、黑盒、异步等待、Pinia、Teleport | 同上 |
| 组件异步/Suspense/KeepAlive/Teleport/过渡/slots/JSX/指令/SSR | `resources/vue3/component-patterns.md` |
| 按症状索引的调试手册 | `resources/vue3/debugging.md` |
| 反模式/自检清单 | `resources/vue3/anti-patterns.md` |

### 没有照搬

- 150+ 篇逐条 reference：改为 4 篇高频主题+症状表，避免包体与上下文膨胀。
- 特定版本号/作者元数据：保留来源，不硬绑。
- JSX/Options API 的完整章节：只在技能中给“按项目选择”的入口，不展开。

## 4. Anthony Fu Skills

- 仓库：<https://github.com/antfu/skills>（MIT，约 6.1k 星）
- 核心内容：opinionated JS/TS 约定、Vue/Nuxt/Pinia/Vite/Vitest/UnoCSS/pnpm 文档生成技能、create-pr、simplify、query、issue-triage。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| “一个概念一个文件”、精简、为 agent 重写而非抄文档 | `docs/SKILL-AUTHORING.md`、本插件资源拆分 |
| 技能索引 + references 表 + 版本/来源记录 | 各技能与 `docs/REFERENCE-SKILL-ANALYSIS.md` |
| AGENTS.md 兜底常驻规则，减少技能 false negative | `resources/AGENTS.snippet.md` |
| 显式导入/类型/单一职责/环境标记等工程偏好 | 作为“可选偏好”写入 `docs/SKILL-AUTHORING.md`，不强制所有项目 |
| PR：Conventional Commits、证据型 body、前后截图、原子提交、CI 最多 3 轮 | `resources/engineering/delivery.md` |
| ablation 简化：只保留被证明需要的 diff | `resources/engineering/simplify.md` |
| 先问清再动手（query/triage） | `software-engineering-process` 的“最多 3 个事实问题” |

### 没有照搬

- Anthony 的个人工具偏好（pnpm/ni/UnoCSS/tsdown 等）不作为团队强制；只在需要时作为可选参考。
- 仓库生成脚本与 `GENERATION.md` 流程不复制；吸收“来源/版本可追溯”原则。
- issue triage 的具体平台动作不纳入技能包。

## 5. VueUse Skills

- 仓库：<https://github.com/vueuse/skills>（MIT，约 409 星）
- 核心内容：VueUse 函数目录、按需 references、类型声明、调用策略（AUTO/EXTERNAL/EXPLICIT_ONLY）。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 渐进披露：先总览再按需读函数 | `resources/vue3/ecosystem.md` |
| 先检查已有依赖/已有 composable，不重复造轮子 | 同上 |
| 调用策略：自动可用/需要外部依赖/仅显式要求 | 同上 |
| 使用前查对应版本 API/类型，防幻觉 | 同上、`docs/SKILL-AUTHORING.md` |
| 离线/低 token/策略可被 AGENTS.md 覆盖 | 同上 |

### 没有照搬

- 完整 VueUse 函数目录与逐函数类型声明：体量大且随版本变化；改为“查项目版本/官方文档”的规则。
- 具体函数清单只举例，不承诺版本。

## 6. Anthropic Frontend Design

- 仓库：<https://github.com/anthropics/skills/tree/main/skills/frontend-design>
- 核心内容：以设计工作室主创视角做非模板化设计；subject matter 驱动；排版/布局/动效/文案原则；避免通用 AI 排版。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 先确定 subject/audience/job，再从主题世界取视觉语言 | `resources/frontend-design/brief-and-direction.md` |
| 排版承载个性；1–2 字体；type scale；行宽 <80ch | 同上 |
| 结构元素编码信息（编号/边框/标签只在有意义时） | 同上、`visual-review.md` |
| 动效克制：一个 orchestrated moment；交互反馈优先 | 同上 |
| 文案：plain verbs、CTA 说清结果、错误/空态给方向 | `brief-and-direction.md`、`anti-slop.md` |
| 避免标题单词换色/全大写标签/eyebrow 等默认套路 | `anti-slop.md` |

### 没有照搬

- 原文的具体示例/文案：改为规则与检查表。
- 单一“设计工作室”角色设定：保留为视角，不写成夸张人设。

## 7. Taste Skill

- 仓库：<https://github.com/Leonxlnx/taste-skill>（MIT，约 119k 星）
- 核心内容：反 slop 前端技能；9 条 house rules；真实照片/产品；一屏一个 section；等边；hover 微动效；浏览器 gate；四档视口；禁止紫/淡紫、假资产等。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 反 AI 味的具体清单（紫渐变/三卡片/大数字 hero/eyebrow/emoji 图标/假 logo 等） | `resources/frontend-design/anti-slop.md` |
| 一屏一个 section、等左右边、hero 入场、微交互 | `brief-and-direction.md`、`patterns.md` |
| 真实摄影/产品图；没有资产就诚实占位；不编客户/评价 | `brief-and-direction.md`、`anti-slop.md` |
| 四档视口（1440/1024/768/390）与浏览器验收 | `browser-check.md` |
| 反模式静态检查脚本（保守、可门禁） | `resources/frontend-design/check-design.mjs` |
| 文案/CTA/错误/空态规则 | `brief-and-direction.md` |
| “每个视觉都要渲染，不能空背景” | `browser-check.md`、`anti-slop.md` |
| 不删/改 kit 文件来绕过检查（检查完整性） | `docs/SKILL-AUTHORING.md` 的“不 gaming 门禁” |

### 没有照搬

- 30KB 单一 SKILL 与 100MB+ 仓库、gate 脚本、具体组件/资产：不复制；改为轻量清单+浏览器验收。
- 过于具体的视觉规则（如“每页 1–2 个 dealt moment”）作为参考，不作为所有项目的硬性要求。
- 品牌/素材依赖：保留“真实资产/许可”原则，不替用户生成假资产。

## 8. Impeccable

- 仓库：<https://github.com/pbakaus/impeccable>（Apache-2.0，约 114k 星）
- 核心内容：设计指挥/评审技能；surface 模式（Persuade/Operate/Read/Experience）、foundations、craft floor、critique rubric、audit/polish/harden、真实浏览器验证、DESIGN/PRODUCT 文档。

### 吸收的优点

| 优点 | 落点 |
|---|---|
| 按 surface 模式调节野心：营销大胆、后台克制、文档可读 | `resources/frontend-design/brief-and-direction.md` |
| 设计前读 PRODUCT/DESIGN/现有视觉真相，不凭空重做 | 同上 |
| craft floor：对比度、深度、间距、字体、动效、状态、浏览器表面、文案、brief 覆盖 | `visual-review.md`、`browser-check.md` |
| 反模式：卡片网格、hero metric、eyebrow、编号、渐变文字、玻璃拟态、侧边条、硬阴影、emoji 图标、系统 display 字体 | `anti-slop.md` |
| 认知负荷 8 项 + Nielsen 10 启发式 + P0–P3 | `visual-review.md` |
| 真实浏览器截图/四视口验证；批量看渲染再改 | `browser-check.md` |
| 不在设计任务中顺手修无关 drift；记录而不是扩大范围 | `visual-review.md` 的“评审后” |
| foundations：404、图标、social preview、legal、CI、tokens、reduced-motion 等 | `patterns.md` 的“设计系统/交付”与 `browser-check.md` |

### 没有照搬

- 900MB+ 仓库、CLI/二进制、agent 编排、全部 reference（40+ 篇）：不复制。
- 具体产品/平台的强规则：抽取为通用检查项，按项目适配。
- 自动检测脚本：本插件不引入浏览器自动化依赖；要求使用项目已有工具/人工截图，避免新增运行时。

## 9. 共同模式 → 本插件架构

| 模式 | 本插件做法 |
|---|---|
| 触发描述 | `lib/index.js` 每个技能 description 写“什么时候加载 + 覆盖什么 + 关键红线” |
| 渐进披露 | `skills/*.md` 主文件 + `resources/{alibaba-java,f2e-spec,spring-boot,vue3,frontend-design,engineering}/` 按需读 |
| 决策表/症状索引 | Spring 测试表、Vue 调试表、设计评审表、流程硬约束表 |
| 自检 | 每个技能末尾 checklist；模板带状态列 |
| 证据/门禁 | `engineering/evidence-and-review.md`、`delivery.md`、`browser-check.md`、扫描器 |
| 版本/来源 | `NOTICE.md`、本文件、各资源 README 的“按项目版本”声明 |
| AGENTS 兜底 | `resources/AGENTS.snippet.md` 把高频加载与门禁常驻 |
| 不 gaming | 不删断言/不跳测试/不弱化门禁/不伪造截图；见 `engineering/delivery.md` |

## 10. 许可与归属

| 来源 | 许可 | 使用方式 |
|---|---|---|
| SivaLabs skills | MIT | 学习总结，不复制原文 |
| AI Java Workflow | MIT | 学习总结，模板为自写 |
| vuejs-ai/skills | MIT | 学习总结，不复制 150+ references |
| antfu/skills | MIT | 学习总结，不复制个人工具偏好 |
| vueuse/skills | MIT | 学习总结，不复制函数目录 |
| Anthropic frontend-design | 见其 LICENSE.txt | 学习总结，不复制原文 |
| Taste Skill | MIT | 学习总结，不复制 gate/资产 |
| Impeccable | Apache-2.0 | 学习总结，不复制代码/脚本 |

完整归属与第三方声明见仓库根 `NOTICE.md`。如权利人认为某处使用不当，请开 issue，我们会调整或移除。
