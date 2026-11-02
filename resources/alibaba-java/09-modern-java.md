# JDK 17 / 21 现代 Java 补充（与手册冲突裁决）

> 手册《Java 开发手册（黄山版）》发布于 2022 年，基线是 JDK 8 习惯。本文件只补 **JDK 17/21 + Spring Boot 3** 下需要重新裁决的写法；不是替代手册，也不放松 P0。
> 冲突时按本文件「裁决表」执行；本文件没写的，仍以手册与技能正文为准。

## 一、裁决表（先看这张）

| 主题 | 手册/旧习惯 | JDK 21 做法 | 裁决 |
|---|---|---|---|
| 线程池 | 必须 `ThreadPoolExecutor`，禁 `Executors` 工厂 | 虚拟线程可用 `Executors.newVirtualThreadPerTaskExecutor()` | **CPU 密集/有界资源仍用 `ThreadPoolExecutor`**；IO 密集可用虚拟线程，但必须加并发上限与超时，见第四节 |
| 日期时间 | 禁 `SimpleDateFormat` / `java.util.Date` | `java.time` | 不变，继续 P0 |
| DTO | 手写 getter/setter/构造 | `record` | 只用于**只读** DTO/查询结果；MyBatis DO、需要无参构造/可变字段的实体不用 record |
| 局部变量 | 显式类型 | `var` | 只在类型从右侧一眼可见时用；字段、参数、返回值不用 |
| 类型判断 | `instanceof` + 强转 | pattern matching / switch pattern | 新代码优先 pattern matching；不要为了炫技重写存量 |
| 接口多实现 | 枚举/字符串分支 | sealed interface + switch | 新代码可用；switch 必须穷尽或写 default |
| 字符串拼接 SQL | `StringBuilder` | text block | text block 只解决可读性，**仍然禁 `${}` 拼接**，参数必须 `#{}` / `?` |
| 空值 | 返回 null / 抛 NPE | `Optional` | 只用于**方法返回值**；字段、参数、集合元素不用 Optional；禁止 `.get()` 裸取 |
| 异步 | 裸 `new Thread` / 线程池 | `CompletableFuture` / 虚拟线程 | 必须显式执行器、超时、异常处理；禁止在请求线程里无界 `join()` |
| 异常 | `e.printStackTrace()` | 日志框架 | 不变，P0 |

## 二、records

适合：

- 只读的查询结果、内部 DTO、值对象；
- 需要 `equals/hashCode/toString` 的简单载体；
- 与 Jackson 配合的 API 响应（Jackson 2.12+ 支持 record）。

不适合：

- MyBatis-Plus 的 DO/Entity：需要无参构造、可变字段、`@TableField` 等；
- 需要继承的类；
- 字段含敏感信息且会打日志的对象——record 的 `toString()` 会自动输出全部字段，必须重写 `toString()` 脱敏。

```java
public record UserSummary(Long id, String name) {
    public UserSummary {
        Objects.requireNonNull(id, "id 不能为空");
        name = name == null ? "" : name.strip();
    }
}
```

注意：

- record 是浅不可变；包含 `List` 字段时，构造器里做 `List.copyOf(...)`；
- 校验注解放在 record 组件上（`@NotNull Long id`），Spring Validation 支持；
- 不要在 record 里塞业务逻辑，复杂行为放 Service。

## 三、var、pattern matching、sealed

### var

```java
var users = userMapper.selectList(wrapper);          // 右侧类型清晰，OK
var result = service.handle(request);                // 不推荐：看不出返回类型
```

- 只在局部变量使用；字段、方法参数、返回值不用。
- 不要用 `var` 接匿名类/lambda 目标类型不明确的情况。

### pattern matching

```java
if (event instanceof OrderCreatedEvent created) {
    handle(created.orderId());
}
```

```java
sealed interface PaymentResult permits Paid, Failed, Pending {}
record Paid(String tradeNo) implements PaymentResult {}
record Failed(String code, String message) implements PaymentResult {}
record Pending(String tradeNo) implements PaymentResult {}

String describe(PaymentResult result) {
    return switch (result) {
        case Paid paid -> "paid:" + paid.tradeNo();
        case Failed failed -> "failed:" + failed.code();
        case Pending pending -> "pending:" + pending.tradeNo();
    };
}
```

- switch pattern 必须穷尽（sealed 可让编译器检查）；有 default 时写清楚为什么。
- 不要在 `switch` 里做重 IO；保持分支短小。

## 四、虚拟线程（最容易和 P0 冲突）

手册的线程池红线针对的是**平台线程 + Executors 工厂的无界队列**，不是虚拟线程。裁决如下：

| 场景 | 选择 |
|---|---|
| CPU 密集、计算任务 | `ThreadPoolExecutor`（显式核心/最大/队列/拒绝策略），**不要**用虚拟线程 |
| IO 密集、大量并发短任务 | 虚拟线程；必须限制并发（`Semaphore`）并设置超时 |
| 需要线程池隔离/优先级/队列治理 | 平台线程池 |
| Spring MVC 请求线程 | 可开 `spring.threads.virtual.enabled=true`，但要压测；不要假设一定更快 |

```java
// IO 密集：虚拟线程 + 并发上限 + 超时
private static final int MAX_CONCURRENCY = 200;
private final Semaphore permits = new Semaphore(MAX_CONCURRENCY);
private final ExecutorService ioExecutor = Executors.newVirtualThreadPerTaskExecutor();

CompletableFuture<String> fetch(String url) {
    return CompletableFuture.supplyAsync(() -> {
        boolean acquired = false;
        try {
            acquired = permits.tryAcquire(1, TimeUnit.SECONDS);
            if (!acquired) throw new RejectedExecutionException("并发已满");
            return httpGet(url, Duration.ofSeconds(3));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("被中断", e);
        } finally {
            if (acquired) permits.release();
        }
    }, ioExecutor);
}
```

注意：

- 虚拟线程**不要池化**；`newVirtualThreadPerTaskExecutor()` 每个任务新建虚拟线程，池化没有意义。
- JDK 21 中 `synchronized` 阻塞会 pin 住载体线程；IO 阻塞优先 `ReentrantLock` / `Semaphore`，并压测验证。
- 虚拟线程不是无限并发许可证；数据库连接池、下游 QPS 仍是瓶颈，必须限流。
- 项目若用 `@Async`，确认执行器是虚拟线程执行器并配置 `TaskExecutor`，不要依赖默认 `SimpleAsyncTaskExecutor`。

## 五、Optional

```java
public Optional<User> findById(Long id) {
    return Optional.ofNullable(mapper.selectById(id));
}

User user = service.findById(id)
        .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "用户不存在"));
```

- 只用于返回值；不要做字段、方法参数、集合元素。
- 禁止 `optional.get()`；用 `orElseThrow` / `map` / `ifPresent`。
- 不要用 `Optional` 包集合；集合空就返回空集合。

## 六、CompletableFuture

```java
CompletableFuture<OrderVO> future = CompletableFuture
        .supplyAsync(() -> orderService.load(id), ioExecutor)
        .orTimeout(3, TimeUnit.SECONDS)
        .exceptionally(ex -> {
            log.error("加载订单失败, id={}", id, ex);
            throw new CompletionException(ex);
        });
```

- 必须传显式执行器；默认 `ForkJoinPool.commonPool()` 不适合阻塞 IO。
- 必须处理异常（`exceptionally` / `handle` / `whenComplete`），不能只 `join()`。
- 请求线程里不要无超时 `join()`；用 `orTimeout` / `completeOnTimeout`。
- 多个 future 组合时，注意 `allOf` 的异常传播。

## 七、Spring Boot 3 / Jakarta

- `javax.*` → `jakarta.*`（Servlet、Validation、Persistence）。
- Spring Security 6：`WebSecurityConfigurerAdapter` 已移除，用 `SecurityFilterChain` Bean。
- `RestTemplate` 仍可用，但新项目优先 `RestClient` / `WebClient`；无论哪个都要设连接/读超时。
- 配置属性用 `@ConfigurationProperties`，不要散落 `@Value`。
- 可观测性：Micrometer + Actuator；日志保留 traceId。

## 八、已废弃/禁止

- `finalize()`、`Thread.stop()`、`Thread.suspend()/resume()`：禁止。
- `SecurityManager`：JDK 17 起废弃，不要在新代码使用。
- `java.util.Date` / `Calendar` / `SimpleDateFormat`：P0 禁止。
- `sun.*` / 内部 API：禁止。
- `e.printStackTrace()`、`System.out`：P0/P1 禁止（见技能正文）。

## 九、交付自检（增量）

- [ ] record 只用于只读载体，DO/Entity 没有改成 record。
- [ ] `var` 只出现在局部变量，且类型可读。
- [ ] 虚拟线程任务有并发上限与超时；CPU 密集仍用 `ThreadPoolExecutor`。
- [ ] `CompletableFuture` 有显式执行器、超时、异常处理。
- [ ] `Optional` 只做返回值，没有 `.get()`。
- [ ] text block 里的 SQL 仍是 `#{}` / `?`，没有 `${}`。
- [ ] Spring Boot 3 使用 `jakarta.*`，安全配置用 `SecurityFilterChain`。

## 十、来源

- 语言特性：OpenJDK 17/21 官方文档（records、pattern matching、virtual threads）。
- 工程约束：本插件 `alibaba-java-standards` 的 P0 红线与《Java 开发手册（黄山版）》。
- 本文件是补充，不是阿里巴巴官方条文；与手册冲突时按第一节裁决表执行。
