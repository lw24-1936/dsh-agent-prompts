# 阿里巴巴 Java 开发手册（黄山版）· 章节索引

> 版本：v1.7.1（2022.02.03）。本索引只做导航；条文以各章节文件为准。
> 执行策略、P0 红线、推荐 API 速查见技能正文 `alibaba-java-standards`，先读正文再读章节。

## 章节

| 文件 | 内容 | 主要用途 |
|---|---|---|
| `01-coding-standards.md` | 编程规约：命名、常量、格式、OOP、日期时间、集合、并发、控制语句、注释、前后端 | 写代码时的即时决策 |
| `02-exception-logging.md` | 异常日志：错误码、异常捕获与抛出、try-catch-finally、NPE、日志框架/级别/输出 | 异常与日志设计 |
| `03-unit-testing.md` | 单元测试：AIR、BCDE、Mock、覆盖率、测试目录 | 补测试 |
| `04-security-standards.md` | 安全规约：权限、脱敏、SQL 注入、XSS、CSRF、参数校验、文件上传、防重放 | 安全 review |
| `05-mysql-database.md` | MySQL：建表、字段类型、索引、分页、count/sum、ORM、resultMap | 建表与 SQL |
| `06-project-structure.md` | 工程结构：应用分层、DO/DTO/BO/VO/Query、二方库、GAV、服务器与 JVM | 分层与依赖 |
| `07-design-standards.md` | 设计规约：存储评审、UML、弱依赖与降级、SOLID/DRY、系统设计 | 架构与设计 |
| `08-appendix.md` | 附录：版本历史、专有名词、错误码全表 | 查名词/错误码 |
| `project-template.md` | 项目级规约配置模板 | 团队覆盖与存量策略 |

## 读法

1. 先读技能正文的「P0 红线」与「推荐 API 速查」，这两节覆盖大多数生成场景。
2. 命中具体主题时，只读对应章节的相关小节；不要一次读取全部章节。
3. 引用条文时带上编号与级别，例如「01-(七)4【强制】」。
4. 章节文件来自 PDF 转换，代码块可能有多余空格；以语义为准，不要照抄排版。

## P0 与章节对应

| P0 域 | 章节 |
|---|---|
| 线程池、并发安全、日期时间 | `01-coding-standards.md`（七、并发处理；九、日期时间） |
| 安全漏洞 | `04-security-standards.md` |
| 资源、事务、空 catch | `02-exception-logging.md`（二、异常处理；三、日志规约） |
| NPE、集合返回 null | `01-coding-standards.md`（六、集合处理）+ `02-exception-logging.md` |
| 破坏性 SQL、索引 | `05-mysql-database.md` |
