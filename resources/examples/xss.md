# XSS：v-html / dangerouslySetInnerHTML / target=_blank

- 规则：`F2E_V_HTML` / `F2E_DANGEROUS_HTML` / `F2E_TARGET_BLANK`
- 规范：前端安全 P0

## ❌ 反例

```vue
<div v-html="comment.content"></div>
```

```tsx
<div dangerouslySetInnerHTML={{ __html: comment.content }} />
```

```html
<a href="/x" target="_blank">打开</a>
```

问题：未信任 HTML 直接渲染导致 XSS；`target=_blank` 未加 `noopener` 可被反向控制 opener。

## ✅ 正例

```ts
import DOMPurify from 'dompurify';

const safeHtml = computed(() =>
  DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } }),
);
```

```vue
<div v-html="safeHtml"></div>
```

```html
<a href="/x" target="_blank" rel="noopener noreferrer">打开</a>
```

要点：

- 优先用文本插值，不用 HTML 渲染；
- 必须渲染 HTML 时先消毒，并限制允许的标签/属性；
- 外链统一 `rel="noopener noreferrer"`；
- 不在前端硬编码密钥，跳转前校验目标地址。
