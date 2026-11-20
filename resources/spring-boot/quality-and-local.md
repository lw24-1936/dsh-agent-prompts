# 构建、本地开发与可选能力

## 1. 构建质量插件（按项目选择，不盲目加）

- 编译：`maven-compiler-plugin` 的 `release`/`source`/`target` 跟随项目 JDK；不要为了插件升级 JDK。
- 测试：Surefire 跑单元/切片，Failsafe 跑 `*IT` 集成测试；两者都进 CI。
- 覆盖率：JaCoCo 生成报告；覆盖率是信号，不是唯一门禁；不要为了数字写无断言测试。
- 格式/静态检查：Spotless/Checkstyle/PMD 等按项目已有配置；新增规则先跑存量评估，避免一次性全库格式化。
- 依赖/版本：Enforcer 或项目已有机制；升级依赖是项目决策，不在技能里硬编版本。
- 构建可重复：锁定依赖、固定插件版本、CI 不使用本机缓存假设。

## 2. 本地开发

- 数据库/中间件优先用 Docker Compose（或项目已有方案）；`spring-boot-docker-compose` 只用于开发，不用于生产。
- Compose 文件提交到仓库时不得含真实密钥；用 `.env`/环境变量，`.env` 进 `.gitignore`。
- 服务启动顺序、端口、健康检查写进 README/DEV.md；不要让新成员靠猜。
- 测试用 Testcontainers，不依赖本机已启动的数据库；本地 Compose 是便利，不是测试替身。

## 3. Taskfile / 脚本（可选）

- 项目已有 Taskfile/Makefile/脚本时复用；没有不强行引入。
- 常用任务：`build`、`test`、`it`、`format`、`run`、`compose-up`；命令与 CI 保持一致。
- 脚本不打印密钥；失败返回非零；不把破坏性命令设为默认。

## 4. Thymeleaf / 服务端模板（仅项目使用时）

- 模板输出默认转义；`th:utext` 只用于已消毒内容。
- 表单带 CSRF；错误信息不泄露内部异常/SQL。
- 模板不直接调用 Repository/Entity；通过 Controller/ViewModel。
- 静态资源版本化/缓存策略与部署环境一致。

## 5. 容器与部署

- 构建镜像用多阶段；运行用户非 root；只带运行时产物。
- 配置通过环境变量/挂载；镜像不含密钥/本地路径。
- 健康检查/就绪检查与 Actuator 对齐；日志输出到 stdout。
- 数据库迁移在启动前/独立步骤执行，避免多实例并发迁移。

## 6. 可选能力判断

| 能力 | 采用条件 | 不采用时 |
|---|---|---|
| Spring Modulith | 模块化单体、边界多、需要验证 | 普通分层即可，不硬上 |
| Docker Compose | 本地依赖多、团队统一环境 | 用项目已有本地方案 |
| Taskfile | 命令多、团队需要统一入口 | README 写清命令即可 |
| Thymeleaf | 服务端渲染/传统 Web | 前后端分离时不引入 |
| ArchUnit/Taikai | 需要守分层/命名/依赖 | 至少 code review 守住关键边界 |

版本/插件坐标以项目 POM/BOM 为准；本文不提供硬编码版本。
