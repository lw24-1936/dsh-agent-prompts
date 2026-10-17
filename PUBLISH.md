# 发布到 DSH 插件市场

本目录已可发布，只差两件需要你账号的事：**npm 登录** 与 **GitHub 仓库**。

## 为什么市场需要这两样

市场索引（`2bingling.github.io/dsh-market`）收录的每条都是：

```json
{
  "id": "owner/repo",
  "type": "cordis-plugin",
  "install": {
    "method": "pnpm-profile",
    "commands": ["dsh plugin --profile web add <npm 包名>"]
  },
  "sources": ["topic"]
}
```

也就是说：**它按 GitHub topic 抓仓库，安装命令指向 npm 包名**。所以两者缺一不可：

- 没有 npm 包 → 用户装了会解析失败
- 没有 GitHub 仓库 → 采集器抓不到你

## 一、发布 npm 包

```powershell
cd E:\projectWorkspace\ai-work\deepseek-harness\deepseekwork02\dsh-agent-prompts
npm adduser          # 或 npm login，按提示在浏览器/邮箱完成
npm whoami           # 必须输出你的用户名，否则下一步必失败
npm publish --access public
```

发布前建议先干跑一遍，确认打进去的文件齐全：

```powershell
npm pack --dry-run
```

必须包含：`lib/`、`skills/`（4 个 .md）、`cordis.patch.yml`、`README.md`、`LICENSE`。
不包含 `reference/` 也不影响运行（已在 `files` 里，会一起发布，用于对照原文）。

验证发布结果：

```powershell
npm view dsh-agent-prompts version
npm view dsh-agent-prompts dist.tarball
```

## 二、建 GitHub 仓库并打 topic

```powershell
cd E:\projectWorkspace\ai-work\deepseek-harness\deepseekwork02\dsh-agent-prompts
git init
git add .
git commit -m "feat: dsh-agent-prompts 0.1.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dsh-agent-prompts.git
git push -u origin main
```

推完后在仓库页面上加 topic（Settings 上方 About 右侧齿轮 → Topics）：

```
dsh-plugin
```

> 采集器按 topic 抓取，**没有这个 topic 就不会被收录**。

## 三、等采集或主动提交

- 采集器会定期跑，抓 topic 为 `dsh-plugin` 的仓库；
- 想快一点，去市场仓库提 issue / PR 提交条目（`sources` 里出现 `awesome-0xsline` 说明还有人工收录渠道）。

收录后市场里会出现：

```
id:      <owner>/dsh-agent-prompts
install: dsh plugin --profile web add dsh-agent-prompts
```

## 四、发布后自检

```powershell
# 全新目录里装一遍，确认不是只在本机能用
cd $env:TEMP
mkdir verify-agent-prompts; cd verify-agent-prompts
npm init -y | Out-Null
npm i dsh-agent-prompts
node -e "import('dsh-agent-prompts').then(m=>console.log(Object.keys(m), m.name, m.inject))"
```

期望输出：`[ 'apply', 'inject', 'name' ] dsh-agent-prompts [ 'skills' ]`

## 五、版本升级清单

改完技能文案要升版本，否则 npm 拒收，市场也不会更新：

1. `package.json` 的 `version` +1（语义化：改文案 patch，加技能 minor，改结构 major）
2. `README.md` 里的技能表同步
3. `npm publish`，然后 `git tag v<version> && git push --tags`

## 当前状态

- [x] 插件代码、四个技能、README、LICENSE 就绪
- [x] 已在本机 desktop profile 安装并验证（四个技能已出现在技能目录）
- [ ] npm 发布（需 `npm adduser`）
- [ ] GitHub 仓库 + `dsh-plugin` topic
- [ ] 市场收录
