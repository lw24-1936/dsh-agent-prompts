# 来源、版权与许可

本仓库包含三类内容，许可与归属分别如下。

## 1. 插件封装代码

`lib/`、`skills/` 中的执行层改写、`resources/scan-redlines.mjs`、测试、构建配置与文档：

> MIT License，见 [LICENSE](./LICENSE)。

## 2. 阿里巴巴 Java 开发手册（黄山版）

- 来源：《Java 开发手册（黄山版）》v1.7.1，2022.02.03 发布，版权归 **阿里巴巴集团** 所有。
- 本仓库 `resources/alibaba-java/01a…01h`、`02…08` 为条文的工程化快照，用于按需查阅；`skills/alibaba-java-standards.md` 的执行策略、分级、路由与速查表为本项目整理。
- `resources/alibaba-java/09-modern-java.md` 为本项目补充的现代 Java 说明（按项目 JDK 版本选择），不属阿里巴巴官方条文。
- 封装结构参考：[Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide)（MIT）。
- 手册相关开源项目：[alibaba/p3c](https://github.com/alibaba/p3c)。

## 3. 阿里巴巴前端代码规范（F2E Spec）

- 来源：[alibaba/f2e-spec](https://github.com/alibaba/f2e-spec)，MIT License。
- `resources/f2e-spec/original.md` 为原始 Skill 内容快照；`skills/f2e-spec.md` 在其基础上做了 Hooks / TypeScript / Vue 3 / 安全分级修订，`resources/f2e-spec/toolchain.md` 为本项目补充的工具链配置参考。
- 工具链示例引用 `eslint-config-ali`（16.x，MPL-2.0）的公开配置方式；本仓库不复制其规则源码。

## 4. 全栈原始文档

- `resources/reference/fullstack-single.original.md`、`resources/reference/fullstack-microservice.original.md`：随包保留的原始全栈提示词文档，版权归原作者，仅作对照用途；文件头已加「版本锁定不生效」说明，正文保留原文。本插件对其的压缩、拆分与改写不改变原文档的归属。

## 5. 参考 Skill 的学习来源

以下公开仓库为 0.6.0 起的学习与设计参考；本仓库吸收其方法并用自己的话重写，没有复制其大段正文、代码、脚本或资产。逐项映射见 [docs/REFERENCE-SKILL-ANALYSIS.md](./docs/REFERENCE-SKILL-ANALYSIS.md)。

| 来源 | 许可 | 本仓库使用方式 |
|---|---|---|
| [sivaprasadreddy/sivalabs-agent-skills](https://github.com/sivaprasadreddy/sivalabs-agent-skills) | MIT | Spring Boot 工程实践的学习总结 |
| [Lanqiao-Luca/ai-java-workflow](https://github.com/Lanqiao-Luca/ai-java-workflow) | MIT | 证据/审查/交付纪律与模板的学习总结 |
| [vuejs-ai/skills](https://github.com/vuejs-ai/skills) | MIT | Vue 3 工程实践与调试索引的学习总结 |
| [antfu/skills](https://github.com/antfu/skills) | MIT | 技能编写、PR/简化方法的学习总结 |
| [vueuse/skills](https://github.com/vueuse/skills) | MIT | 渐进披露与调用策略的学习总结 |
| [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | 见其 `LICENSE.txt` | 视觉方向/排版/文案原则的学习总结 |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT | 反 AI 味与浏览器验收的学习总结 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | 设计模式/评审 rubric/craft floor 的学习总结 |

如权利人认为某处使用不当，请开 issue，我们会调整或移除。

## 6. 示例与扫描器

- `resources/examples/` 下的正反例为本项目编写，MIT。
- `resources/scan-redlines.mjs` 为本项目编写，MIT；规则编号与条文引用来自上述手册与规约。

## 7. 免责说明

- 本插件是工程封装与执行策略，不是阿里巴巴官方产品，也不代表阿里巴巴对立项或条文的解释。
- 扫描器为启发式提示，不构成完整规约检查；正式质量门禁请使用 P3C / PMD / ESLint 与人工 review。
- 使用本插件产生的代码与决策由使用者负责。
