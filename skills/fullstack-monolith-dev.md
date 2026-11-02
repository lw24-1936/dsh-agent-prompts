# 全栈开发规范（单体版）

> 加载本规范后，它就是本项目的硬约束。与用户指令冲突时先提问，不要自行放宽。
>
> **配套标准**：Java 写法遵循 `alibaba-java-standards`（P0 红线 + 章节路由），前端写法遵循 `f2e-spec`（ESLint + Vue 3 + 安全分级）。本文件管架构、流程、环境与门禁，不重复抄写编码条文。

## 一、开工前置（三件缺一不可）

1. **中间件连接表已填**：MySQL 必填；Redis / ES / RabbitMQ / 向量库按需。未填就**停下来要**，不得编造默认值。
2. **UI 库组合已确认**：Agent 主动给出「拟用组合 + 每个库的职责 + 理由」，用户确认后写进 `DESIGN.md §3`。未确认不开工。
3. **需求无歧义**：接口的请求/响应格式、数据字段、角色与权限划分都要明确。

连接信息必须走环境变量，禁止硬编码，禁止提交真实值：

```
MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
REDIS_HOST / REDIS_PORT / REDIS_USER / REDIS_PASSWORD / REDIS_DATABASE
ES_HOST / ES_PORT / ES_USER / ES_PASSWORD
RABBITMQ_HOST / RABBITMQ_PORT / RABBITMQ_USER / RABBITMQ_PASSWORD / RABBITMQ_VHOST
```

`.gitignore` 必须含：`.env.local`、`.env.*.local`、`application-local.yml`、`application-*.local.yml`。

## 二、技术栈（硬绑定，禁改）

| 层 | 选型 | 关键要求 |
|---|---|---|
| 前端框架 | Vue 3 | `<script setup>` 组合式 API |
| 前端语言 | TypeScript | 必须，不用纯 JS |
| 构建 | Vite | 四套环境 |
| 路由 | Vue Router 4 | — |
| 状态 | Pinia + persistedstate | **只持久化 token / 用户 / 权限** |
| 请求 | Axios | 统一封装，见「请求层」 |
| 包管理 | pnpm | 项目已有 npm/yarn 则随项目 |
| 后端框架 | Spring Boot 3 | JDK **21** |
| ORM | MyBatis-Plus | `mybatis-plus-spring-boot3-starter` |
| 连接池 | HikariCP | 参数显式配置 |
| 权限 | Sa-Token + RBAC | 见「权限」 |
| 对象转换 | MapStruct | DTO/Entity/VO 之间 |
| 密码 | BCrypt | 强度 10，库里存密文 |
| 数据库 | MySQL 8 | utf8mb4 / utf8mb4_general_ci / InnoDB |
| 接口文档 | SpringDoc OpenAPI | pre/pro 关闭 |
| 健康检查 | Actuator | 只暴露 health / info |

**禁止**：换框架；引入 vue-i18n（文案中文硬编码）；新增第 5 套环境；同一定位引入两个通用 UI 库；一个主 UI 库之外再引整库；全量引入组件库。

`pom.xml` 必须声明 `java.version=21`；Maven 资源过滤分隔符用 `@` 且 `useDefaultDelimiters=false`；`application.yml` 用 `@profiles.active@`。

## 三、前端约定

**四套环境**：`.env`、`.env.development`、`.env.test`、`.env.pre`、`.env.production`；
变量 `VITE_APP_ENV`、`VITE_APP_TITLE`、`VITE_API_BASE_URL`、`VITE_UPLOAD_URL`；
读法统一 `import.meta.env.VITE_XXX`，禁止硬编码环境判断。

**环境映射（硬性）**：前端 dev→后端 dev，test→test，pre→pre，pro→pro。

**`package.json` 脚本**：

```json
{
  "dev": "vite --mode development",
  "build:test": "vue-tsc --noEmit && vite build --mode test",
  "build:pre": "vue-tsc --noEmit && vite build --mode pre",
  "build:pro": "vue-tsc --noEmit && vite build --mode production"
}
```

`vite.config.ts` 用 `loadEnv`；`outDir` 按环境分 `dist/test`、`dist/pre`、`dist/pro`；proxy 只给 dev 用。

**请求层**（一处实现，页面不重复写）：

- 请求拦截：注入 token。
- 响应拦截：`401` 清 token 跳登录；`403` 提示无权限；其他业务错误统一 `message.error`。
- 统一返回体 `Result<T>`，`code` 用 200 / 400 / 401 / 403 / 404 / 405 / 500。
- **Long 序列化为 String**；时间统一格式化字符串；枚举向前端传 `code`。

**页面文件内部顺序**：`<script setup>` → 模板 → 样式；导入按「框架 / 第三方 / 本地」分组。

## 四、后端约定

**分层**：Controller（只做参数接收与返回）→ Service（业务与事务）→ Mapper。Controller 不写业务判断。

**统一返回与异常**：`Result<T>` + `BusinessException` + `GlobalExceptionHandler`。
异常日志：`BusinessException` 用 `warn`，其他用 `error` 并带堆栈。

**日志**：入参、出参、`return` 前都要有；禁止 `System.out.println` 与 `printStackTrace()`；敏感字段脱敏（注解 + 自定义 Serializer）；配置滚动策略。

**分页**：请求 `page` / `size`，响应 `total` / `records`；MyBatis-Plus 分页插件显式配置。

**逻辑删除**：`@TableLogic`。

**配置类**：统一 `@ConfigurationProperties(prefix = "xxx")`，不散落 `@Value`。

**跨域**：dev/test 放开，pre/pro 走白名单。

**SQL 脚本**：放 `docs/sql/`，`01_schema.sql` + `02_init_data.sql`，含 RBAC 初始数据。

## 五、权限（RBAC）

五张核心表：用户、角色、权限、用户角色、角色权限。

- **每个接口**都要有 `@SaCheckPermission` 或显式 `@SaIgnore`。
- 禁止在业务代码里硬编码权限判断（如 `if (role.equals("admin"))`）。
- 权限标识格式：`模块:动作`，例如 `user:query`、`order:export`。
- Token 存 localStorage；续期策略要配置并写进 `DESIGN.md`。

## 六、文档（两份常驻 + 完成后 README）

| 文档 | 谁写 | 内容 |
|---|---|---|
| `docs/DEV.md` | 每次改动**追加** | 变更记录（时间 / 改了什么 / 为什么）+ 问题排查记录 |
| `docs/DESIGN.md` | 设计变更时更新 | 概述 / 需求(FR-x, NFR-x) / 总体设计 / 数据设计 / 接口设计 / 关键决策 / 截图 / 版本历史 |
| `README.md` | **项目确认完成后**才写 | 简介 / 截图 / 技术栈 / 目录 / 环境 / 部署 / 使用 / 文档链接 / 许可证 |

规则：**改代码必改文档，文档即事实**（路径、函数名、字段名必须与代码一致）。文档片段只输出变化部分，用 `<!-- 替换 §x.x -->` 标注。README 不写真实密码，只列环境变量名。

## 七、工作流程（按序，不跳步）

1. **需求确认**：复述理解 → 列待澄清问题 → 给 UI 组合 → 确认中间件范围。
2. **方案简报（≤10 行）**：文件清单、每个文件职责、依赖。
3. **交付**：`DEV.md` 变更 → `DESIGN.md` 变更 → 代码（逐文件、标路径）。
4. **验证**：见下方门禁。
5. **完成后**：生成 `README.md`。

**输出格式固定**：`【理解确认】`→`【待澄清问题】`→`【UI 组合推荐】`→`【文件清单】`→`【开发文档变更】`→`【设计文档变更】`→`【代码】`→`【验证步骤】`。

## 八、提交前门禁（十条，全过才交付）

1. 前端 `pnpm build:test` / `build:pre` / `build:pro` 三条都能过，`dist/*` 产物存在。
2. 后端 `mvn clean package -P<profile>` 能过，打包产物里 `spring.profiles.active` 已替换成目标环境。
3. `docs/sql` 两个脚本能在空库上跑通；字符集 utf8mb4 / utf8mb4_general_ci。
4. 所有接口都有鉴权注解；无权限账号访问返回 403。
5. 日志四要素齐全，且无 `System.out.println` / `printStackTrace`。
6. 连接信息全部来自环境变量；`.gitignore` 生效；日志与接口返回里看不到密码。
7. `/actuator/health` 返回 UP；接口文档 dev 可访问、pre/pro 已关闭。
8. `DEV.md` 与 `DESIGN.md` 已同步本次改动。
9. **Java P0 扫描**：`node "<资源目录>/scan-redlines.mjs" --profile java --root .` 退出码 0；再人工复核线程池 / 日期时间 / `${}` 拼接 / 无 where 的 update·delete / 空 catch / 集合 return null / ThreadLocal 未 remove。
10. **前端质量门禁**：`pnpm eslint . --max-warnings=0` 与 `vue-tsc --noEmit`（或项目约定的 `tsc`）通过；F2E P0 扫描退出码 0，或逐条说明豁免理由。

## 九、编码规约（与标准技能联动）

- **Java**：加载 `alibaba-java-standards`。P0 红线（新代码直接合规、被改到的存量代码发现即修复、不可口头豁免）在该技能正文；条文按需读 `alibaba-java/` 下的 01a–01h 与 09 章节。项目团队约定放 `.dsh/java-standards.md`（可从 `alibaba-java/project-template.md` 复制）。
- **前端**：加载 `f2e-spec`。至少遵守：`const`/`let`、`===`、Hooks 规则、`v-for` 稳定 key、`v-if` 不与 `v-for` 同元素、`v-html` / `dangerouslySetInnerHTML` 必须消毒、`target="_blank"` 带 `noopener`。
- **冲突裁决**：本文件的架构/技术栈/权限/门禁是项目硬约束；编码写法按两个标准技能。两者冲突时先问用户，不自行放宽 P0 或技术栈。
- **原始文档**：`reference/fullstack-single.original.md`（完整保留，供对照）。

## 十、必须停下来提问的情况

- UI 库组合未确认 / 中间件范围未确认
- 是否要接口幂等、是否用 Docker 未确认
- 需求涉及第三方服务、数据模型字段、接口格式、权限划分但没给定义
- 需求有多种合理解释且实现差异大
- 要改现有代码但不了解其上下文
- 用户要求与上述硬约束冲突
- 两份常驻文档不存在且用户未授权创建

**提问一次问清，不要边做边问。**
