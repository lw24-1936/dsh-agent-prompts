# Router、Pinia、VueUse、测试与构建

## 1. Vue Router

- 生产 SPA 用 Vue Router，不手写 hash/popstate 路由。
- 路由参数变化**不会**重新创建组件：需要 `watch(() => route.params.id, ...)` 或在 `beforeRouteUpdate` 重新加载；不要只依赖 `onMounted`。
- `beforeRouteEnter` 里没有 `this`；需要组件实例时用回调或 `next(vm => ...)`（按项目版本写法）。
- 导航守卫异步逻辑要 `await`；不要忘记返回/调用 `next` 导致卡死。
- 防止无限重定向：守卫里判断“已登录/目标路由”，不要无条件 `next('/login')`。
- 组件卸载时移除全局事件/监听器/定时器；路由切换后旧请求要取消或忽略。
- 路由懒加载 `() => import(...)`；按页面/功能拆 chunk。
- 路由 meta 做权限/标题/布局；权限判断不要只在前端，后端必须校验。

## 2. Pinia

- 大型/跨页共享状态用 Pinia；局部状态留在组件/composable。
- 一个 store 一个业务域；不要建“全局万能 store”。
- Setup store 要返回所有 state/getters/actions（SSR/DevTools 需要）。
- 解构 store 会丢响应性：用 `storeToRefs` 取 state/getters，actions 直接解构。
- action 里处理异步、错误、loading；组件不直接拼 store 内部状态。
- 持久化只存必要字段（token/用户/权限/草稿）；不要持久化敏感数据/大对象。
- SSR 每个请求独立 store 实例；不要把用户状态放模块级单例。
- 筛选/分页等临时状态可放 URL query，便于刷新/分享；不要全塞 store。

## 3. VueUse / 第三方 composables

先检查项目**已安装**的依赖与已有 composable：

- 有 VueUse 时，优先用现成函数（`useLocalStorage`、`useDebounceFn`、`useIntersectionObserver`、`useClipboard`、`useColorMode` 等），不要重复造轮子。
- 没有安装时**不要自动加依赖**；先问用户，说明体积/维护成本。若项目政策允许，再安装。
- 使用前查对应版本的 API/类型；不要凭记忆写不存在的函数/参数。
- 区分“自动可用”“需要外部依赖”“仅用户明确要求”三类；外部依赖（如 RxJS）未安装时不要引入。
- 自己封装 composable 时，输入支持 `MaybeRefOrGetter`，内部用 `toValue`/`toRef`；清理副作用。

### 常见 VueUse 映射（先确认已安装/版本）

| 需求 | 函数 | 调用策略 |
|---|---|---|
| 持久化本地状态 | `useLocalStorage` / `useSessionStorage` / `useStorage` | 已安装即可用；注意序列化/SSR |
| 防抖/节流 | `useDebounceFn` / `useThrottleFn` | 自动可用 |
| 媒体查询/断点 | `useMediaQuery` | 自动可用 |
| 点击外部关闭 | `onClickOutside` | 自动可用；绑定目标 ref |
| 事件监听 | `useEventListener` | 自动可用；自动清理 |
| 元素尺寸 | `useResizeObserver` / `useElementSize` | 自动可用 |
| 无限滚动 | `useInfiniteScroll` | 自动可用；注意容器/加载锁 |
| 异步状态 | `useAsyncState` | 自动可用；错误/取消要处理 |
| 剪贴板 | `useClipboard` | 自动可用；权限/失败降级 |
| 页面标题 | `useTitle` | 自动可用；SSR 注意 |
| 颜色模式 | `useColorMode` | 自动可用；避免闪烁 |
| 虚拟列表 | `useVirtualList` | 自动可用；大列表才用 |
| RxJS 集成 | `useObservable` / `from` | 需要 `rxjs` 已安装（EXTERNAL） |
| 音效 | `useSound` | 需要额外包（EXTERNAL） |

规则：没有安装就不自动加依赖；使用前查对应版本文档/类型；外部依赖未安装时先问用户。

## 4. 测试：Vitest + Vue Test Utils + Playwright

- 单元/组件测试用 Vitest + Vue Test Utils；E2E 用 Playwright。
- 组件测试走黑盒：从 props/用户交互/输出断言，不断言内部实现细节/私有状态。
- 异步更新用 `await flushPromises()`/`await nextTick()`；不要用固定 `setTimeout` 等待。
- 使用 Pinia 的组件测试要 `createPinia()` + `setActivePinia()`；需要初始 state 时用测试专用 store。
- composable 依赖生命周期/inject 时，用 helper 组件包一层再测。
- `defineAsyncComponent`/`Suspense` 测试要等待 resolve/fallback；Teleport 内容用 `document` 查询或 `attachTo`。
- 快照只能辅助，不能替代行为断言；不要只靠快照。
- E2E 覆盖关键用户路径、真实路由、真实 API/测试服务器；不把 E2E 当单元测试堆数量。
- 测试浏览器与 Node 环境差异：需要真实布局/计算样式/原生事件时用浏览器 runner。

## 5. Vite / 构建

- 环境变量用 `import.meta.env.VITE_*`；不要在前端暴露密钥。
- 路径别名只在项目已配置时使用；新项目默认相对导入，避免隐式魔法。
- 代码分割：路由级懒加载；大依赖按需引入；分析 bundle 后再优化。
- 构建产物 `dist/` 不进 git；`base`/public path 按部署环境配置。
- SSR/Nuxt：注意 `window/document` 只在客户端可用；状态每请求隔离； hydration 不匹配要定位原因，不要用 `ClientOnly` 掩盖所有问题。

## 6. 调试入口

- 状态不更新：检查 `.value`、解构、`reactive` 替换、数组/Map 内 ref。
- computed 不更新：检查条件依赖、是否改了返回值、是否在 getter 里做副作用。
- watcher 不触发/触发一次：检查源是 getter 还是对象、`deep`、`flush`、同 tick 批处理。
- 组件不渲染/找不到：检查局部注册、大小写、SFC 编译、路由/异步组件。
- 事件不触发：检查 `@click` 在自定义组件上的透传、`.native` 已移除、emits 声明。
- 路由参数变化不刷新：加参数 watch/守卫。
- Pinia 解构不更新：`storeToRefs`。
- 内存泄漏：监听器/定时器/订阅/AbortController 是否在卸载时清理。

更多症状见 `debugging.md`。

## 7. 自检

- [ ] 路由参数变化有处理；守卫异步有返回；无无限重定向。
- [ ] Pinia 按业务域拆；解构用 `storeToRefs`；持久化最小化。
- [ ] 没有未经确认新增依赖；使用 VueUse 前核对版本/API。
- [ ] 测试黑盒、异步正确等待、Pinia 正确初始化；E2E 覆盖关键路径。
- [ ] 构建/环境变量/SSR 边界清楚；性能优化有测量依据。
