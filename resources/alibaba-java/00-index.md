# 阿里巴巴 Java 开发手册（黄山版）· 章节索引

> 版本：v1.7.1（2022.02.03）。本索引只做导航；条文以各章节文件为准。
> 执行策略、P0 红线、推荐 API 速查见技能正文 `alibaba-java-standards`，先读正文再读章节。
>
> 原「一、编程规约」已拆成 8 个文件，单文件 3–13 KB；命中哪节只读哪节，不要再整章读入。

## 编程规约（原第一章拆分）

| 文件 | 内容 | 典型问题 |
|---|---|---|
| `01a-naming.md` | (一) 命名风格 | 类名/方法名/布尔字段/包名怎么起 |
| `01b-constants-format.md` | (二) 常量定义 + (三) 代码格式 | 魔法值、`long` 后缀、缩进/换行 |
| `01c-oop.md` | (四) OOP 规约 | equals/hashCode、继承、接口、构造方法 |
| `01d-datetime.md` | (五) 日期时间 | `yyyy`/`YYYY`、`java.time`、时区 |
| `01e-collections.md` | (六) 集合处理 | 空集合、`toMap`、`subList`、`Arrays.asList` |
| `01f-concurrency.md` | (七) 并发处理 | 线程池、`ThreadLocal`、锁、`SimpleDateFormat` |
| `01g-control-statements.md` | (八) 控制语句 | `switch`、`if/else`、循环、参数校验 |
| `01h-comments-frontend-other.md` | (九) 注释 + (十) 前后端 + (十一) 其他 | Javadoc、前后端契约、其他杂项 |

## 其他章节

| 文件 | 内容 | 主要用途 |
|---|---|---|
| `02-exception-logging.md` | 异常日志：错误码、异常捕获与抛出、try-catch-finally、NPE、日志框架/级别/输出 | 异常与日志设计 |
| `03-unit-testing.md` | 单元测试：AIR、BCDE、Mock、覆盖率、测试目录 | 补测试 |
| `04-security-standards.md` | 安全规约：权限、脱敏、SQL 注入、XSS、CSRF、参数校验、文件上传、防重放 | 安全 review |
| `05-mysql-database.md` | MySQL：建表、字段类型、索引、分页、count/sum、ORM、resultMap | 建表与 SQL |
| `06-project-structure.md` | 工程结构：应用分层、DO/DTO/BO/VO/Query、二方库、GAV、服务器与 JVM | 分层与依赖 |
| `07-design-standards.md` | 设计规约：存储评审、UML、弱依赖与降级、SOLID/DRY、系统设计 | 架构与设计 |
| `08-appendix.md` | 附录：版本历史、专有名词、错误码全表 | 查名词/错误码 |
| `09-modern-java.md` | 现代 Java（按项目 JDK 版本）：records、`var`、pattern matching、虚拟线程（JDK 21+）、Optional、CompletableFuture | 现代 Java 写法与手册冲突裁决 |
| `project-template.md` | 项目级规约配置模板 | 团队覆盖与存量策略 |

## 读法

1. 先读技能正文的「P0 红线」与「推荐 API 速查」，这两节覆盖大多数生成场景。
2. 命中具体主题时，只读对应文件；不要一次读取全部章节。
3. 引用条文时带上编号与级别，例如「01-(七)4【强制】」。
4. 章节文件来自 PDF 转换，代码块可能有多余空格；以语义为准，不要照抄排版。
5. 现代 Java 写法与 2022 年手册冲突时，先读 `09-modern-java.md` 的裁决表。

## P0 与章节对应

| P0 域 | 章节 |
|---|---|
| 线程池、并发安全 | `01f-concurrency.md`（七、并发处理）+ `09-modern-java.md`（虚拟线程裁决） |
| 日期时间 | `01d-datetime.md`（五、日期时间） |
| 安全漏洞 | `04-security-standards.md` |
| 资源、事务、空 catch | `02-exception-logging.md`（二、异常处理；三、日志规约） |
| NPE、集合返回 null | `01e-collections.md`（六、集合处理）+ `02-exception-logging.md` |
| 破坏性 SQL、索引 | `05-mysql-database.md` |
