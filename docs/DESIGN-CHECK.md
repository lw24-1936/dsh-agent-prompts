# 设计反模式检查器

`resources/frontend-design/check-design.mjs` 是**保守、离线、零依赖**的静态检查器，配合 `frontend-design-craft` 使用。它只抓低误报的“AI 味/可访问性”信号，**不判断设计好坏**，也不替代四视口浏览器验收。

## 用法

```bash
# 自动发现当前目录下的 HTML/Vue/JSX/CSS
node resources/frontend-design/check-design.mjs --root .

# 做门禁：P1 存在时退出 1
node resources/frontend-design/check-design.mjs --root . --fail-on P1

# 或 CI 脚本
node resources/frontend-design/check-design.mjs --root . --format json --fail-on P1

# 安装到 devDependencies 后
npx dsh-agent-prompts-design --root . --fail-on P1
```

## 参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `--root <dir>` | `.` | 扫描根目录 |
| `--format text\|json` | `text` | 输出格式 |
| `--fail-on none\|P1\|P2` | `none` | 达到级别时退出 1 |
| `--max <n>` | `200` | 最多输出 n 条 |
| `--help` / `--version` | — | 帮助/版本 |

退出码：`0` 通过；`1` 达到 `--fail-on`；`2` 参数/读取错误。

## 规则（0.8.0）

| 规则 | 级别 | 检查 |
|---|---|---|
| D001 | P1 | 紫色/淡紫渐变（`linear/radial/conic-gradient` 中含紫系颜色/`purple`/`violet`） |
| D002 | P1 | `transition: all` / `transition-property: all` |
| D003 | P1 | lorem ipsum |
| D004 | P1 | `<img>` 缺少 `alt` |
| D005 | P2 | `div`/`span` 绑定 click 但无 `role`/`tabindex` |
| D006 | P2 | `outline: none` / `outline: 0` |
| D007 | P2 | `z-index: 9999` |

## 范围与限制

- 扫描 `.html`、`.vue`、`.jsx`、`.tsx`、`.css`、`.scss`、`.sass`、`.less`；忽略 `node_modules`、`dist`、`build`、`coverage` 等。
- 跳过 `.min.*` 文件。
- 规则是启发式：可能漏报/误报；设计评审与浏览器验收仍是主门禁。
- 不访问网络、不执行页面、不修改文件。

## CI 示例

```yaml
- name: Design anti-patterns
  run: node resources/frontend-design/check-design.mjs --root . --fail-on P1
```

建议只把 P1 作为阻断；P2 作为提示，避免无关基线阻塞存量项目。
