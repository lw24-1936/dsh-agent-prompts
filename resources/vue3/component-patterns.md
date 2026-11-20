# 组件模式：异步、缓存、传送、过渡与渲染函数

## 1. 异步组件

```ts
const Editor = defineAsyncComponent({
  loader: () => import('./Editor.vue'),
  loadingComponent: Loading,
  errorComponent: LoadError,
  delay: 200,
  timeout: 10000,
})
```

- 始终提供 loading/error/fallback；不要只写 `() => import(...)` 就假设网络永远成功。
- 异步组件内部的 `async setup` 需要 `<Suspense>` 或错误边界；测试要等待 resolve。
- 路由级懒加载 + 组件级懒加载都按实际体积选择，不要把所有组件都异步化。

## 2. Suspense

- 用于协调多个异步依赖的加载态；提供 `#default` 与 `#fallback`。
- 异步 setup 必须最终 resolve；未捕获 reject 会进入错误状态。
- Suspense 与 Router/KeepAlive 组合时注意加载顺序；不要在 fallback 里做重业务。

## 3. KeepAlive

- 只缓存确实需要保留状态的页面（列表筛选、表单草稿）；不要全站默认缓存。
- 明确 `include`/`exclude`/`max`；缓存键用组件 name。
- 用 `onActivated` 刷新需要更新的数据；`onDeactivated` 暂停定时器/订阅。
- 缓存实例不会重新执行 `onMounted`；不要假设每次进入都初始化。

## 4. Teleport

- 用于 modal/toast/dropdown 等需要脱离父级 stacking context 的内容。
- 目标容器在 SSR/测试中要存在；测试查询用 `document` 或 `attachTo`。
- 关闭后清理焦点/滚动锁；键盘 Esc 与焦点回到触发元素。

## 5. 过渡与动画

- 优先 CSS transition/animation + `<Transition>`/`<TransitionGroup>`；只动 transform/opacity。
- 列表过渡必须有稳定 key；`TransitionGroup` 的 move 动画用 FLIP 思路。
- 状态驱动动画（如进度/展开）用响应式状态 + CSS 变量；不要在 JS 里逐帧改布局属性。
- 类驱动动画（enter/leave）明确 `enter-from/active/to`；避免 `transition: all`。
- 尊重 `prefers-reduced-motion`；复杂动画提供降级或关闭。

## 6. Slots 与透传

- 容器/布局组件用 slots；具名插槽的作用域数据要类型化。
- 多根节点组件要显式绑定 `$attrs`；否则 class/style/事件可能丢失。
- `inheritAttrs: false` 时手动决定 attrs 归属，不要同时重复绑定。
- 自定义组件上的原生事件需要 `emits` 声明/透传；不要依赖已移除的 `.native`。

## 7. 渲染函数 / JSX

- 只在模板表达力不足/动态性极高时使用；普通页面优先 SFC 模板。
- Vue JSX 与 React 不同：`class`（不是 `className`）、事件 `onClick`、`v-model` 需手写、插槽用 `slots`/`v-slots`。
- 渲染函数返回 VNode；不要在其中做副作用/请求。
- JSX 项目确认构建插件/TS 配置；不要直接复制 React 组件。

## 8. 自定义指令

- 只封装**直接操作 DOM**的横切行为（focus、click-outside、权限隐藏）。
- 在 `mounted` 注册监听、`unmounted` 清理；SSR 环境不要访问 `window/document`。
- 指令参数/修饰符要校验；不要把业务状态藏进指令。

## 9. 插件

- 插件在 `app.use()` 且 `app.mount()` 之前安装。
- 全局属性只用于真正全局能力；业务依赖优先 provide/inject 或 store。
- 类型扩展放 `*.d.ts` 的 `ComponentCustomProperties`；不要用 `any` 绕过。
- 插件卸载/多实例场景要清理全局监听器。

## 10. SSR / Hydration

- 服务端不访问 `window/document/localStorage`；需要时放 `onMounted` 或 `ClientOnly`。
- 首屏数据/时间/随机数在服务端与客户端保持一致，避免 hydration mismatch。
- 每请求独立 store；不要把用户状态放模块级单例。
- `ClientOnly` 只用于真正客户端内容，不要用它掩盖所有 SSR 问题。

## 11. 自检

- [ ] 异步组件有 loading/error/fallback；Suspense 有错误处理。
- [ ] KeepAlive 只缓存需要的页面，激活/停用有刷新/清理。
- [ ] Teleport 的焦点/滚动/键盘行为正确。
- [ ] 过渡只动 transform/opacity，reduced-motion 有降级。
- [ ] slots/attrs/emits 透传明确，无丢失/重复绑定。
- [ ] JSX/渲染函数/指令/插件没有隐藏副作用，SSR 安全。
