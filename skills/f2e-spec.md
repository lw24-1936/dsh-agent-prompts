# 阿里巴巴前端代码规范（F2E Spec）· 执行层

> 写 / 改 / review 前端代码（JS / TS / React / Vue 3）时加载。规范基线来自 [alibaba/f2e-spec](https://github.com/alibaba/f2e-spec)，本技能做了**现代化修订**（Hooks、TypeScript、Vue 3、安全分级）与可执行化。
> 与后端 `alibaba-java-standards` 同一套三级管控：P0 必须改，P1 只管新代码，P2 可忽略。

## 一、三级管控

| 层级 | 范围 | 行为 |
|---|---|---|
| 🔴 **P0** | XSS、危险 API、密钥泄露、明显运行时错误 | 新代码禁止；被触碰的存量代码发现即修复；不可口头豁免 |
| 🟡 **P1** | 类型安全、Hooks 规则、列表 key、废弃 API、`var`/`==` | 只约束新增/重写代码；存量不批量改 |
| 🟢 **P2** | 格式、引号、命名、注释、`console` | 提示不阻塞；用户说忽略即忽略 |

## 二、通用格式（所有前端文件）

- 2 个空格缩进，禁用 tab；UTF-8；文件末尾保留一个换行。
- 单行建议 ≤ 100 字符；超长表达式换行，不靠压缩工具掩盖。
- 代码块开始/结束不空行；块与块之间用一个空行分隔。
- 提交前必须通过 `eslint` 与 `tsc --noEmit`（项目已配置时）。

## 三、JavaScript / TypeScript

- 用 `const` / `let`，**禁 `var`**；优先 `const`，需要重新赋值才用 `let`。
- 一条声明只声明一个变量；声明必须被使用；不与外层作用域同名。
- 用箭头函数替代匿名 `function`；不在块内声明函数。
- 默认参数放最后；不修改函数入参（需要时先复制）。
- 语句用分号；字符串用单引号，JSX 属性用双引号；拼接用模板字符串。
- 用 `===` / `!==`，禁用 `==` / `!=`（`== null` 判空也建议改写）。
- 对象/数组用字面量；对象属性与方法用简写；浅拷贝用扩展运算符。
- 解构获取属性/元素；属性访问优先 `.`，`[]` 只用于动态 key。
- 模块：ESM `import` / `export`；同一模块合并为一条 import；import 放文件顶部；排序「第三方 → 内部绝对路径 → 相对路径」。
- TS：公共 API 标注返回类型；禁止 `any`（未知用 `unknown` + 收窄）；类型导入用 `import type`；禁止无理由的 `@ts-ignore`（必须写原因，优先 `@ts-expect-error`）。
- 异步：优先 `async/await`；`Promise` 必须处理 rejection；禁止 floating promise（`void` 显式标注或 await）。

## 四、React

- 用**函数组件 + Hooks**；不再要求 class 组件。class 仅用于 Error Boundary 等必需场景。
- 一个文件一个组件；组件文件用 PascalCase，文件名与组件同名。
- JSX：2 空格缩进；自闭合标签斜线前一个空格 `<Foo />`；多行 JSX 用括号包裹；无子元素写自闭合。
- Props 用 TS interface 声明；**不要求** `propTypes`（TS 项目）；默认值用参数默认值或 `defaultProps`（函数组件优先参数默认值）。
- `useState` 更新依赖旧值时用函数式：`setValue(v => v + 1)`，不要读闭包里的旧 state。
- Hooks 只在顶层调用；命名 `useXxx`；只在组件或自定义 Hook 中调用；`useEffect` 声明完整依赖，清理函数必须返回。
- 列表 key 用稳定唯一 ID，**禁止用数组索引**（除非列表静态且不重排）。
- 不用已废弃生命周期 / `findDOMNode`；DOM 用 `ref`。
- 派生状态用渲染期计算或 `useMemo`，不要用 `useEffect` 同步 state（容易多一次渲染）。
- 事件用箭头函数或 `useCallback`，不在 JSX 里 `.bind()`。

## 五、Vue 3（本项目主栈）

- 统一 `<script setup lang="ts">`；不混用 Options API（存量组件除外）。
- Props：`defineProps<{ id: string }>()`；Emits：`defineEmits<{ change: [value: string] }>()`；不用运行时 `props: []`。
- `v-for` 必须带 `:key`，用业务唯一 ID；**禁止 `v-if` 与 `v-for` 同元素**（用 `<template v-for>` 或 computed 过滤）。
- 派生数据用 `computed`，不用 `watch` 手动同步；`watch` 必须说明来源与副作用，异步 `watch` 处理竞态。
- `ref` / `reactive` 按场景选：基本类型 `ref`，对象聚合可 `reactive`；解构 `reactive` 会丢响应性。
- 组合式函数命名 `useXxx`，放 `src/composables/`；内部可调用其他 composable。
- Pinia：store 命名 `useXxxStore`；只持久化 token / 用户 / 权限；不在 store 里做 UI 提示。
- 组件命名 PascalCase，模板中使用 PascalCase 或 kebab-case 保持一致；事件名 kebab-case。
- 不用 `this`；`<style scoped>` 优先；全局样式只放 reset/token。

## 六、命名与注释

- 变量/函数/实例：小驼峰；类/组件/类型：大驼峰；导出常量：`UPPER_CASE`。
- 文件名：组件 PascalCase，其他小写短横线（`user-profile.ts`）。
- 不以下划线/美元符号开头或结尾；不与保留字冲突。
- 注释符与内容之间一个空格；单行 `//`，多行 `/** ... */`；公共 API 用 JSDoc/TSDoc。
- `TODO` / `FIXME` 必须带负责人或 issue 号，禁止无主 TODO。
- 注释解释「为什么」，不复述「做了什么」；过期注释必须删。

## 七、性能

- 避免不必要的渲染：`React.memo` / `useMemo` / `useCallback` 只在有测量或明确重渲染问题时用，不无脑包。
- 大列表用虚拟滚动；列表项组件避免内联对象 props（导致 memo 失效）。
- 图片：显式宽高、`loading="lazy"`、合适格式；首屏关键资源预加载。
- 路由/重组件懒加载；第三方库按需引入；包体积变化要能解释。
- 不在渲染函数/模板中做重计算；把纯计算移到 `computed` / `useMemo`。

## 八、安全与无障碍（P0）

- **禁 `eval` / `new Function`**；动态执行需求先问用户。
- **禁把未信任内容交给 `v-html` / `dangerouslySetInnerHTML` / `innerHTML`**；必须用时先做 HTML 消毒（DOMPurify 等）并在代码处说明来源。
- `target="_blank"` 必须同时 `rel="noopener noreferrer"`。
- 生产代码移除 `debugger`；`console` 只保留必要的错误日志（用项目 logger）。
- 不在前端硬编码密钥、令牌、内网地址；环境变量走 `.env` 且不提交真实值。
- 图片有 `alt`；交互元素可键盘操作；表单控件有关联 label；遵循 WAI-ARIA，不滥用 `role`。
- 不在 URL/query 中放敏感信息；跳转前校验目标地址（防开放重定向）。

## 九、工具链（项目已配置时直接跑）

```bash
pnpm eslint . --max-warnings=0
pnpm tsc --noEmit
pnpm build:test   # 或项目约定的构建命令
```

- ESLint 规则包：`eslint-config-ali`；React 用 `eslint-config-ali/react` 或 `eslint-config-ali/typescript/react`；Vue 3 用 `eslint-plugin-vue` + `@typescript-eslint`。
- 格式化：Prettier（2 空格、单引号、分号、100 列）；与 ESLint 的分工见资源文件 `f2e-spec/toolchain.md`。
- 提交前可用启发式扫描：

```bash
node "<资源目录>/scan-redlines.mjs" --profile frontend --root <前端目录>
```

扫描器只提示，不替代 ESLint；退出码 1 表示发现 P0。

## 十、Review 输出格式

发现违规时按此格式给结论，不要泛泛说「代码不规范」：

```md
- [P0/P1/P2] 规则：<规则名>（文件:行）
  - 问题：<一句话>
  - 修复：<可直接采用的写法/代码片段>
```

存量代码只汇总 P0；P1 一句话带过（如「另有 12 处命名/格式问题，属存量未强制」）；P2 默认不提。

## 十一、来源与许可

- 规范来源：[阿里巴巴前端代码规范 F2E Spec](https://github.com/alibaba/f2e-spec)（MIT）。
- 原始 Skill 快照见资源文件 `f2e-spec/original.md`；本技能在其基础上做了 Hooks / TS / Vue 3 / 安全分级修订，冲突时以本技能与项目 ESLint 配置为准。
