# 全栈开发规范（微服务版）

> 加载本规范后，它就是本项目的硬约束。前端部分与单体版一致，本文件只强调**差异点**与微服务结构约束。
>
> **配套标准**：Java 写法遵循 `alibaba-java-standards`，前端写法遵循 `f2e-spec`。本文件管拆分、模块、网关、事务与门禁；**不锁定技术版本**。
>
> **版本原则**：先读项目父 POM / `dependencyManagement` / BOM / `package.json`，按项目现有版本执行；没有版本信息时先问用户，不要求升级，也不凭记忆写版本号。

## 一、开工前置（四件缺一不可）

1. **中间件表已填**：MySQL（每服务独立库）、Redis、Nacos、RabbitMQ、Sentinel、Seata、向量库（按需）。
2. **服务拆分清单已确认**：按业务域拆，不按技术层拆；数量与粒度由用户确认。
3. **UI 库组合已确认**。
4. **版本基线已读取**（见下），以项目 POM/BOM 为准，不在技能里写死。

## 二、版本与兼容（以项目为准）

先读父 POM、`dependencyManagement`、Spring Boot/Cloud/Alibaba 的 BOM 或 Gradle platform，再从项目现有配置提取版本：

| 组件 | 版本来源 |
|---|---|
| Spring Boot | 父 POM / `spring-boot-dependencies` |
| Spring Cloud | 父 POM / `spring-cloud-dependencies` |
| Spring Cloud Alibaba | 父 POM / `spring-cloud-alibaba-dependencies` |
| JDK | `maven.compiler.release` / `java.version` |

规则：

- 三个版本必须来自同一套官方兼容矩阵；升级前查官方文档，不凭记忆。
- 不混用不兼容版本；不擅自升降级；需要升级时先给方案、影响面与回归清单。
- 项目没有版本信息时问用户，不猜；不要把外部示例版本当成项目基线。

## 三、技术栈（版本随项目）

| 层 | 选型 |
|---|---|
| 前端 | Vue（项目版本）+ TS + Vite + Vue Router + Pinia + Axios + pnpm（与单体版一致） |
| 后端框架 | Spring Boot / JDK（项目版本）/ Maven 多模块 |
| 网关 | Spring Cloud Gateway |
| 注册 + 配置 | Spring Cloud Alibaba Nacos |
| 服务调用 | OpenFeign + Spring Cloud LoadBalancer |
| 容错 | Spring Cloud Alibaba Sentinel |
| 消息 | RabbitMQ |
| 分布式事务 | Seata |
| 数据库 | MySQL（项目版本），**每服务独立库** |
| ORM / 池 | MyBatis-Plus + HikariCP |
| 权限 | Sa-Token + RBAC |
| 转换 / 加密 | MapStruct / BCrypt（强度按项目安全规范） |
| 日志 / 追踪 | SLF4J + Logback + MDC，Micrometer Tracing + Brave |
| 文档 | SpringDoc OpenAPI，网关聚合 |
| 健康检查 | Actuator，只暴露 health / info |

前端四套环境、UI 库规则、请求层、页面顺序等要求与单体版**完全相同**。

## 四、服务拆分与命名

- **按业务域拆**。禁止 `user-controller` / `user-service` 这种按技术层拆法。
- 一个服务不得承担两个不相关业务域。
- 服务名：`<项目>-<业务域>`，全小写中划线，例如 `myproj-user`；必须与 `spring.application.name` 一致。
- 端口分配**必须写进 `DESIGN.md`**，禁止硬编码，禁止冲突：

```
网关        8080
用户服务    8001
订单服务    8002
...
```

## 五、模块结构（Maven 多模块）

```
<项目>-parent/            父 POM，只管理版本与依赖（packaging=pom）
├── <项目>-common/        工具、常量、异常、Result、traceId 工具
├── <项目>-api/           服务间契约：DTO + Feign 接口
├── <项目>-gateway/       网关
├── <项目>-auth/          认证服务（按需）
├── <项目>-user/          用户服务
└── <项目>-order/         订单服务
```

规则：

- `common` 被所有服务依赖，**禁止反向依赖业务服务**。
- `api` 只放 DTO 与 Feign 接口，**禁止放业务实现**。
- 业务服务只依赖 `common` + `api` + 自身组件。
- **禁止**跨服务依赖别人的实现模块；**禁止**循环依赖。

## 六、服务间调用（OpenFeign）

Feign 接口**必须定义在 `api` 模块**，命名 `XxxFeignClient`：

```java
@FeignClient(name = "myproj-user", path = "/api/v1/users",
             fallbackFactory = UserFeignFallbackFactory.class)
public interface UserFeignClient {
    @GetMapping("/{id}")
    Result<UserVO> getById(@PathVariable("id") Long id);
}
```

- **必须配 `fallbackFactory`**，不得裸调用。
- 禁止在 Feign 接口里写业务逻辑。
- **禁止跨服务传 Entity**，只传 DTO/VO。
- 服务间调用**必须带内部认证头**。

## 七、网关

- 路由**必须走 Nacos 配置中心**（动态路由），禁止硬编码在 `application.yml`。
- 路由 ID：`<服务名>-route`；路径：`/api/v1/<业务域>/**`。
- 必须实现三个全局过滤器：**token 校验**、**traceId 注入**（MDC + 请求头）、**限流**。
- **跨域只在网关处理**，业务服务不配 CORS。
- 网关**不承载业务逻辑**，**禁止直连数据库**。
- **禁止** `discovery.locator.enabled=true`（会把所有服务自动暴露）。

## 八、Nacos / 配置

- 命名空间按环境隔离：`dev` / `test` / `pre` / `prod`。
- 分组按项目：`DEFAULT_GROUP` 或 `<项目>_GROUP`。
- 配置优先级：Nacos > 本地 `application-<env>.yml`；本地只留启动必需项。
- 敏感配置（密码、密钥）走环境变量或 Nacos 加密，**不入 Git**。

## 九、数据与事务

- **每服务独立库，禁止跨服务直连库**。需要别人数据就调接口。
- 跨服务一致性用 **Seata**；用之前先确认事务模式（AT / TCC / SAGA）并写进 `DESIGN.md`。
- MQ 消费必须**幂等**、**手动 ack**、配**死信队列**。
- 分布式 ID 需求先问用户（可用 CosId / 雪花）。

## 十、日志与链路

- 每个请求入口生成/透传 `traceId`，写入 MDC，跨服务用请求头传递。
- 日志格式含：时间、级别、服务名、traceId、线程、类、内容。
- 禁止 `System.out.println` / `printStackTrace`。
- 敏感字段脱敏。

## 十一、权限（RBAC）

五张表 + `@SaCheckPermission` / `@SaIgnore`，与单体版一致。

网关做**统一认证**（校验 token），业务服务做**细粒度鉴权**（校验权限标识），两层都要有。

## 十二、文档（与单体版同构）

- `docs/DEV.md`：变更记录 + 问题排查记录（只追加）
- `docs/DESIGN.md`：必须额外包含**服务拆分清单、端口分配、事务模式、路由表**
- `README.md`：项目确认完成后写，技术栈要写清微服务组件版本

## 十三、工作流程

1. **需求确认**：复述 → 待澄清问题 → UI 组合 → **服务拆分清单 + 端口表**。
2. **方案简报（≤10 行）**：模块清单、每模块职责、依赖关系、启动顺序。
3. **交付**：`DEV.md` → `DESIGN.md` → 代码（逐文件标路径）。
4. **验证**：见门禁。
5. **完成后**：生成 `README.md`。

**启动顺序必须写清**：Nacos → 各业务服务 → 网关 → 前端。

## 十四、提交前门禁（十二条）

1. 父 POM 能 `mvn clean package` 全部模块通过。
2. 四套 profile 齐全，打包后 `spring.profiles.active` 已替换。
3. 所有服务能在目标环境启动并注册到 Nacos（控制台可见）。
4. 网关路由生效，`/api/v1/<域>/**` 能正确转发；未开 `discovery.locator`。
5. 每个 Feign 客户端都有 `fallbackFactory`，且降级逻辑可触发（可临时断开下游验证）。
6. traceId 能跨网关 → 服务 A → 服务 B 串起来（日志里搜同一个 traceId 能搜到全链路）。
7. 每服务连自己的库；代码里搜不到别的服务的库名。
8. 所有接口有鉴权注解；无权限返回 403。
9. `/actuator/health` 全服务 UP；接口文档网关可聚合访问，pre/pro 关闭。
10. `DEV.md` / `DESIGN.md` 已同步，`DESIGN.md` 含拆分清单与端口表。
11. **Java P0 扫描**：`node "<资源目录>/scan-redlines.mjs" --profile java --root .` 退出码 0；重点复核线程池、日期时间、SQL 拼接、无 where 的 update·delete、空 catch、集合 return null、ThreadLocal。
12. **前端质量门禁**：`eslint` + `vue-tsc --noEmit` 通过；F2E P0 扫描退出码 0，或逐条说明豁免理由。

## 十五、编码规约（与标准技能联动）

- **Java**：加载 `alibaba-java-standards`。Feign / 网关 / 事务代码同样受 P0 红线约束；Seata、Sentinel 的设计条文按需读 `alibaba-java/07-design-standards.md`。
- **前端**：加载 `f2e-spec`，与单体版相同。
- **冲突裁决**：版本以项目 POM/BOM 为准；服务拆分、模块依赖、网关规则、事务模式以本文件为准；编码写法按标准技能。冲突时先问用户。
- **原始文档**：`reference/fullstack-microservice.original.md`（历史快照，其中的版本锁定不再生效；以项目 POM/BOM 与本技能为准）。

## 十六、必须停下来提问

- 服务拆分粒度未确认
- 事务模式（Seata AT/TCC/SAGA）未确认
- 分布式 ID 方案未确认
- 是否用 Docker / K8s 未确认
- 中间件范围未确认
- 需求涉及跨服务一致性但没说明业务容忍度

**提问一次问清。**
