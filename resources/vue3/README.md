# Vue 3 工程实践（按需查阅）

> 本目录把 Vue 3 的**响应式、组件边界、composables、Router/Pinia、测试、性能与调试**拆成检查项。默认 Vue 3 + `<script setup lang="ts">`；Vue 2 项目按 Options API 等价写法，不强制升级。
>
> 只读当前任务需要的文件。

| 文件 | 内容 | 何时读 |
|---|---|---|
| `core.md` | 响应式、SFC、组件边界、props/emits、composables | 写/改组件、抽逻辑 |
| `component-patterns.md` | 异步组件、Suspense、KeepAlive、Teleport、过渡、slots/attrs、JSX、指令、SSR | 复杂组件/交互 |
| `ecosystem.md` | Router、Pinia、VueUse、Vitest/Playwright、性能、SSR | 路由/状态/测试/工具链 |
| `debugging.md` | 按症状定位的常见坑 | 状态不更新、重复渲染、路由/Store 异常 |
| `anti-patterns.md` | 高频反模式 | review、重构 |

## 三条底线

1. **状态可预测**：最小源状态，其余用 `computed` 派生；不要多份状态互相同步。
2. **数据流显式**：props down / events up；跨层共享用 provide/inject 或 store，不用隐式全局。
3. **先正确后性能**：功能、边界、清理、测试通过后再做 memo/虚拟化/懒加载。

## 版本

- Vue 3 用 Composition API；项目明确用 Options API 时用等价写法（`data/computed/methods/props`，`this` 上下文、生命周期、类型标注按项目）。
- Vue 3 JSX/TSX 项目：注意 Vue JSX 与 React JSX 的属性/事件/插槽差异（`class` vs `className`、`onClick` 事件名、`v-model` 等价写法）；不要直接套 React 代码。
- Vue 2 项目不强制迁移；`<script setup>` 示例替换为 Options API，组合式函数替换为 mixin/工具函数。
- Router/Pinia/Vitest/VueUse 版本按项目 `package.json`，不凭记忆写 API。

## 来源

学习总结自：

- [vuejs-ai/skills](https://github.com/vuejs-ai/skills)（MIT）
- [antfu/skills](https://github.com/antfu/skills)（MIT）
- [vueuse/skills](https://github.com/vueuse/skills)（MIT）
- Vue / Vue Router / Pinia / VueUse / Vitest / Playwright 官方文档

不是原文复制；具体归属见仓库根 `NOTICE.md`。
