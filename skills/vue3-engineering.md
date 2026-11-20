# Vue 3 工程实践

> **加载场景**：写/改/review Vue 3 组件、页面、路由、Pinia、composables、测试；排查响应式/渲染/路由/状态问题；使用 VueUse/Vitest/Playwright/Vite 时。
>
> **版本原则**：默认 Vue 3 + `<script setup lang="ts">` + Composition API；项目明确用 Options API 时用等价写法；Vue 2 项目不强制迁移。Router/Pinia/VueUse 版本按项目 `package.json`，不凭记忆写 API。

## 一、先确认架构与边界

- 读 `package.json`、`vite.config`/`nuxt.config`、路由、store、组件目录、测试配置。
- 确认：Vue 版本、Composition/Options API、TypeScript、Vue Router/Pinia/VueUse 是否已装、测试框架。
- 非平凡功能先画组件边界：页面容器负责路由/数据加载/权限/布局；功能组件负责表单/列表/编辑器；展示组件无业务依赖。
- 状态所有权明确：谁是唯一写者、生命周期跟谁、跨组件如何共享。
- 不把整个功能塞进一个组件或一个 `useFeature()`；按职责拆分。

## 二、响应式

- 最小源状态；派生用 `computed`；不要多份状态手动同步。
- `ref` 用于基本类型/单值；`reactive` 用于一组字段；大对象/第三方实例用 `shallowRef`/`markRaw`。
- `computed` 纯函数、无副作用；不要在 getter 里发请求/改状态。
- `watch` 明确 `deep`/`immediate`/`flush`；异步请求处理取消/过期响应；`watchEffect` 注意 `await` 后依赖丢失。
- 解构 `reactive` 用 `toRefs`；Pinia 解构用 `storeToRefs`。

## 三、组件与 SFC

- `<script setup lang="ts">` 默认；scripts → template → style；模板保持声明式。
- props 只读、类型明确；`defineEmits` 声明事件；项目支持时用 `defineModel`。
- `v-for` 稳定唯一 key；`v-if`/`v-for` 不同元素；`v-html` 只渲染已消毒内容。
- 多根节点/透传 attrs 明确归属；子组件方法用 `defineExpose` 最小暴露。
- 异步组件/`Suspense`/`KeepAlive`/`Teleport`/过渡/JSX/指令/插件按需使用；细节见 `vue3/component-patterns.md`；不要用 `ClientOnly` 掩盖所有 SSR 问题。

## 四、Composables

- 命名 `useXxx`，一个职责；输入支持 `MaybeRef`/`MaybeRefOrGetter` 时，在副作用内用 `toValue`/`toRef` 归一化。
- 副作用放 `watch`/`onMounted`，并清理监听器/定时器/订阅/请求。
- 返回 `ref`/`computed` 保持响应性；共享单例明确多实例语义。
- 不隐藏副作用；不自动新增依赖。

## 五、Router / Pinia / VueUse

- 同路由参数变化要 watch 参数/守卫，不要只依赖 `onMounted`；守卫异步要返回，避免无限重定向。
- Pinia 按业务域拆；setup store 返回完整 state/getters/actions；持久化只存必要字段；SSR 每请求独立 store。
- VueUse：已安装才优先用；使用前查对应版本 API/类型；未安装不要自动加依赖，先问用户；区分 AUTO/EXTERNAL/EXPLICIT_ONLY 的使用策略。
- 先复用项目已有 composable/工具，不重复造轮子。

## 六、测试

- Vitest + Vue Test Utils 做单元/组件；Playwright 做关键路径 E2E。
- 组件测试黑盒：props/交互/输出/可访问性；不断言内部实现。
- 异步用 `flushPromises`/`nextTick`/`waitFor`；不用固定 sleep。
- Pinia 测试 `createPinia()` + `setActivePinia()`；composable 需要生命周期时用 helper 组件包裹。
- 快照只辅助；不删断言/跳过测试求绿。
- 真实布局/计算样式用浏览器 runner；SSR/Teleport/异步组件按对应方式等待。

## 七、性能与可访问性

- 先正确再优化；用测量决定是否 memo/虚拟化/懒加载。
- 大列表虚拟化；避免列表项不必要抽象/重渲染；`v-once`/`v-memo` 按需。
- 路由/大组件懒加载；分析 bundle 后再拆。
- 语义化标签、键盘可达、focus 可见、对比度达标；动画尊重 `prefers-reduced-motion`。
- 四态：loading / empty / error / 边界；不要只做成功态。

## 八、调试

按症状查 `vue3/debugging.md`：不更新、重复渲染、watcher 异常、组件找不到、路由参数、Pinia 解构、异步/SSR/hydration。
先最小复现，再沿“源状态 → computed → 模板/路由/store”定位；一次只改一处。

反模式：`vue3/anti-patterns.md`；完整检查项：`vue3/core.md`、`vue3/ecosystem.md`。

## 九、自检

- [ ] 组件边界/状态所有权清楚，没有上帝组件/composable。
- [ ] 源状态最小，派生 computed；无重复同步。
- [ ] v-for key、v-if/v-for、v-html、props/emits 正确。
- [ ] composable 有清理/取消/错误处理，不隐藏副作用。
- [ ] 路由参数/守卫/Store 解构/SSR 边界处理正确。
- [ ] 测试分层、黑盒、异步等待正确；关键路径有 E2E。
- [ ] 四态/键盘/对比度/reduced-motion 覆盖。
- [ ] 没有未经确认新增依赖。
