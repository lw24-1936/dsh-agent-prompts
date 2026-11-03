# Vue（Vue 3 示例）：v-for key / v-if 与 v-for 同元素

- 规则：`F2E_V_FOR_NO_KEY` / `F2E_V_IF_FOR` / `F2E_INDEX_KEY`
- 规范：Vue 列表渲染（Vue 2 用 Options API 等价写法，不强制升级）

## ❌ 反例

```vue
<li v-for="item in items">{{ item.name }}</li>
<li v-for="row in rows" v-if="row.visible" :key="row.id">{{ row.name }}</li>
<li v-for="(item, index) in items" :key="index">{{ item.name }}</li>
```

问题：缺 key 或使用索引 key，列表重排/删除时复用错节点；`v-if` 与 `v-for` 同元素优先级不直观。

## ✅ 正例

```vue
<li v-for="item in items" :key="item.id">{{ item.name }}</li>

<template v-for="row in rows" :key="row.id">
  <li v-if="row.visible">{{ row.name }}</li>
</template>

<!-- 或先在 computed 过滤 -->
<li v-for="row in visibleRows" :key="row.id">{{ row.name }}</li>
```

要点：

- key 用业务唯一 ID，不用数组索引；
- `v-if` 与 `v-for` 不同元素；优先 computed 过滤；
- 列表项组件避免内联对象 props，防止 memo 失效（React 同理）。
