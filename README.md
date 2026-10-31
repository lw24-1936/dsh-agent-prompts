# dsh-agent-prompts

把「全栈开发 / 问题排查」与「阿里巴巴 Java / 前端规约」做成 **DeepSeek Harness 技能包**：装上之后不用再手动粘贴长提示词，模型会在合适的场景自行加载对应规范。

[![version](https://img.shields.io/badge/version-0.2.0-4D6BFE)](https://github.com/lw24-1936/dsh-agent-prompts)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![DSH Market](https://img.shields.io/badge/DSH%20Market-listed-2EA043)](https://dsh.market/)
[![topic](https://img.shields.io/badge/topic-dsh--plugin-0e7490)](https://github.com/topics/dsh-plugin)

## 它解决什么问题

原来这些规范是几份长文档：单体 1978 行 + 微服务 2719 行，外加《阿里巴巴 Java 开发手册》约 2500 行与一份前端规范。直接贴进对话有三个问题：

1. 每次开新会话要重新贴，贴多了挤占上下文；
2. 开发 / 排查、单体 / 微服务、Java / 前端混在一起，靠人记该用哪份；
3. 大量条文是重复或不可判定的表述，真正执行时反而是噪音。

0.2.0 把它们拆成 **6 个按场景触发的技能**，并做了三件事：

- **压缩与结构化**：只保留硬约束、流程、门禁与可执行断言；
- **渐进披露**：长条文（Java 手册 8 章、原始全栈文档）放在资源目录，技能正文按需读取，不一次塞爆上下文；
- **可执行化**：P0 红线 + 红线扫描器 + 提交前门禁，把「注意代码质量」变成能跑的命令。

## 六个技能

| 技能 | 何时自动加载 | 正文 |
|---|---|---|
| `alibaba-java-standards` | 写/改/review Java 或 SQL：线程池、日期、SQL 注入、资源、异常、集合、ThreadLocal | P0 红线 + 三级管控 + 章节路由 + API 速查 |
| `f2e-spec` | 写/改/review JS/TS/React/Vue 3：格式、Hooks、Vue 3、安全、a11y | 规则分级 + 工具链 + Review 格式 |
| `fullstack-monolith-dev` | 单体全栈开发：Vue 3 + TS + Vite + Pinia / Spring Boot 3 + JDK 21 + MyBatis-Plus + Sa-Token | 技术栈、四套环境、RBAC、双文档、门禁 |
| `fullstack-monolith-debug` | 单体故障排查：500/401/403/404、数据不一致、慢查询、连不上中间件 | 定位流程 + 分层清单 + 排查记录 |
| `fullstack-microservice-dev` | 微服务开发：Nacos / Gateway / OpenFeign / Sentinel / Seata + Maven 多模块 | 版本三元组、拆分、模块、网关、事务 |
| `fullstack-microservice-debug` | 微服务链路排查：注册失败、网关 404、Feign 超时、熔断、Seata 不回滚、MQ 堆积 | 逐跳定位 + 故障速查 |

新增的两个标准技能是**横切能力**：四个全栈技能管架构、流程、环境与门禁；Java / 前端代码怎么写，交给两个标准技能。

## 三级管控：为什么 P0 要单独拎出来

规约自身的【强制】/【推荐】/【参考】不等于执行时的优先级。本插件按「违反后果」分三层：

| 层级 | 覆盖 | 行为 |
|---|---|---|
| 🔴 **P0 红线** | 线程池、并发安全、安全漏洞、资源与事务、NPE、破坏性 SQL、XSS | 新代码直接合规；**被本次 diff 触碰到的存量代码**发现即修复；不可口头豁免 |
| 🟡 **P1 新代码强制** | 命名、常量、格式、OOP、注释、分层等风格/结构类 | 只约束新增/重写代码；存量不扫描、不重命名、不刷屏 |
| 🟢 **P2 建议** | 【推荐】/【参考】 | 提示不阻塞；用户说忽略即忽略 |

老仓库代码再乱也不怕：P1 只管新写的代码；但被改到的文件里如果出现 `Executors.newFixedThreadPool`、`SimpleDateFormat`、`${}` 拼接 SQL、空 `catch`、集合 `return null` 这类 P0，必须顺手修掉——这正是 CI 质量门禁会阻断的项。

## 渐进披露：长条文不占常驻上下文

技能正文只放执行策略与路由；完整内容放在包内资源目录：

```
resources/
├── alibaba-java/          # 《Java 开发手册（黄山版）》8 章 + 索引 + 项目模板
├── f2e-spec/              # F2E 原始快照 + ESLint/Prettier/tsconfig 配置
├── reference/             # 原始全栈文档（逐字保留，供对照）
└── scan-redlines.mjs      # Java / 前端 P0 启发式扫描器
```

每个技能注册时声明 `resourceBase`，DSH 加载技能时会给出资源基准目录；模型命中具体主题（如「金额用 BigDecimal 还是 Long」「索引最左前缀」）时，才去读对应章节。

## 安装

### 方式一：GitHub（当前推荐，无需 npm 发布）

```bash
dsh plugin --profile web add git+https://github.com/lw24-1936/dsh-agent-prompts.git
```

桌面版（`desktop` profile 被 Electron 独占，命令行只对 `web` 有效）：打开 **插件设置 → 安装**，填入上面的 GitHub 地址；也可以填本地目录。

### 方式二：本地开发

```bash
dsh plugin --profile web add file:/path/to/dsh-agent-prompts
```

### 方式三：npm（0.2.0 发布后可用）

```bash
dsh plugin --profile web add dsh-agent-prompts
```

> 仓库已提交 DSH Market（条目 `lw24-1936/dsh-agent-prompts`）。市场里的 npm 安装命令要等 0.2.0 发布到 npm 后才可用；在那之前请用方式一。已提交数据修正 [#313](https://github.com/2BingLing/dsh-market/issues/313)，把安装命令更新为 GitHub 地址。

装完重启 Harness（桌面版刷新页面）后，技能会出现在技能目录。

## 用法

装好后不需要任何操作。当你提出「新建一个 Spring Boot 项目」「这个接口 500 了帮我查」「这段 Java 有没有阿里规约问题」「审查这个 Vue 组件」这类请求时，对应技能会出现在技能目录里，由模型按需加载。

也可以显式触发（在对话里说出技能名）：

```
用 alibaba-java-standards 检查这个 Service
用 f2e-spec 审查这个 Vue 3 页面
用 fullstack-microservice-dev 规范帮我搭骨架
用 fullstack-monolith-debug 流程排查这个 500
```

## 红线扫描器

标准技能里带一个零依赖的启发式扫描器，用来在提交前抓最容易踩的 P0 反例。

```bash
# Java / SQL
node "<资源目录>/scan-redlines.mjs" --profile java --root <项目根目录>

# 前端
node "<资源目录>/scan-redlines.mjs" --profile frontend --root <前端目录>

# 机器可读
node "<资源目录>/scan-redlines.mjs" --profile java --root . --json
```

资源目录就是技能加载时给出的 base directory（通常为 `<包目录>/resources`）。退出码：`0` 无 P0，`1` 发现 P0，`2` 参数/IO 错误。

覆盖范围：

- **Java**：`Executors` 工厂、裸 `new Thread`、`SimpleDateFormat`、`java.util.Date`/`Calendar`、空 `catch`、MyBatis `${}`、无 `where` 的 update/delete、集合 `return null`、`ThreadLocal` 未 `remove`、`printStackTrace`、`System.out`。
- **前端**：`eval`/`new Function`、`v-html`、`dangerouslySetInnerHTML`、`target="_blank"` 缺 `noopener`、`v-for` 缺 key、`v-if`+`v-for`、`var`、`==`、`any`、`debugger`、`console`、`@ts-ignore`。

> 扫描器是正则级提示，不替代 P3C / PMD / ESLint / 人工 review；存在少量误报，按提示人工确认即可。

## 相对原文档做了什么优化

| 项 | 原文档 | 本插件 |
|---|---|---|
| 结构 | 编号章节平铺，H1 混在中段 | 统一「前置 → 硬绑定 → 约定 → 流程 → 门禁 → 提问触发」 |
| 长度 | 单体 1978 行 / 微服务 2719 行 / Java 手册约 2500 行 | 每个技能约 150–230 行；长条文进资源目录按需读 |
| 重复 | 环境变量、自检清单、禁止事项多处重复 | 去重，每个约束只出现一次 |
| 可判定性 | 部分要求无法判定（"注意代码质量"） | 改成可检查的断言、命令、门禁 |
| 自检清单 | 60+ 项勾选，实际不会逐条执行 | 压成 10–12 条提交前门禁，附扫描器 |
| 顺序 | 开发与排查混在同一文件 | 按「单体/微服务 × 开发/排查」四象限拆分 |
| Java 规约 | 整本手册塞 prompt 会爆上下文 | 执行层 + 8 章按需路由 + P0 token 内联到 description |
| 前端规约 | 原始 Skill 部分规则停留在 class 组件时代 | 现代化为 Hooks / TS / Vue 3，并加 P0 安全分级 |
| 原文 | —— | 完整保留在 `resources/`（含 `resources/reference/`），可随时对照 |

**没有删掉任何硬约束**：技术栈版本、四套环境、包结构、Feign 契约位置、网关规则、RBAC、双文档同步、验证命令、Java P0 红线、前端安全规则全部保留并改写成可执行形式。

## 目录

```
dsh-agent-prompts/
├── package.json
├── cordis.patch.yml           # profile 补丁：插入一条插件行
├── lib/index.js               # 注册 6 个技能，声明 resourceBase
├── skills/                    # 技能正文（改文案不用改代码）
│   ├── alibaba-java-standards.md
│   ├── f2e-spec.md
│   ├── fullstack-monolith-dev.md
│   ├── fullstack-monolith-debug.md
│   ├── fullstack-microservice-dev.md
│   └── fullstack-microservice-debug.md
├── resources/
│   ├── scan-redlines.mjs
│   ├── alibaba-java/          # 00-index + 01…08 + project-template
│   ├── f2e-spec/              # original + toolchain
│   └── reference/             # 原始全栈文档（逐字保留）
├── test/                      # node:test：注册契约 + 扫描器
├── CHANGELOG.md
├── NOTICE.md                  # 来源与许可
├── PUBLISH.md                 # 发布 / 市场提交记录
└── README.md
```

## 实现说明

- 纯 Host 插件，没有 client 半，不占侧边栏。
- `inject: ['skills']` 是硬依赖：技能服务不存在时插件不激活，不会出现「装了但没效果」。
- 技能正文运行时读盘（`skills/*.md`），改文案后重启即可生效，不用重新构建。
- 每个技能注册 `resourceBase` 并统一指向 `resources/`：章节条文、原始文档与扫描器都在同一基准目录下。
- `apply` 返回组合 disposer：插件卸载时注销全部技能，不留下幽灵条目。
- 注册 `source: 'bundled'`，`invocation` 同时允许模型与用户触发。
- 无运行时依赖；`npm test` 用 `node:test`，`npm run check` 做语法检查。

## 开发与验证

```bash
npm run check    # node --check lib/index.js + scanner
npm test         # 注册契约、资源存在性、Java/前端扫描器用例
npm run verify   # 以上两项
npm pack --dry-run
```

## 兼容性

- DeepSeek Harness：使用 `ctx.skills.register` 与 `resourceBase`，要求当前 DSH 版本（2026.10 桌面版实测）。
- Node.js：>= 22（扫描器与测试使用 `node:test`、ESM）。
- 扫描器零依赖，可在任意 Node 22+ 环境单独运行。

## 版本

- **0.2.0**：新增 `alibaba-java-standards`、`f2e-spec`；6 个技能全部声明 `resourceBase`；新增红线扫描器、测试与门禁；文档重写。
- **0.1.0**：四个全栈技能（单体/微服务 × 开发/排查）首版。

详见 [CHANGELOG.md](./CHANGELOG.md)。

## 来源与许可

- 插件封装代码：MIT。
- Java 规约条文：《Java 开发手册（黄山版）》v1.7.1，版权归阿里巴巴集团；封装参考 [Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide)（MIT）。
- 前端规约：[alibaba/f2e-spec](https://github.com/alibaba/f2e-spec)（MIT）；原始 Skill 快照在 `resources/f2e-spec/original.md`。
- 全栈原始文档：随包保留在 `resources/reference/`，版权归原作者，仅作对照。

完整声明见 [NOTICE.md](./NOTICE.md)。

## 链接

- GitHub：https://github.com/lw24-1936/dsh-agent-prompts
- DSH Market：https://dsh.market/（搜索 `dsh-agent-prompts`）
- 发布记录：[PUBLISH.md](./PUBLISH.md)
