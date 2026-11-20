# Spring Security 实践

> 按项目 Spring Security 版本选择写法：Boot 3 / Spring Security 6 用 `SecurityFilterChain` + `authorizeHttpRequests`；Boot 2 / Security 5 用 `WebSecurityConfigurerAdapter`（已废弃，存量项目按现状）或等价配置。不要为了套示例升级。

## 1. 先定安全模型

- **认证**：谁在访问？session、JWT、OAuth2/OIDC、API Key、双向 TLS（按项目）。
- **授权**：能做什么？角色、权限、资源归属（RBAC/ABAC/所有权）。
- **边界**：哪些端点公开？哪些要登录？哪些要管理员？哪些只能本人？
- **数据**：敏感字段加密/脱敏；密钥/证书放环境变量/密钥管理。
- **审计**：登录、失败、权限拒绝、敏感操作有日志（不记录密码/token）。

## 2. Filter Chain

- 显式声明 `SecurityFilterChain`（或项目版本等价方式），不要依赖默认全开/全关。
- 默认拒绝：未匹配的请求 `denyAll` 或要求认证；公开端点用白名单明确列出。
- 关闭不需要的机制（formLogin/httpBasic/session 按项目），不要“全开省事”。
- CSRF：浏览器会话应用默认开启；纯 token/无状态 API 明确关闭并说明原因。
- CORS：用 `CorsConfigurationSource` 白名单，不用 `*` + credentials。
- 安全头：HSTS、X-Content-Type-Options、frame options、CSP（按项目）。
- 异常处理：401 未认证、403 无权限分开；不要都返回 500 或 200。

## 3. 方法级鉴权

- `@PreAuthorize` / `@PostAuthorize` / `@Secured` 按项目版本选择；复杂权限用自定义 `PermissionEvaluator` 或服务层校验。
- 不要只在前端隐藏按钮；后端必须校验每个入口。
- 资源归属校验（“只能看自己的订单”）放在服务层/查询条件，不只靠角色。
- 批量接口逐条校验权限；不要因为列表页过滤了就信任单条接口。

## 4. 密码 / 会话 / Token

- 密码用 `PasswordEncoder`（BCrypt/Argon2 等，按项目），不自己写哈希/加盐。
- 禁止明文/可逆加密存密码；禁止日志打印密码。
- Session：固定会话攻击防护、并发会话策略、超时、注销失效；集群用共享 session。
- JWT：校验签名/过期/受众/签发者；不要只解析不验证；密钥轮换/泄露处理。
- Token 存前端：优先 HttpOnly Cookie 或受控存储；避免 localStorage 长期存高权限 token（按威胁模型）。
- 登录限流/防爆破、验证码/锁定策略按风险；错误信息不泄露“用户是否存在”。

## 5. 输入与输出

- 参数绑定白名单；禁止 mass assignment（只绑定允许字段）。
- 文件上传：类型/大小/内容校验，存储与执行分离，防路径穿越。
- 反序列化：不反序列化不可信类型；禁用危险 gadget。
- 输出转义：HTML/JS/SQL/日志按上下文转义；SQL 参数绑定。
- SSRF：外部 URL 白名单/禁止内网地址；不要直接把用户 URL 传给 HTTP 客户端。

## 6. 测试

- 认证：未登录 401、错误凭证失败、过期 token 失败。
- 授权：普通用户访问管理员端点 403；资源归属越权 403/404。
- CSRF/CORS：按配置验证；不要只测 happy path。
- 安全头/错误响应：不泄露堆栈/内部路径。
- 用 `@WebMvcTest` + Security 测试切片或完整上下文 smoke；真实过滤器链，不要只 mock 注解。
- 依赖漏洞扫描/密钥扫描进 CI（按项目工具）。

## 7. 常见反模式

- 只在前端做权限判断。
- `permitAll()` 图省事，或 `anyRequest().permitAll()`。
- 关闭 CSRF 却不说明是无状态 API。
- CORS `*` + `allowCredentials(true)`。
- JWT 不验签/不验过期，或把敏感信息放 JWT。
- 资源接口只查 ID 不查归属。
- 异常全返回 200/500，客户端无法区分 401/403。
- 把密码/token/身份证写日志。
- 用 `WebSecurityConfigurerAdapter` 新项目（已废弃，按项目版本迁移）。

## 8. 自检

- [ ] 认证/授权模型与端点白名单明确，默认拒绝。
- [ ] 401/403 语义正确；资源归属逐条校验。
- [ ] 密码编码、会话/token、CSRF/CORS/安全头按项目配置。
- [ ] 输入/上传/SSRF/反序列化有边界。
- [ ] 安全测试覆盖未登录/越权/过期/CSRF；CI 有依赖/密钥扫描。
- [ ] 日志/响应不泄露敏感信息。
