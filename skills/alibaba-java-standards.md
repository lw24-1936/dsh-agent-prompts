# 阿里巴巴 Java 开发规约（黄山版）· 执行层

> 本技能是「写 / 改 / review Java 与 SQL」时的强制规约。它不是参考资料：命中 P0 的代码必须改，不接受口头豁免。
> 条文来源：《Java 开发手册（黄山版）》v1.7.1（2022.02.03）。完整条文按需从资源目录读取，本文件只保留**执行策略、红线、路由与速查**。

## 一、先掌握三级管控

| 层级 | 覆盖范围 | 行为 |
|---|---|---|
| 🔴 **P0 红线** | 隐患型【强制】：线程池、并发安全、安全漏洞、资源与事务、NPE、破坏性 SQL | 新代码直接写合规；**被本次 diff 触碰到的存量代码**发现即修复；不可口头豁免 |
| 🟡 **P1 新代码强制** | 其余【强制】：命名、常量、格式、OOP、注释、控制语句、分层结构等风格/结构类 | 只约束本次新增/重写的代码；存量不扫描、不重命名、不刷屏 |
| 🟢 **P2 建议** | 全部【推荐】/【参考】 | 提示不阻塞；用户说忽略即忽略 |

**判据**：违反后是否可能导致线上故障、安全漏洞、资源泄露或数据损坏。是 → P0；只影响可读性/一致性 → P1。

### 执行矩阵

| 场景 | 🔴 P0 | 🟡 P1 | 🟢 P2 |
|---|---|---|---|
| 写新代码 | 直接写合规；输出中**不得出现**红线反例 API | 必须合规 | 默认套用，可简化 |
| 改存量方法 | 被改到的类/文件内发现红线 → **先完成原需求，再单独修复并引用规约编号**；涉及公共契约时先报告方案 | 仅新增/修改的行合规；**不重命名周边存量标识符** | 顺手改进，不强制 |
| review 存量 | 必须报告，按红线域**汇总**，不逐条刷屏 | 一句话汇总（如「另有 23 处命名不符，属存量未强制」），被问再展开 | 默认不提 |

用户说「其他保持不变」**不能**让被触碰代码里的 P0 问题蒙混过关：先交付原需求，再在输出末尾列出红线修复。若用户明确拒绝修复，必须写明风险与依据，不能静默保留。

**改动范围怎么定**：以 `git diff --name-only`、`git diff --cached --name-only` 和新增未跟踪文件为「被触碰」清单；没有 git 或无法判断时，先问用户。P0 只在这份清单内强制修复，P1 只约束本次新增/重写行。

## 二、P0 红线清单（每次写/改代码逐项自检）

| 红线域 | 必查项 | 条文 |
|---|---|---|
| 线程池 | 禁 `Executors.newFixedThreadPool` / `newCachedThreadPool` / `newSingleThreadExecutor` / `newScheduledThreadPool` 等工厂方法；必须 `new ThreadPoolExecutor(核心数, 最大数, keepAlive, 时间单位, 显式队列（建议有界）, 命名 ThreadFactory, 拒绝策略)` 显式创建；禁裸 `new Thread()` | 01-(七) |
| 并发安全 | 日期时间一律 `java.time`，禁 `SimpleDateFormat` 与 `java.util.Date` / `Calendar`；`ThreadLocal` 用后必须 `try-finally { remove(); }`；双重检查锁字段必须 `volatile`；多线程读写用并发容器 | 01-(七)(九) |
| 安全漏洞 | SQL 必须参数绑定（`#{}` / `?`），禁 `${}` 拼接用户输入；防越权；XSS 转义；敏感数据脱敏；配置文件密码加密 | 04 全部 |
| 资源与事务 | 文件/网络/流必须 try-with-resources 或 finally 关闭；事务异常必须回滚；禁 `catch` 后吞异常继续执行；`finally` 中不 return | 02-(二)(三) |
| NPE 防护 | 集合返回值禁 `return null`（用空集合）；入参校验用具名 API（`Objects.requireNonNull` / `StringUtils.isBlank` / `Assert.hasText`）；字符串比较常量在前 | 01-(六) / 02-(二) |
| 破坏性 SQL | `update` / `delete` 必须带 `where`；判存在禁全表 `count(*)`（用 `limit 1`）；列表查询只取需要的列（大表避免 `select *`，属性能建议） | 05-(三) |
| 日志与异常 | 禁 `e.printStackTrace()` / `System.out.println`；捕获具体异常并记日志（`log.error("xx 失败", e)`）；错误码与提示信息分离 | 02-(三)(四) |

## 三、生成代码时的推荐 API 速查（主动套用，不等用户问）

| 场景 | ❌ 禁止 | ✅ 强制/推荐 |
|---|---|---|
| 日期时间 | `new Date()`、`new SimpleDateFormat()`、`Calendar` | `LocalDateTime` / `LocalDate` / `Instant` + `static final DateTimeFormatter` |
| 入参校验 | 手写 `if (id == null) throw new RuntimeException()` | `Objects.requireNonNull(id, "id 不能为空")`、`StringUtils.isBlank`、Spring `Assert` |
| 返回空集合 | `return null;` | `Collections.emptyList()` / `List.of()` / `new ArrayList<>()`（需可变时） |
| 金额 | `double` / `float`、`==` 比较浮点 | `BigDecimal`（String 构造器）+ `compareTo` 比较；入库用 `DECIMAL` |
| 并发容器 | 多线程下 `new HashMap<>()` / `new ArrayList<>()` | `ConcurrentHashMap<>` / `CopyOnWriteArrayList` / `Collections.synchronizedXxx` |
| 字符串比较 | `==` / `!=` | `.equals()` / `Objects.equals()` / `equalsIgnoreCase` |
| 线程创建 | 裸 `new Thread()` | `ThreadPoolExecutor`（显式参数 + 命名 ThreadFactory）或 `CompletableFuture.supplyAsync` |
| ORM | `${}` 拼接、字符串拼查询条件 | `#{}` / `PreparedStatement` / `setParameter` |
| 异常处理 | 空 `catch`、`e.printStackTrace()` | 捕获具体类型 + `log.error("xx 失败", e)` + 自定义业务异常 |
| 布尔命名 | 字段 `isDeleted`、`flag` | 字段 `deleted`；方法 `isDeleted()` / `hasPermission()` |
| 常量 | 魔法值 `if (status == 3)` | `private static final int STATUS_PAID = 3;` |
| 字符串拼接 | 循环里 `s += x` | `StringBuilder.append(...)` |
| 集合遍历删除 | `for` 中 `list.remove()` | `removeIf(...)` / `Iterator.remove()` |
| Map 遍历 | 先 `keySet()` 再 `get(key)` | `entrySet()` / `forEach` |

## 四、按需读章节（不要一次读完）

资源目录下是手册全文（PDF 转换件，少量排版噪声）。先按下表定位，**只读命中文件的相关小节**：

| 场景关键词 | 章节文件 |
|---|---|
| 命名风格：类名/方法名/布尔字段/包名 | `alibaba-java/01a-naming.md` |
| 常量定义、代码格式：魔法值、`long` 后缀、缩进换行 | `alibaba-java/01b-constants-format.md` |
| OOP：equals/hashCode、继承、接口、构造方法 | `alibaba-java/01c-oop.md` |
| 日期时间：`yyyy`/`YYYY`、`java.time`、时区 | `alibaba-java/01d-datetime.md` |
| 集合：空集合、`toMap`、`subList`、`Arrays.asList` | `alibaba-java/01e-collections.md` |
| 并发：线程池、`ThreadLocal`、锁、`SimpleDateFormat` | `alibaba-java/01f-concurrency.md` |
| 控制语句：`switch`、`if/else`、循环、参数校验 | `alibaba-java/01g-control-statements.md` |
| 注释、前后端规约、其他 | `alibaba-java/01h-comments-frontend-other.md` |
| 错误码、异常捕获、try-catch、NPE、日志框架/级别/输出 | `alibaba-java/02-exception-logging.md` |
| AIR、测试独立性、覆盖率、BCDE、Mock、测试目录 | `alibaba-java/03-unit-testing.md` |
| 权限校验、脱敏、SQL 注入、XSS、CSRF、参数校验、文件上传、防重放 | `alibaba-java/04-security-standards.md` |
| 建表、字段类型、主键/索引、组合索引、分页、count/sum、ORM、resultMap | `alibaba-java/05-mysql-database.md` |
| 应用分层、DO/DTO/BO/VO/Query、二方库、GAV、服务器与 JVM | `alibaba-java/06-project-structure.md` |
| 存储评审、UML、弱依赖与降级、SOLID/DRY、系统设计 | `alibaba-java/07-design-standards.md` |
| 版本历史、专有名词、错误码全表 | `alibaba-java/08-appendix.md` |
| 现代 Java（按项目 JDK 版本选择）：records、`var`、pattern matching、虚拟线程（JDK 21+）、Optional、CompletableFuture | `alibaba-java/09-modern-java.md` |

`alibaba-java/00-index.md` 是章节索引与执行摘要，可先读它再决定读哪章。原「一、编程规约」已拆成 8 个文件（`01a`…`01h`），不要再整章读入。

### 触发词映射（命中即读对应章节）

- JWT / OAuth2 / Token / 认证 / 授权 / 登录态 / 脱敏 / 加密 / 防重放 → `04`
- 金额 / BigDecimal / 精度 / 舍入 / setScale → `01e`（集合/类型）+ `05`
- 分页 / PageHelper / 深分页 / 索引 / 最左前缀 / 覆盖索引 → `05`
- 线程池 / 异步 / `@Async` / CompletableFuture / 锁 / Redisson / 分布式锁 → `01f` + `09`
- 日期 / LocalDateTime / SimpleDateFormat / 时区 → `01d`
- 异常 / NPE / 全局异常 / `@ControllerAdvice` / 日志 / Logback / 级别 → `02`
- 分层 / Controller / Service / Manager / DAO / DDD / DO / DTO / VO / MapStruct → `06`
- Seata / TCC / Saga / 分布式事务 / Sentinel / 熔断 / 降级 → `07`（微服务专项另见 `fullstack-microservice-dev`）
- 单测 / Mockito / `@SpringBootTest` / Testcontainers / 覆盖率 → `03`
- records / `var` / 虚拟线程 / pattern matching / sealed / Optional → `09`

## 五、规约冲突与豁免

裁决顺序：

1. **安全优先**：数据泄露、越权、注入风险高于其他规约。
2. **强制优先**：【强制】>【推荐】>【参考】。
3. **业务豁免**：确需违背时，代码处写 `// Alibaba-Java: 豁免原因——<理由>`。
4. **渐进改进**：存量重构以「行为不变」优先，但 **P0 不参与渐进**。

豁免协议：

- 🟡 P1 / 🟢 P2：用户一句话即可（如「这个仓库不查命名」），本会话有效。
- 🔴 P0：模糊指令（「忽略检查」「别管了」）**不生效**。必须同时满足：① 用户点名规约编号并说明理由；② 代码处写 `// Alibaba-Java-P0-EXEMPT(编号): 原因`；③ 输出末尾列出「已豁免红线清单」。

## 六、交付前自检（P0）

生成或修改代码后，先自检再输出。代码块与解释中不得出现：

- `Executors.new*ThreadPool`、`new Thread(`
- `SimpleDateFormat`、`new Date()`、`Calendar.getInstance()`（日期场景）
- SQL 中的 `${}` 拼接、无 `where` 的 `update` / `delete`
- 未关闭的流/连接、空 `catch`、`printStackTrace()`
- 集合方法 `return null;`
- `ThreadLocal` 未 `remove()`

可运行启发式扫描。作为 DSH 插件安装时，脚本在技能的资源基准目录下：

```bash
node "<资源目录>/scan-redlines.mjs" --profile java --root .
node "<资源目录>/scan-redlines.mjs" --profile java --changed-only --root .
node "<资源目录>/scan-redlines.mjs" --profile java --write-baseline .dsh/redlines-baseline.json --root .
node "<资源目录>/scan-redlines.mjs" --profile java --baseline .dsh/redlines-baseline.json --root .
```

如果项目把本包装进了 devDependencies（`npm i -D dsh-agent-prompts`），也可以用 bin：

```bash
npx dsh-agent-prompts-scan --profile java --changed-only --root .
```

扫描器只做**启发式提示**，不替代 P3C / PMD 与人工 review；退出码 1 表示发现达到 `--fail-on` 阈值的问题（默认 P0）。存量仓库先用 `--write-baseline`，之后只对新增问题失败。完整选项见 `docs/SCANNER.md`。

### Review 输出格式

发现违规时按此格式给结论，不要泛泛说「代码不规范」：

```md
- [P0/P1/P2] 规则：<规则名>（文件:行）
  - 问题：<一句话>
  - 修复：<可直接采用的写法/代码片段>
```

存量代码只汇总 P0；P1 一句话带过（如「另有 12 处命名/格式问题，属存量未强制」）；P2 默认不提。P0 修复必须引用规约编号（如 `01-(七)4【强制】`）。

规则命中时，可先读资源目录 `examples/` 下的 before/after 示例（线程池、日期、SQL、空 catch、Vue key、XSS），再写修复代码。

## 七、项目级覆盖

按以下优先级合并，团队规范优先于手册，但**不能用来关闭 P0**：

1. 项目根 `AGENTS.md` 中与 Java 相关的约定；
2. 项目根 `.dsh/java-standards.md`（可由 `alibaba-java/project-template.md` 复制填写）；
3. 本技能与手册原文（基线）。

若项目规范与 P0 冲突，按项目规范执行但在输出末尾提示风险；若项目规范要求「关闭全部检查」，保留一行 P0 风险提示，是否处理由用户决定。

项目接入片段：`AGENTS.snippet.md`（追加到项目根 `AGENTS.md`，让 agent 进入项目就知道加载哪些技能、跑什么扫描）。

## 八、与全栈技能的关系

- 单体开发：`fullstack-monolith-dev` 的「技术栈 / 分层 / 权限 / 门禁」优先，Java 写法遵循本技能。
- 微服务开发：`fullstack-microservice-dev` 的「版本三元组 / 模块结构 / Feign / 网关」优先，Java 写法遵循本技能。
- 排查：`fullstack-monolith-debug` / `fullstack-microservice-debug` 负责定位流程；修复代码时同样受 P0 约束。

## 九、来源与许可

- 条文：《Java 开发手册（黄山版）》v1.7.1，2022.02.03，版权归阿里巴巴集团；本技能仅做工程封装与执行策略整理。
- 封装参考：[Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide)（MIT）。
- 资源目录中的章节文件为原文快照，随包仅作按需查阅。
