# Spring Boot 工程实践（按需查阅）

> 本目录把 Spring Boot 项目的**结构、API、事务、测试、模块化**拆成可执行检查项。版本以项目 `pom.xml` / `build.gradle` / 父 POM / BOM 为准，不要求升级。
>
> 只读当前任务需要的文件；不要一次载入全部。

| 文件 | 内容 | 何时读 |
|---|---|---|
| `api-and-service.md` | 包结构、REST API、DTO/值对象、Service/事务、JPA | 写接口、改服务、建模块 |
| `testing-and-modulith.md` | 单元/切片/冒烟/E2E、Testcontainers、ArchUnit、Spring Modulith | 补测试、拆模块、配 CI |
| `security.md` | 认证/授权、FilterChain、方法级鉴权、密码/会话/JWT、CSRF/CORS、安全测试 | 写/改/审查安全配置 |
| `quality-and-local.md` | 构建质量插件、Docker Compose、Taskfile、Thymeleaf、容器/部署 | 配构建、本地环境、可选能力 |
| `anti-patterns.md` | 高频反模式与修复方向 | review、重构、排障 |

## 三条底线

1. **先读项目结构再落代码**：包结构、模块边界、现有异常/返回体/测试风格优先于本目录示例。
2. **Controller 薄、Service 事务、Repository 只碰聚合根**：业务逻辑不写进 Controller，不把 Entity 直接当 API 返回。
3. **测试要启动真实框架/真实数据库**：单元测试不能替代切片测试；持久化测试不用内存库冒充生产。

## 版本分支

- Spring Boot 2 / 3 / 4：`javax`/`jakarta`、Security 配置、Jackson 2/3、`@MockBean`/`@MockitoBean`、Testcontainers 1/2 的差异按项目版本选择。
- 不要为了套本文示例升级依赖；示例中的 API 不适用时，给出项目版本下的等价写法。
- 具体版本兼容矩阵以项目父 POM/BOM 与官方文档为准，不凭记忆写版本号。

## 来源

本目录是以下公开资料的学习总结，不是原文复制：

- [SivaLabs Spring Boot Skill](https://github.com/sivaprasadreddy/sivalabs-agent-skills/tree/main/skills/spring-boot)（MIT）
- Spring Boot / Spring Data JPA / Spring Modulith / ArchUnit / Testcontainers 官方文档

具体归属见仓库根 `NOTICE.md`。
