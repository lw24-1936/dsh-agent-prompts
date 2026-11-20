# Vue 3 高频反模式

## 状态

1. **同一份数据多个 `ref` 手动同步**
   - 状态不一致、更新遗漏。
   - 一个源状态，其余 `computed` 派生。

2. **整体替换 `reactive` 对象**
   - 模板/子组件仍持有旧代理。
   - 修改属性或改用 `ref`；需要替换时用 `Object.assign`/重新赋值 ref。

3. **解构 `reactive`/Pinia store 后不更新**
   - 解构丢响应性。
   - `toRefs` / `storeToRefs`。

4. **用 index 当 `v-for` key**
   - 插入/排序后状态错位，组件复用错误。
   - 稳定唯一 ID。

5. **`computed` 里发请求/改状态**
   - 副作用不可预测、重复执行。
   - 移到 action/watch；computed 保持纯。

6. **watch 里无清理的异步请求**
   - 旧响应覆盖新状态、卸载后写状态、内存泄漏。
   - AbortController/请求序号/卸载标记。

7. **`watchEffect` 里 `await` 后依赖丢失**
   - 后续依赖不再追踪。
   - 用 `watch` 明确源，或拆分同步/异步逻辑。

8. **`v-if` 与 `v-for` 同元素**
   - 优先级/作用域反直觉。
   - `<template v-for>` 或 computed 过滤。

9. **`v-html` 渲染未信任内容**
   - XSS。
   - 消毒/白名单；优先文本插值。

10. **Ref 到处 `.value` 混乱**
    - 可读性差、漏写。
    - 统一组合式函数边界；模板自动解包；解构用 `storeToRefs`/`toRefs`。

## 组件 / 组合

11. **一个组件包办页面所有职责**
    - 难测、难复用、改动耦合。
    - 按职责/状态所有权拆页面容器 + 功能组件 + 展示组件。

12. **把所有逻辑塞进一个 `useFeature()`**
    - 只是把上帝组件换成上帝 composable。
    - 按能力拆多个 composable，各自有明确输入输出/清理。

13. **composable 隐藏全局副作用**
    - 调用即注册监听器/请求，无法控制生命周期。
    - 明确副作用时机/清理；返回 `stop`/`dispose`。

14. **直接改 props / 用 props 初始化 state 后不同步**
    - 单向数据流被破坏，父子状态分叉。
    - emit 更新；需要本地副本时 watch props 或 `defineModel`。

15. **`defineExpose` 暴露内部状态**
    - 父组件依赖内部实现，重构困难。
    - 暴露最小方法/只读值。

16. **插件在 mount 后安装 / 全局属性滥用**
    - 组件拿不到/类型丢失。
    - mount 前安装；优先 provide/inject/store。

## 路由 / 状态

17. **依赖 `onMounted` 加载同路由参数数据**
    - 参数变化组件复用，不重新 mount。
    - watch 参数/`beforeRouteUpdate`。

18. **守卫无条件重定向**
    - 无限循环、白屏。
    - 判断目标路由/登录状态；返回明确。

19. **所有状态都放 Pinia**
    - 全局耦合、SSR/测试复杂。
    - 局部状态留组件；跨页/跨组件才进 store。

20. **Pinia 持久化整个 store**
    - 敏感数据/大对象进入 localStorage，版本升级不兼容。
    - 只持久化必要字段；迁移/清理策略。

## 测试 / 性能

21. **只写快照测试**
    - UI 坏了快照仍可能过；只覆盖结构。
    - 行为/可访问性/交互断言为主。

22. **组件测试断言内部实现**
    - 重构即碎。
    - 黑盒：props/事件/可见输出。

23. **固定 `setTimeout` 等异步**
    - 慢且不稳定。
    - `flushPromises`/`nextTick`/`waitFor`。

24. **为性能过早 memo/虚拟化**
    - 复杂度上升，收益未测。
    - 先正确，再测量，再优化。

25. **大列表每项包一层组件/重计算**
    - 渲染成本高。
    - 简化列表项、computed 缓存、虚拟化。

26. **动画用 `transition: all` / 布局属性**
    - 卡顿、误触发。
    - 只动 transform/opacity；尊重 reduced-motion。

## 快速 review 顺序

状态源 → 数据流 → 组件边界 → 副作用清理 → 路由/Store → 测试 → 性能。
