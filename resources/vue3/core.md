# 响应式、组件与 Composables

## 1. 响应式选择

| 场景 | 选择 | 原因 |
|---|---|---|
| 基本类型/单值 | `ref` | 显式 `.value`，模板自动解包 |
| 一组相关字段 | `reactive` | 对象代理；不要整体解构/替换 |
| 大对象/不可变数据/第三方实例 | `shallowRef` / `markRaw` | 避免深层代理成本与意外响应 |
| 从 props/参数派生 | `computed` | 纯函数、无副作用、可缓存 |
| 需要副作用（请求/写 DOM/日志） | `watch` / `watchEffect` | 明确依赖与清理 |

规则：

- 最小源状态：能从已有状态算出来的，不要再建 `ref` 同步。
- `computed` 只读、无副作用；不要在里面发请求/改状态。
- `watch` 明确 `immediate`、`deep`、`flush`；异步请求要处理过期响应与取消。
- `watchEffect` 只用于依赖自动收集合适的场景；`await` 之后的依赖不会自动追踪。
- 解构 `reactive` 会丢响应性；需要解构时用 `toRefs`/`toRef`。
- 数组/Map/Set 里的 `ref` 不会自动解包；读取用 `.value`。
- 第三方类实例不要深度代理；用 `markRaw` 或 `shallowRef`。

## 2. 组件边界

写代码前先画：

- 哪些是页面级职责（路由、数据加载、权限、布局）？
- 哪些是功能组件（表单、列表、编辑器）？
- 哪些是纯展示组件（无业务依赖）？
- 状态归谁所有？谁是唯一写者？生命周期跟谁走？

判断内聚：**一起变化/共享不变量**的放一起；只是“在同一页”或“读同一份数据”不足以合并。不要把所有逻辑塞进一个 `useFeature()` 就算拆完；根组件负责组合，功能组件/composable 各自承担明确职责。

## 3. SFC 结构

推荐顺序：

```vue
<script setup lang="ts">
// imports → props/emits → state → computed → methods → lifecycle
</script>

<template>
  <!-- 声明式；复杂分支/派生放 script -->
</template>

<style scoped>
/* 只影响当前组件 */
</style>
```

规则：

- `<script setup lang="ts">` 为默认；不要混用 Options API（存量组件除外）。
- 模板保持声明式；不要塞复杂表达式/副作用。
- `v-for` 必须有稳定唯一 `:key`；不要用数组下标。
- `v-if` 与 `v-for` 不要同元素；用 `<template v-for>` 或 computed 过滤。
- `v-html` 只渲染已消毒内容；默认禁止未信任输入。
- 组件名多单词；`defineOptions({ name })` 按项目规范。

## 4. Props / Emits / v-model

```ts
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), { count: 0 })

const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'close'): void
}>()
```

- props 只读；不要直接改 props。
- 用 `defineModel` 简化双向绑定（项目 Vue 版本支持时）；否则 `modelValue` + `update:modelValue`。
- 事件命名语义化；不要用 `click` 这类原生事件名冒充自定义事件。
- 透传属性/监听器要明确；多根节点时 `$attrs` 归属要写清。
- 需要暴露给父组件的方法用 `defineExpose`，不要暴露内部状态。

## 5. Slots / Provide / Inject

- 布局/容器组件用 slots，不要把内容写死。
- 跨多层共享用 `provide/inject`；注入 key 用 `InjectionKey<T>`；提供默认值/错误提示。
- 全局属性只用于真正的全局能力；业务依赖优先 provide/inject 或 store。
- 插件在 `app.mount()` 前安装；不要在组件里动态注册全局插件。

## 6. Composables

适用：可复用**有状态逻辑**（请求、表单、拖拽、媒体查询、权限、订阅）。

规则：

- 命名 `useXxx`；一个 composable 一个职责。
- 输入用 `MaybeRef` / `MaybeRefOrGetter` 时，在响应式副作用内用 `toValue`/`toRef` 归一化。
- 不要在 composable 顶层无条件执行副作用；副作用放在 `watch`/`onMounted` 并清理。
- 异步请求处理 loading/error/abort/过期响应；组件卸载后不要写状态。
- 返回 `ref`/`computed` 而不是裸值，保持响应性；返回对象的 API 要稳定。
- 共享单例用 `createSharedComposable`/模块级状态，但要明确多实例语义。
- 不隐藏副作用：composable 内注册的监听器/定时器/订阅必须在 `onScopeDispose`/`onUnmounted` 清理。

## 7. 渲染与性能

- 列表大时虚拟化；列表项避免不必要的组件抽象/重渲染。
- 静态内容用 `v-once`；大组件用 `v-memo` 前先测量。
- 异步组件/路由懒加载；`Suspense` 处理异步依赖（详见 `component-patterns.md`）。
- `KeepAlive` 只缓存确实需要保留状态的页面；明确 `include/exclude/max`。
- `Teleport` 用于 modal/toast；注意测试查询与 SSR。
- 动画优先 CSS transform/opacity；尊重 `prefers-reduced-motion`；不要布局抖动。

## 8. 自检

- [ ] 源状态最小，派生用 computed；没有重复状态同步。
- [ ] props/emits 类型清晰；没有直接改 props。
- [ ] v-for 有稳定 key；v-if/v-for 不同元素。
- [ ] composable 有清理、错误/取消处理，不隐藏副作用。
- [ ] 组件边界按职责/状态所有权拆分，而不是按文件大小。
- [ ] 性能优化在功能正确之后，有测量依据。
