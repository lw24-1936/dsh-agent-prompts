# dsh-agent-prompts

把「全栈开发 / 问题排查」提示词做成 **DeepSeek Harness 技能包**：装上之后不用再手动粘贴提示词，模型会在对的时候自己加载对应规范。

## 装了它解决什么问题

原来这些规范是几份长文档（单体 1978 行 + 微服务 2719 行）。用起来有三个麻烦：

1. 每次开新会话要重新贴，贴多了占上下文；
2. 四套提示词（单体开发 / 单体排查 / 微服务开发 / 微服务排查）混在两个文件里，靠人记哪个该用；
3. 里面有不少重复表述和不可判定的要求，真正执行时反而是噪音。

本插件把四套规范拆成四个**按场景触发**的技能，并做了压缩与结构化。

## 四个技能

| 技能 | 何时自动加载 |
|---|---|
| `fullstack-monolith-dev` | 单体全栈开发：Vue 3 + TS + Vite + Pinia / Spring Boot 3 + JDK 21 + MyBatis-Plus + Sa-Token |
| `fullstack-monolith-debug` | 单体应用故障排查（500/401/403/404、数据不一致、慢查询、连不上中间件） |
| `fullstack-microservice-dev` | 微服务开发：Spring Cloud Alibaba（Nacos / Gateway / OpenFeign / Sentinel / Seata）+ Maven 多模块 |
| `fullstack-microservice-debug` | 微服务链路排查（注册失败、网关 404、Feign 超时与 fallback 吞异常、熔断、Seata 不回滚、MQ 堆积） |

## 安装

harness 内（推荐，桌面 profile 只能走这条路）：

```
插件设置 → 安装 → 填入本包名或本地路径
```

或命令行（**只对 `web` profile 有效**；`desktop` profile 被 Electron 独占）：

```bash
dsh plugin --profile web add dsh-agent-prompts
```

本地开发时可直接指向目录：

```bash
dsh plugin --profile web add file:/path/to/dsh-agent-prompts
```

## 用法

装好后不需要任何操作。当你提出「新建一个 Spring Boot 项目」「这个接口 500 了帮我查」这类请求时，对应技能会出现在技能目录里，由模型按需加载。

也可以显式触发（在对话里说出技能名）：

```
用 fullstack-microservice-dev 规范帮我搭骨架
用 fullstack-monolith-debug 流程排查这个 500
```

## 相对原文档做了什么优化

| 项 | 原文档 | 本插件 |
|---|---|---|
| 结构 | 编号章节平铺，H1 混在中段 | 统一「前置 → 硬绑定 → 约定 → 流程 → 门禁 → 提问触发」 |
| 长度 | 单体 1978 行 / 微服务 2719 行 | 每个技能约 150–200 行 |
| 重复 | 环境变量、自检清单、禁止事项多处重复 | 去重，每个约束只出现一次 |
| 可判定性 | 部分要求无法判定（"注意代码质量"） | 一律改成可检查的断言或命令 |
| 自检清单 | 60+ 项勾选，实际不会逐条执行 | 压成「提交前门禁」8–10 条，每条对应一个可执行的验证 |
| 顺序 | 开发与排查混在同一文件 | 按「单体/微服务 × 开发/排查」四象限拆分 |
| 原文 | —— | 完整保留在 `reference/`，可随时对照 |

**没有删掉任何硬约束**：技术栈版本、四套环境、包结构、Feign 契约位置、网关规则、RBAC 要求、双文档同步、验证命令，全部保留并改写成了可执行形式。

## 目录

```
dsh-agent-prompts/
├── package.json
├── cordis.patch.yml           # profile 补丁：插入一条插件行
├── lib/index.js               # 注册四个技能
├── skills/                    # 技能正文（改文案不用改代码）
│   ├── fullstack-monolith-dev.md
│   ├── fullstack-monolith-debug.md
│   ├── fullstack-microservice-dev.md
│   └── fullstack-microservice-debug.md
└── reference/                 # 原始文档，逐字保留
    ├── fullstack-single.original.md
    └── fullstack-microservice.original.md
```

## 实现说明

- 纯 Host 插件，没有 client 半，因此不需要 `dsh.client` 字段，也不占侧边栏。
- `inject: ['skills']` 是硬依赖：技能服务不存在时插件不激活，不会出现"装了但没效果"。
- 技能正文运行时读盘（`skills/*.md`），改文案后重启即可生效，不用重新构建。
- 注册时 `source: 'bundled'`，`invocation` 同时允许模型与用户触发。

## 许可

MIT。`reference/` 下的原始文档版权归原作者，随包仅作对照用途。
