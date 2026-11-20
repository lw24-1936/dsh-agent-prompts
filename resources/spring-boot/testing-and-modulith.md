# 测试、Testcontainers、ArchUnit 与 Spring Modulith

## 1. 测试分层：互补，不是二选一

| 层 | 测什么 | 是否启动 Spring | 备注 |
|---|---|---|---|
| 单元测试 | 纯业务/算法/领域逻辑 | 否 | 快，但不能证明映射/序列化/安全配置 |
| 切片测试 | Controller、JSON、Repository、客户端 | 是，部分上下文 | 主力层；启动真实框架但只装载相关组件 |
| 冒烟测试 | 整个上下文能否启动 | 是，完整上下文 | 至少一个；不要把所有测试都写成全上下文 |
| 端到端 | 真实端口/真实请求/关键链路 | 是 | 少量；覆盖冒烟之外的装配与协议 |

推荐分布：大部分切片测试 + 少量单元测试 + 至少一个完整上下文冒烟 + 至少一个请求级 E2E。不要用“单元测试全绿”证明应用可用。

## 2. 切片测试

- Web：`@WebMvcTest`（或按项目版本等价切片）+ MockMvc/`RestTestClient`；覆盖路由、JSON、校验、错误响应。
- JSON：`@JsonTest`；覆盖序列化/反序列化、日期/枚举/值对象格式。
- 持久化：`@DataJpaTest` 或自定义切片 + 真实数据库；覆盖 JPQL、映射、约束、事务。
- 外部客户端：`@RestClientTest` 或 WireMock；覆盖超时、错误体、重试边界。
- 全上下文只留给冒烟/E2E；用 `@SpringBootTest(classes = …)` 缩小切片上下文，减少启动成本。
- 测试类尽量包内可见；不要 `@Disabled` 掩盖失败；禁止删除断言求绿。

## 3. 数据库：真实数据库，不用 H2 冒充

- 持久化/集成测试用 Testcontainers 启动与生产同类型的数据库。
- 容器连接优先用框架的自动连接（`@ServiceConnection` 或项目版本等价机制）；没有工厂的容器再用动态属性注册映射后的 host/port。
- 不要把固定端口写死到配置；让容器映射随机端口，运行时读取。
- 静态配置（`ddl-auto`、日志级别、feature flag）放测试 properties；动态端口/凭证才放动态属性。
- 无 Docker 的本地环境可以跳过容器测试（明确标记），但 CI 必须有 Docker/Testcontainers Cloud；CI 静默跳过等于假通过。
- 测试数据：优先 SQL fixture 或通过 Service/ModuleAPI 建数据；不要直接 `JdbcTemplate` 插内部表，除非没有别的办法。
- 每个测试独立清理；不要依赖执行顺序/共享可变状态。

## 4. 上下文缓存与速度

- 相同的测试配置会复用 Spring `ApplicationContext`；切片/固定配置能显著降低启动成本。
- 避免随意加 `@DirtiesContext`、动态属性、`@MockBean` 变体导致缓存键变化。
- 数据库容器尽量整套测试复用（按项目测试框架能力），不要每个类启停一次。
- 慢测试单独分组/标签；CI 分快慢两档，但合并前必须跑必要集。

## 5. ArchUnit / 架构测试

用架构测试守住“文档写了但代码会漂移”的规则：

- 包依赖方向：Controller 不依赖 Controller；Service 不依赖 Controller；Repository 不依赖 Service。
- 分层注解/命名：Controller 以 `Controller` 结尾且只标注 `@RestController`；Service 以 `Service` 结尾；Repository 以 `Repository` 结尾。
- 禁止字段注入（优先构造器注入）。
- 禁止使用已废弃 API、泛型异常、循环依赖。
- 日志器命名/修饰符统一；工具类 final + 私有构造。
- 测试类包内可见、禁止 `@Disabled`。
- 规则从项目真实包名/约定出发；不要复制一套与本项目无关的规则。
- ArchUnit/Taikai 等工具按项目版本选择；规则失败要修代码或说明豁免，不要静默放宽。

## 6. Spring Modulith（模块化单体）

适用：业务边界多、希望模块化但不想拆微服务。

- 用 `ApplicationModules.of(Application.class).verify()` 验证模块边界与依赖。
- 模块内部实现包内可见；跨模块只暴露 `{Module}API` 或 `NamedInterface`。
- `shared` 可声明为 OPEN 模块；不要把业务逻辑塞进 shared。
- 模块间异步通信用领域事件；持久化事件/重试/完成模式按项目基础设施配置。
- 生成模块文档（Documenter）作为架构证据；文档与代码一起更新。
- 发现循环依赖先修边界，不要用 `@Lazy`/事件掩盖设计问题。

## 7. CI 门禁

- 编译、测试编译、单元/切片测试、至少一个冒烟/E2E、架构测试、静态检查。
- 报告通过/失败/跳过/未运行；测试通过不等于已部署。
- 数据库/中间件容器在 CI 真实运行；无 Docker 时明确失败或跳过并记录，不伪装成功。
- 构建产物可重复；测试不依赖本机缓存/未提交文件。

## 8. 快速自检

- [ ] 有单元、切片、冒烟/请求级 E2E，且分层理由清楚。
- [ ] 持久化测试用真实数据库，不用 H2 冒充。
- [ ] 容器连接没有写死端口/凭证，CI 真实运行。
- [ ] 架构测试覆盖依赖方向/命名/字段注入等关键规则。
- [ ] Modulith 项目有模块验证与边界证据。
- [ ] 没有 `@Disabled`/删断言/静默跳过掩盖失败。
