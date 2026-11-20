# 架构与工作原理

## 1. 插件形态

`dsh-agent-prompts` 是 **DeepSeek Harness 的 Host-only Cordis 插件**：

- 没有 client 半，不占侧边栏、不注入页面。
- `inject: ['skills']` 是硬依赖；`skills` 服务不存在时插件不激活。
- `apply(ctx, config)` 在激活时读取 `skills/*.md` 并注册。
- 返回组合 disposer；卸载时注销全部技能。
- 运行时零依赖、不访问网络。

## 2. 注册契约

```js
ctx.skills.register({
  name,
  description,   // 触发场景，≤500 字符
  whenToUse,     // 补充说明
  content,       // skills/*.md 正文
  source: 'bundled',
  invocation: { modelInvocable: true, userInvocable: true },
  resourceBase: { kind: 'directory', path: '<package>/resources' },
  metadata: { pack: 'dsh-agent-prompts', file, kind, resources: 'resources' },
});
```

## 3. 渐进披露

```
skills/<name>.md           # 触发/决策表/核心规则/资源索引/自检
resources/<domain>/        # 细节，按需读取
resources/templates/       # PROCESS/REQUIREMENTS/DESIGN/REVIEW/DELIVERY
resources/scan-redlines.mjs
resources/frontend-design/check-design.mjs
```

技能正文不复制长文；模型命中具体主题时按资源索引读对应文件。

## 4. 资源目录

| 目录 | 内容 |
|---|---|
| `alibaba-java/` | 阿里 Java 手册拆分章节 + 现代 Java + 模板 |
| `f2e-spec/` | F2E 原始快照 + 工具链 |
| `spring-boot/` | 架构/API/JPA、测试/Modulith、Security、构建/本地、反模式 |
| `vue3/` | 响应式/组件、组件模式、Router/Pinia/VueUse、调试、反模式 |
| `frontend-design/` | brief/方向、评审、浏览器验收、反 AI 味、设计检查器 |
| `engineering/` | 证据/审查/交付/简化 |
| `examples/` | before/after 示例 |
| `reference/` | 历史原文（版本锁定不生效） |
| `templates/` | 交付模板 |

## 5. 配置

```yaml
dsh-agent-prompts:
  only: [spring-boot-engineering, vue3-engineering]
  # 或 disabled: [fullstack-microservice-debug]
```

- `only` / `disabled` 必须是字符串数组；非法类型忽略并 warn；重复名去重；未知名 warn。
- `only` 优先于 `disabled`。
- 不传时注册全部 10 个技能。

## 6. 版本策略

- 技术版本从项目 `pom.xml` / `build.gradle` / `package.json` / 父 POM / BOM 读取。
- 技能只给条件分支（如 Boot 2/3/4、Vue 2/3、ESLint 8/9），不要求升级。
- 本包自身的 Node 下限见 `package.json` `engines.node`；DSH 宿主可能要求更高。

## 7. 可执行门禁

| 门禁 | 命令 | 说明 |
|---|---|---|
| Java/前端 P0 | `node <resources>/scan-redlines.mjs --profile java --changed-only --root .` | 启发式红线；正式门禁仍用 P3C/PMD/ESLint |
| 设计反模式 | `node <resources>/frontend-design/check-design.mjs --root . --fail-on P1` | 保守静态检查；不替代浏览器验收 |
| 本包自检 | `npm run verify` | 注册/内容/扫描器/设计检查/tarball |

## 8. 兼容性

- 需要支持 `ctx.skills.register` 与 `resourceBase` 的 DSH 版本。
- Node.js ≥ 20（本包自身；扫描器/检查器使用 Node 内置 API）。
- Windows / macOS / Linux；`--changed-only` 需要 git。

## 9. 发布

1. 语义化版本 + `CHANGELOG.md`；
2. `npm run verify` + `npm pack --dry-run`；
3. 提交、tag、推 GitHub；
4. CI 与 Release workflow 绿；
5. 安装到 desktop profile 验证技能目录；
6. 需要时更新 `PUBLISH.md` 与市场条目。
