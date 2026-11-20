# API、Service 与 JPA

## 1. 包结构：按业务域，不按技术层

推荐：

```
com.example.app/
├── Application
├── shared/                 # 跨模块通用：错误、事件、工具、基础类型
│   └── package-info.java   # 可声明 OPEN 模块
├── users/
│   ├── config/             # 模块内配置
│   ├── domain/
│   │   ├── models/         # 值对象、命令、查询、结果
│   │   ├── exceptions/     # 领域异常
│   │   ├── entities/       # JPA 实体（包内可见优先）
│   │   ├── repositories/   # 只给聚合根
│   │   ├── mappers/        # Entity/领域模型/DTO 转换
│   │   └── services/       # 业务编排 + 事务边界
│   ├── api/                # Controller + 请求/响应 DTO
│   └── UsersAPI.java       # 模块对外的唯一公开门面
├── catalog/
└── orders/
```

原则：

- 一个模块一个业务能力/限界上下文；不要 `controller/`、`service/`、`repository/` 全局平铺。
- 模块内部实现尽量包内可见；跨模块只走 `{Module}API` 或领域事件。
- 模块之间不要循环依赖；用架构测试守住。
- 命名：`*Entity`、`*Cmd`、`*Query`、`*Result`、`*Request`、`*Response`、`*Repository`、`*Service`、`*API`。
- 不为了“分层”制造空层；简单 CRUD 不必强上 DDD 战术模式。

## 2. REST API：Controller 只做协议适配

Controller 职责：路由、反序列化、校验、调用 Service、组装 HTTP 响应。业务判断、事务、SQL 不进 Controller。

```java
@RestController
@RequestMapping("/api/users")
class UserController {
    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResult result = userService.create(request.toCmd());
        return ResponseEntity.created(URI.create("/api/users/" + result.id()))
                .body(UserResponse.from(result));
    }
}
```

检查点：

- 请求/响应 DTO 与 Entity 分离；不要直接返回 JPA Entity（懒加载、循环引用、泄露字段）。
- 路径/查询参数可绑定值对象时用 `Converter<String, ValueObject>`；请求体中的值对象用 JSON creator/value 注解（按项目 Jackson 版本选择写法）。
- 校验用 `@Valid` + Bean Validation；业务规则仍在领域/Service，不把全部规则塞注解。
- 状态码：创建 201 + Location；无内容 204；校验 400；未认证 401；无权限 403；不存在 404；冲突 409；其他 500。
- 错误响应统一用 RFC 7807 `ProblemDetail`（或项目既有统一返回体），由 `@RestControllerAdvice` 集中处理；生产隐藏堆栈和内部细节。
- 分页参数有上限；排序字段用白名单；不把用户输入直接拼进 JPQL/SQL。
- 写接口考虑幂等（幂等键/唯一约束/状态机），不要只靠前端防重复提交。
- 时间用明确时区/`Instant`；金额用 `BigDecimal` 并明确精度；枚举对外用稳定字符串。

## 3. Service：一个方法一个工作单元

- 写操作 `@Transactional`；只读操作 `@Transactional(readOnly = true)`。
- 输入用 `Command`/`Query`，输出用 `Result`/ViewModel；不要把 Controller DTO 传进 Service 深层。
- 事务边界在 Service，不在 Controller；不要在事务里做远程调用/发消息等不可控长操作，必要时用事务外事件/补偿。
- 领域事件用 `ApplicationEventPublisher` 或项目事件机制；事件发布与事务提交的顺序要明确。
- Mapper 负责 Entity/领域模型/DTO 转换；不要在 Controller 里手写大段转换。
- 业务异常用领域异常表达，统一映射为 HTTP 状态；不要用 `RuntimeException("xxx")` 到处抛。
- 写操作要校验聚合不变量；并发更新用乐观锁/唯一约束/条件更新，不能只靠“先查再改”。

## 4. JPA / 持久化

- Repository 只给聚合根；不要为每个表建 Repository。
- 实体：显式表名/列名；枚举用 `@Enumerated(EnumType.STRING)`；审计字段放 `BaseEntity`；需要时用 `@Version` 乐观锁。
- 主键/值对象：按项目选择自增/序列/UUID/TSID；需要复合或业务主键时用 `@EmbeddedId`，但不要为了“DDD”给所有表加复合键。
- 值对象用 `@Embedded`/`@AttributeOverrides`；构造器校验不变量；JPA 需要无参构造时用 `protected`。
- 查询：简单派生查询可以；复杂查询用 `@Query` JPQL 或投影，不拼字符串 SQL；分页查询避免 N+1。
- `spring.jpa.open-in-view=false`（除非项目明确依赖它）；禁止在视图层触发懒加载。
- 批量写设置合理 batch size、order_inserts/order_updates；不要盲目开全局 batch。
- 迁移用 Flyway/Liquibase 或项目既有方案；不要用 `ddl-auto=update` 上生产。
- 数据库测试用真实数据库（Testcontainers），不要用 H2 冒充。

## 5. 配置与可观测性

- 配置用 `@ConfigurationProperties` 类型化绑定；敏感值走环境变量/密钥管理，不提交真实密码。
- 环境分离：`application.yml` + profile 文件；资源过滤分隔符按项目约定。
- Actuator 只暴露必要端点；生产关闭敏感端点。
- 日志：结构化、带 traceId；不打印密码/token/完整身份证/银行卡。
- 关键路径有指标/追踪；错误有可定位上下文，不只 `e.printStackTrace()`。

## 6. 快速自检

- [ ] 包按业务域组织，模块没有循环依赖。
- [ ] Controller 没有业务逻辑/事务/Repository 调用。
- [ ] 请求/响应 DTO 与 Entity 分离，校验和错误响应统一。
- [ ] Service 事务边界正确，写操作有并发/幂等考虑。
- [ ] Repository 只给聚合根，复杂查询没有 N+1/全表扫描。
- [ ] 持久化测试用真实数据库，迁移脚本可重复执行。
- [ ] 配置/密钥/日志/Actuator 符合生产要求。
