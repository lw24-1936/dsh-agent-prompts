# 技能触发矩阵

> 用于检查 10 个技能是否在正确场景被加载。它不是自动化测试（DSH 不在测试里跑模型），而是**回归样例 + 人工核对表**：每次改 description/技能名/新增技能后，用这组 prompt 复核。

## 1. 判定原则

- **主技能**：最具体、直接负责该产物的技能。
- **次技能**：主技能正文/描述里明确联动、需要一起读的规范。
- **不要**为了“覆盖”让一个技能包办所有事；也不要在同一场景加第三个近义技能。
- 如果主技能选错：先改 description 的触发词/场景，而不是继续加技能。
- 如果两个技能都合理：在两者 description 里互相点明“何时用谁”。

## 2. 样例矩阵

| # | 用户 prompt（示例） | 主技能 | 次技能 | 备注 |
|---|---|---|---|---|
| 1 | 新建一个 Spring Boot + Vue 单体项目，先定流程 | `software-engineering-process` | `fullstack-monolith-dev`、`spring-boot-engineering`、`vue3-engineering` | 流程先于实现 |
| 2 | 这个 Spring Boot 接口 500 了，帮我定位 | `fullstack-monolith-debug` | `spring-boot-engineering` | 排障流程优先；修复受 P0 约束 |
| 3 | 给这个 Spring Boot 项目加一个订单接口 | `spring-boot-engineering` | `fullstack-monolith-dev`、`alibaba-java-standards` | 结构/API 规范 |
| 4 | 这段 JPA 查询有 N+1 吗？ | `spring-boot-engineering` | `alibaba-java-standards` | 持久化专项 |
| 5 | 用 Testcontainers 补 JPA 测试 | `spring-boot-engineering` | — | 测试专项 |
| 6 | 把单体拆成模块化单体，用 Spring Modulith | `spring-boot-engineering` | `software-engineering-process` | 架构 + 流程门禁 |
| 7 | 微服务网关 404，Feign 超时 | `fullstack-microservice-debug` | `spring-boot-engineering` | 逐跳排查 |
| 8 | 新建一个 Nacos + Gateway 微服务 | `fullstack-microservice-dev` | `software-engineering-process`、`spring-boot-engineering` | 拆分/网关 |
| 9 | 这段 Java 线程池/日期/SQL 有阿里规约问题吗？ | `alibaba-java-standards` | `spring-boot-engineering`（若在 Spring 项目） | P0 红线 |
| 10 | 审查这个 Vue 3 组件 | `vue3-engineering` | `f2e-spec` | 组件/响应式优先 |
| 11 | 这个 composable 在组件卸载后还在请求 | `vue3-engineering` | `f2e-spec` | 生命周期/清理 |
| 12 | 这段前端代码有 XSS 吗？ | `f2e-spec` | `vue3-engineering`（若 Vue） | 安全红线 |
| 13 | 用 Vitest + Playwright 补 Vue 测试 | `vue3-engineering` | `f2e-spec` | 测试专项 |
| 14 | 做一个落地页，不要 AI 味 | `frontend-design-craft` | `f2e-spec`、`vue3-engineering` | 视觉方向/反模式 |
| 15 | 评审这个后台页面的层级和排版 | `frontend-design-craft` | `f2e-spec` | 设计评审 |
| 16 | 这个页面在手机端溢出/对比度不够 | `frontend-design-craft` | `f2e-spec` | 浏览器验收 |
| 17 | 这个项目该用 Scrum 还是瀑布？ | `software-engineering-process` | — | 不先问方法论，读约束 |
| 18 | 帮我排期、拆模块、定义 DoD | `software-engineering-process` | 对应开发技能 | 流程 + 工程门禁 |
| 19 | 这个 PR 交付前要检查什么？ | `software-engineering-process` | `engineering/delivery.md` | 交付纪律 |
| 20 | 简化这版改动，只保留必要的 | `software-engineering-process` | `engineering/simplify.md` | ablation |
| 21 | 帮我把 README 按优秀开源项目重写 | 无专用技能 | `frontend-design` 不适用 | 文档任务，按项目约定 |
| 22 | 这个 Java 项目用 Boot 2 还是 3？ | `alibaba-java-standards` | `spring-boot-engineering` | 读 POM，不硬绑 |

## 3. 已知重叠与处理

| 重叠 | 处理 |
|---|---|
| `spring-boot-engineering` vs `fullstack-monolith-dev` | 单项目架构/技术栈 → 全栈；Spring 内部结构/API/JPA/测试 → spring-boot；两者 description 已互相点名 |
| `vue3-engineering` vs `f2e-spec` | 格式/Hooks/安全红线 → f2e；组件/响应式/Router/Pinia/测试 → vue3；互相点名 |
| `frontend-design-craft` vs 内置 `frontend-design` / `frontend-page-craft` | 本技能强调中文项目规范、四视口验收、反 AI 味清单、静态检查器；若用户要纯视觉方向，内置技能也可用 |
| `software-engineering-process` vs 内置 `spec-driven-development` / `planning-and-task-breakdown` | 本技能先选流程再执行；具体 spec/任务拆分可交给内置技能 |
| `alibaba-java-standards` vs `spring-boot-engineering` | Java 语言/SQL 红线 → alibaba；Spring 结构与测试 → spring-boot |

## 4. 复核方法

1. 在 DSH 里新开一个会话，逐条输入样例 prompt。
2. 看技能目录/实际加载了哪些技能（而不是看模型自称）。
3. 记录：主技能是否正确、次技能是否缺失、是否加载了无关技能。
4. 失败项先改 description/whenToUse 或技能间交叉引用；仍无法区分再考虑合并/改名。
5. 新增/改技能后至少跑 1、3、7、9、10、14、17 这些代表项。

## 5. 维护

- 样例 prompt 应覆盖：新建/修改/排障/评审/测试/流程/设计/安全。
- 不要写“模型一定会加载”这种断言；矩阵是人工核对的回归样例。
- 语言以用户会说的中文为主；可补英文样例。
