# Vue 3 调试速查（按症状）

> 先复现、再定位；一次只改一处；用最小复现/日志/DevTools 验证，不靠猜。

## 响应式

| 症状 | 常见原因 | 检查 |
|---|---|---|
| 页面不更新 | 忘记 `.value`；解构 `reactive`；替换了整个对象 | 模板/脚本访问方式；用 `toRefs`；不要整体替换 |
| ref 在数组/Map/Set 里不自动解包 | 模板只解包顶层 ref | 读取时 `.value` 或先取出 |
| 嵌套 ref 渲染 `[object Object]` | 模板只解包顶层 | 用 `toRef`/展开/调整数据结构 |
| 响应式对象比较恒 false | Proxy 身份不同 | 比较原始值/ID；用 `toRaw` 谨慎 |
| 第三方实例行为异常 | 被深度代理 | `markRaw`/`shallowRef` |
| watcher 每 tick 只触发一次 | 同 tick 批处理 | 需要逐次用 `flush: 'sync'`（谨慎） |

## computed

| 症状 | 原因 | 修复 |
|---|---|---|
| 不更新 | 依赖是条件分支/非响应式 | 确保所有依赖可追踪；拆分 computed |
| 修改值无效 | computed 只读 | 用源状态/可写 computed（明确 setter） |
| 原数组被排序/反转 | 直接 `sort/reverse` | 先 `[...arr]` 再操作 |
| getter 发请求/改状态 | 副作用 | 移到 watch/action；computed 保持纯 |
| 传参失败 | computed 不接受参数 | 用函数/computed 返回函数 |

## watcher

| 症状 | 原因 | 修复 |
|---|---|---|
| 不触发 | 监听对象属性方式不对 | 用 getter `() => obj.x` 或 `deep`（谨慎） |
| 只触发一次 | 源不是响应式/只读一次 | 检查源；需要立即执行加 `immediate` |
| 异步结果覆盖新结果 | 旧请求后返回 | `AbortController`/请求序号/忽略过期 |
| 回调里 DOM 还是旧值 | `flush` 时机 | `flush: 'post'` 或 `nextTick` |
| 深度监听 old/new 相同 | 同一对象引用 | 复制快照或比较具体字段 |
| 内存泄漏 | 异步回调里创建 watcher | 在 setup 同步创建；卸载清理 |

## 组件

| 症状 | 原因 | 修复 |
|---|---|---|
| 自定义组件点击无效 | 事件未声明/未透传 | `defineEmits` 并 `emit`；或 `$attrs` 透传 |
| 父组件拿不到子组件方法 | `<script setup>` 默认封闭 | `defineExpose` |
| 子组件找不到 | 局部注册遗漏/大小写 | 显式 import/注册；检查模板大小写 |
| 多根节点 attrs 警告 | 透传归属不明 | 显式绑定 `$attrs`/合并 |
| `v-if`+`v-for` 行为混乱 | 优先级/作用域 | 不同元素；computed 过滤 |
| 列表状态错乱 | 用 index 当 key | 稳定唯一 ID |
| KeepAlive 状态不更新 | 缓存实例未激活 | `onActivated` 刷新；明确 include/exclude |
| Teleport 内容找不到 | DOM 移到 body 外 | 测试/查询用 document 或 `attachTo` |

## 路由 / Pinia

| 症状 | 原因 | 修复 |
|---|---|---|
| 同路由不同参数不刷新 | 组件复用，不重新 mount | watch `route.params`/`beforeRouteUpdate` |
| 守卫卡死/无限重定向 | 未返回/未调用 next；无条件跳转 | 明确返回；判断目标路由 |
| 守卫里 `this` 未定义 | `beforeRouteEnter` 无 this | 回调/组合式 API |
| Pinia 解构不更新 | 丢响应性 | `storeToRefs` |
| `getActivePinia` 错误 | 测试/启动未安装 Pinia | `createPinia()` + `app.use` / `setActivePinia` |
| SSR 状态串用户 | 模块级单例 store | 每请求创建 store |

## 异步 / SSR

| 症状 | 原因 | 修复 |
|---|---|---|
| 异步组件不渲染 | 未处理 loading/error | `defineAsyncComponent` 的 loading/error/fallback |
| Suspense 卡住 | 异步 setup 未 resolve | 检查 promise；提供 fallback |
| Hydration mismatch | 服务端/客户端首屏不一致 | 固定数据/时间/随机；`ClientOnly` 只用于真正客户端内容 |
| 组件卸载后仍写状态 | 请求未取消 | AbortController/`onScopeDispose` 标记 |

## 排查顺序

1. 最小复现：删到只剩组件/状态/路由。
2. 看数据流：源状态 → computed → 模板；props/emits 是否断。
3. 看生命周期：mount/update/unmount；监听器/请求是否清理。
4. 看版本差异：Vue/Router/Pinia/VueUse API 是否匹配项目版本。
5. 加日志/断点/DevTools；一次只改一处，验证后继续。
