# Spring Boot 工程实践

> **加载场景**：写/改/review Spring Boot 应用；设计包结构、REST API、Service/事务、JPA；补测试（切片/Testcontainers/ArchUnit）；使用 Spring Modulith；排查 Spring 装配/事务/序列化问题。
>
> **版本原则**：Boot 2/3/4、Jackson 2/3、Testcontainers 1/2、`javax`/`jakarta` 的差异按项目 POM/BOM 选择；不要求升级，不凭记忆写版本号。

## 一、先读项目，再落代码

按顺序读：`pom.xml`/`build.gradle`、父 POM/BOM、`application*.yml`、包结构、现有 Controller/Service/Repository、测试目录、迁移脚本、CI。

判断：

- 项目是**分层架构**还是**按业务模块**组织？优先跟随已有结构；新项目按业务域分包。
- 是否使用 Spring Modulith / 模块化单体？有则遵守模块边界与验证。
- 事务/异常/返回体/鉴权/测试已有统一方案吗？优先复用，不另起一套。
- 数据库迁移、Testcontainers、ArchUnit、Docker Compose 是否已配置？没有就按项目条件补，不盲目加依赖。

## 二、结构：业务域优先

- 每个业务模块含 `domain`（模型/实体/仓储/服务/异常）、`api`（Controller/DTO）、`{Module}API`（对外门面）。
- 模块内部实现尽量包内可见；跨模块只走 ModuleAPI 或领域事件。
- 不按 `controller/service/repository` 全局平铺；不在 Controller 写业务逻辑。
- 不为简单 CRUD 强上 DDD 战术模式；复杂度值得才拆聚合/值对象/事件。
- 模块依赖无环；用 ArchUnit/Modulith 守住，而不是靠口头约定。

详细检查项：`spring-boot/api-and-service.md`。

## 三、REST API

- Controller 只做路由、反序列化、校验、调用 Service、HTTP 响应。
- 请求/响应 DTO 与 Entity 分离；不返回 JPA Entity。
- 值对象可绑定路径/查询参数（Converter）与请求体（按项目 JSON 库写法）。
- `@Valid` + Bean Validation；业务规则留在 Service/领域。
- 状态码语义正确；错误统一 `ProblemDetail` 或项目既有错误体；生产不泄露堆栈/SQL。
- 分页有上限、排序字段白名单、参数绑定；写接口考虑幂等/并发。
- 时间/金额/枚举/时区有明确契约。

## 四、Service 与事务

- 写 `@Transactional`，读 `@Transactional(readOnly = true)`（按项目事务实现）。
- 输入 Command/Query，输出 Result/ViewModel；Controller DTO 不深入 Service。
- 事务边界在 Service；远程调用/MQ 不放在长事务里；需要时用事务外事件/outbox/补偿。
- 领域事件与事务提交顺序明确；事件处理幂等。
- 并发更新用乐观锁/唯一约束/条件更新；不要只靠“先查再改”。
- 领域异常 + 统一映射；不到处抛 `RuntimeException("xxx")`。

## 五、JPA / 数据库

- Repository 只给聚合根；Entity 显式表/列名；枚举字符串存储；审计字段/乐观锁按需。
- 值对象可嵌入；构造器校验不变量；JPA 无参构造用 `protected`。
- 复杂查询用 JPQL/投影；避免 N+1；分页查询只取需要列。
- `open-in-view` 默认关闭（除非项目明确依赖）；不要在视图层触发懒加载。
- 迁移用 Flyway/Liquibase 或项目既有方案；生产不用 `ddl-auto=update`。
- 持久化测试用真实数据库（Testcontainers），不用 H2 冒充。

## 六、测试：分层互补

- 单元测试测纯业务；切片测试测 Controller/JSON/Repository/客户端；至少一个完整上下文冒烟 + 一个请求级 E2E。
- 切片用 `@WebMvcTest`/`@JsonTest`/`@DataJpaTest` 或项目版本等价切片；全上下文只留给冒烟/E2E。
- 持久化/集成测试用 Testcontainers 真实数据库；连接优先自动装配，动态端口/凭证用动态属性；CI 真实运行，不静默跳过。
- 测试数据优先 SQL fixture 或通过 Service/ModuleAPI 准备；不直接插内部表。
- 架构测试覆盖依赖方向/命名/字段注入/禁用 API；规则失败修代码或显式豁免。
- 不删断言、不 `@Disabled`、不为绿改测试。

详细：`spring-boot/testing-and-modulith.md`；构建/本地开发/可选能力：`spring-boot/quality-and-local.md`；反模式：`spring-boot/anti-patterns.md`。

## 七、Spring Modulith

- `ApplicationModules.of(Application.class).verify()` 验证模块边界；生成模块文档作为证据。
- `shared` 可 OPEN；业务模块内部实现包内可见；跨模块只用 NamedInterface/ModuleAPI。
- 模块间异步用领域事件；事件持久化/重试/完成模式按项目基础设施。
- 循环依赖先修边界，不用 `@Lazy`/事件掩盖设计问题。

## 八、配置 / 可观测性 / 交付

- `@ConfigurationProperties` 类型化配置；敏感值走环境变量/密钥管理。
- Actuator 只暴露必要端点；日志结构化、带 traceId、脱敏。
- 关键路径有指标/追踪；错误有上下文，不只 printStackTrace。
- 构建/测试/架构检查进 CI；数据库/中间件容器真实运行。
- 交付说明分别写实现、编译、测试、装配、外部联调、部署；不把“测试通过”说成“已上线”。

## 九、自检

- [ ] 包结构按业务域，模块无环，跨模块不直接碰 Repository/Entity。
- [ ] Controller 薄；DTO/Entity 分离；错误/状态码统一。
- [ ] Service 事务边界正确；并发/幂等有考虑。
- [ ] JPA 查询无 N+1/全表；迁移可重复；open-in-view 合理。
- [ ] 测试分层完整；持久化用真实数据库；CI 不静默跳过。
- [ ] ArchUnit/Modulith 规则通过；配置/日志/Actuator 安全。
- [ ] 没有为了套模式引入不必要的抽象/依赖。
