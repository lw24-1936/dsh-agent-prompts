# 发布与市场提交记录

## 当前状态（2026-11-03）

| 项 | 状态 | 说明 |
|---|---|---|
| 插件代码 / 文档 | ✅ 0.4.0 | 6 技能、拆分章节、扫描器 CLI、CI/测试、不锁技术版本 |
| GitHub 仓库 | ✅ 已上线 | https://github.com/lw24-1936/dsh-agent-prompts |
| GitHub topics | ✅ 已设置 | `dsh-plugin`、`deepseek-harness`、`cordis-plugin`、`skill`、`prompt`、`fullstack`、`spring-boot`、`spring-cloud`、`vue3`、`alibaba-java`、`f2e-spec`、`coding-standards`、`eslint`、`p0-redlines` |
| DSH Market 收录 | ✅ 已收录 | 条目 `lw24-1936/dsh-agent-prompts`，类型 `cordis-plugin` |
| 市场安装命令 | ⚠️ 待刷新 | 旧条目指向 npm 包 `dsh-agent-prompts`，但 npm 尚未发布 |
| DSH Plugin Hub 收录 | ⏳ 已提交 | issue [#581](https://github.com/dshplugin/dsh-plugin-hub/issues/581)，源码安装；插件中心需 npm |
| npm 发布 | ❌ 未完成 | 本机未登录 npm（`npm whoami` → `ENEEDAUTH`），需要账号交互 |
| DSH Market 数据修正 | ✅ 已提交 | issue [#313](https://github.com/2BingLing/dsh-market/issues/313)，把安装命令改为 GitHub 地址；次日 06:00 管道应用 |

**结论**：在当前没有 npm 账号登录的情况下，GitHub 安装是可用路径；DSH Market 条目已存在，数据修正后安装命令会指向 GitHub；DSH Plugin Hub 只做源码收录，npm 发布后才会进入其「插件中心」。

## 一、安装方式（与 README 一致）

```bash
# GitHub（当前推荐）
dsh plugin --profile web add git+https://github.com/lw24-1936/dsh-agent-prompts.git

# 本地开发
dsh plugin --profile web add file:/path/to/dsh-agent-prompts

# npm（发布后）
dsh plugin --profile web add dsh-agent-prompts
```

桌面版通过「插件设置 → 安装」填 GitHub 地址或本地目录。

## 二、市场收录机制

DSH Market（[dsh.market](https://dsh.market/)）的收录规则：

1. 仓库打 `dsh-plugin` topic → 每日 06:00 自动扫描；
2. 或提交 [`[提交插件]` issue](https://github.com/2BingLing/dsh-market/issues/new?template=submit_plugin.md)；
3. 收录条件：非 fork / 非归档 / 非官方本体，且有 `cordis.patch.yml`、`dsh.profile` 等 cordis 标记（本插件满足）。

已用市场索引确认条目存在：

```powershell
$plugins = Invoke-RestMethod "https://2bingling.github.io/dsh-market/plugins.json"
$plugins.plugins | Where-Object id -eq "lw24-1936/dsh-agent-prompts" | ConvertTo-Json -Depth 5
```

> 索引约 47 MB，首次拉取较慢；上面的 PowerShell 片段会完整解析，按需使用。

## 三、刷新市场安装命令（数据修正）

市场条目的 `install.commands` 由 README 安装段解析得到。0.4.0 的 README 已把 GitHub 命令放在最前，下一次采集会更新；为立即生效，另提交数据修正 issue：

- issue 模板：`[数据修正] 插件全名`
- 仓库地址：`https://github.com/lw24-1936/dsh-agent-prompts`
- 修正内容：安装命令改为 `dsh plugin --profile web add git+https://github.com/lw24-1936/dsh-agent-prompts.git`
- 简介同步为 0.4.0 的「6 技能 + 阿里 Java/前端规约 + 红线扫描 + 不锁技术版本」表述

提交记录：[#313](https://github.com/2BingLing/dsh-market/issues/313)（`[数据修正] lw24-1936/dsh-agent-prompts`，open）。该仓库的采集器按 issue 标题前缀 `[数据修正]` 识别，不依赖 label；每日 06:00 自动应用。

## 三之二、DSH Plugin Hub（dsh-plugin.org）

这是另一个市场（截图里的「DSH Plugin Hub」，数据源 `https://api.dsh-plugin.org/plugins.zh.json`），与 DSH Market 独立：

- 提交入口：<https://dsh-plugin.org/zh/submit>；issue 标题 `[插件提交] <owner>/<repo> — <一句话价值>`。
- 收录条件：公开仓库、`dsh-plugin` topic、README 安装命令、导出 `apply(ctx)`、根目录 `package.json`。
- **「插件中心」只展示能用 npm 一键安装的包**；没有 npm 包的仓库只做网页收录（源码安装），不会出现在插件中心的搜索里。

已提交：[#581](https://github.com/dshplugin/dsh-plugin-hub/issues/581)（源码安装）。npm 发布后需要再更新安装命令为 npm 包名，才能进入插件中心。

## 四、npm 发布（需要账号）

本机全局 registry 是 npmmirror（只读镜像），项目级 `.npmrc` 已覆盖为官方源；但 `npm whoami` 返回 `ENEEDAUTH`，需要先登录。

```powershell
cd E:\projectWorkspace\ai-work\deepseek-harness\skill-work\dsh-agent-prompts
npm adduser          # 或 npm login，按提示在浏览器/邮箱完成
npm whoami           # 必须输出用户名
npm pack --dry-run   # 确认 lib/ skills/ resources/（含 resources/reference/）等文件齐全
npm publish --access public
```

发布后验证：

```powershell
npm view dsh-agent-prompts version
npm view dsh-agent-prompts dist.tarball
```

预期版本 `0.4.0`。发布成功后，市场条目里的 npm 安装命令即可用；README 也可把 npm 方式放回首位。

## 五、发布后自检

### 1. 本地包导入

```powershell
cd $env:TEMP
Remove-Item -Recurse -Force verify-agent-prompts -ErrorAction SilentlyContinue
mkdir verify-agent-prompts; cd verify-agent-prompts
npm init -y | Out-Null
npm i "E:\projectWorkspace\ai-work\deepseek-harness\skill-work\dsh-agent-prompts"
node -e "import('dsh-agent-prompts').then(m=>console.log(Object.keys(m), m.name, m.inject, m.SKILLS.length))"
```

期望：`[ 'SKILLS', 'apply', 'inject', 'name' ] dsh-agent-prompts [ 'skills' ] 6`。

### 2. GitHub 安装

```powershell
cd $env:TEMP
Remove-Item -Recurse -Force verify-agent-prompts-git -ErrorAction SilentlyContinue
mkdir verify-agent-prompts-git; cd verify-agent-prompts-git
npm init -y | Out-Null
npm i "git+https://github.com/lw24-1936/dsh-agent-prompts.git"
node -e "import('dsh-agent-prompts').then(m=>console.log(m.name, m.SKILLS.map(s=>s.name)))"
```

期望输出六个技能名。

### 3. 市场条目

- 打开 https://dsh.market/ 搜索 `dsh-agent-prompts`；
- 检查类型 `cordis-plugin`、简介、安装命令是否为 GitHub 地址；
- 数据修正 issue 由每日 06:00 管道应用，次日再看。

## 六、版本升级清单

1. `package.json` 的 `version` 按语义化递增（改文案 patch；加技能/资源 minor；改结构 major）。
2. `CHANGELOG.md` 增加条目；README 的技能表、目录、兼容性同步。
3. 跑 `npm run verify` 与 `npm pack --dry-run`。
4. `git add -A && git commit && git push`；打 tag：`git tag v<version> && git push --tags`。`release.yml` 会自动跑 `npm run verify` 并创建 GitHub Release（不发布 npm）。
5. npm 发布（若已登录）：`npm publish --access public`。
6. 市场：README 安装段保持 GitHub 命令在首位；必要时提交 `[数据修正]` issue。npm 发布后同步更新 DSH Plugin Hub 的安装命令。

## 七、踩坑记录

- **npm 镜像**：npmmirror 不支持 publish；项目级 `.npmrc` 必须指向 `https://registry.npmjs.org`。
- **desktop profile**：命令行 `dsh plugin --profile web` 只对 web profile 有效；桌面版走插件设置。
- **市场解析**：安装命令来自 README 安装段。GitHub 命令要放在 npm 命令之前，且写明完整 `git+https://…` 地址。
- **资源路径**：技能注册的 `resourceBase` 用绝对路径（由 `import.meta.url` 解析），npm / git 安装都能定位到 `resources/`。
- **扫描器**：只做启发式提示，误报需人工确认；正式门禁仍用 P3C / PMD / ESLint。
