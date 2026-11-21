# Vue SFC 块顺序：template → script → style

- 规则：`F2E_SFC_ORDER`
- 规范：Vue 2 / Vue 3 的 `.vue` 页面与组件都按此顺序；无模板的 render-function 组件例外。

## ❌ 反例：script-first

```vue
<script setup lang="ts">
const title = 'Order';
</script>

<template>
  <h1>{{ title }}</h1>
</template>

<style scoped>
h1 { color: #111; }
</style>
```

问题：与项目统一阅读顺序不一致；review 时先看到逻辑、后看到结构，且扫描器会报 `F2E_SFC_ORDER`。

## ✅ 正例：模板第一、脚本第二、样式最后

```vue
<!-- 1. 模板 -->
<template>
  <h1>{{ title }}</h1>
</template>

<!-- 2. 脚本 -->
<script setup lang="ts">
const title = 'Order';
</script>

<!-- 3. 样式 -->
<style scoped>
h1 { color: #111; }
</style>
```

要点：

- 顶层块顺序固定；`<style>` 只保留一个，`scoped` 优先。
- 全局 reset/token 放独立样式文件，不塞进页面 SFC。
- 存量组件被触碰时一并调整，不要只改新文件。
- 无模板的 render-function 组件可以 `script` 在前；纯 `.ts` composable 不适用。
