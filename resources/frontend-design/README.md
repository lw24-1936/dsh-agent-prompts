# 前端视觉设计（按需查阅）

> 用于“做页面/改页面/评审页面”的视觉方向与设计质量。它不替代组件规范与代码规范，而是补上**审美、层级、排版、动效、反 AI 味与浏览器验收**。
>
> 只读当前任务需要的文件；不要一次载入全部。

| 文件 | 内容 | 何时读 |
|---|---|---|
| `brief-and-direction.md` | 需求简报、surface 模式、视觉方向、排版/色彩/布局/动效、参考图 | 开始设计/改版前 |
| `visual-review.md` | 评审维度、认知负荷、Nielsen 启发式、P0–P3 分级 | 设计/代码评审 |
| `browser-check.md` | 四档视口、截图、状态、键盘、对比度、reduced-motion 验收 | 实现后/交付前 |
| `check-design.mjs` | 保守静态反模式检查（可做 `--fail-on P1` 门禁） | 实现后/CI |
| `anti-slop.md` | 通用 AI 味页面清单与替代方案 | 设计/评审/自查 |
| `patterns.md` | 落地页/后台/文档/表单/空态/错误态的版式套路 | 选版式时 |

## 三条底线

1. **先定方向，再写代码**：subject、audience、主要任务、surface 模式没定，不要直接套模板。
2. **真实内容与真实状态**：不编造客户/评价/数据；必须有 loading / empty / error / 边界四态。
3. **必须看渲染结果**：在 1440 / 1024 / 768 / 390 四个宽度检查；只读源码不算验收。

## 来源

学习总结自：

- [Anthropic Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Taste Skill](https://github.com/Leonxlnx/taste-skill)（MIT）
- [Impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）
- 以及 WCAG / Nielsen 可用性启发式 / 排版与动效的公开资料

不是原文复制；具体归属见仓库根 `NOTICE.md`。
