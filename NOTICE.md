# 来源、版权与许可

本仓库包含三类内容，许可与归属分别如下。

## 1. 插件封装代码

`lib/`、`skills/` 中的执行层改写、`resources/scan-redlines.mjs`、测试、构建配置与文档：

> MIT License，见 [LICENSE](./LICENSE)。

## 2. 阿里巴巴 Java 开发手册（黄山版）

- 来源：《Java 开发手册（黄山版）》v1.7.1，2022.02.03 发布，版权归 **阿里巴巴集团** 所有。
- 本仓库 `resources/alibaba-java/01…08` 为条文的工程化快照，用于按需查阅；`skills/alibaba-java-standards.md` 的执行策略、分级、路由与速查表为本项目整理。
- 封装结构参考：[Sxuan-Coder/alibaba-java-development-guide](https://github.com/Sxuan-Coder/alibaba-java-development-guide)（MIT）。
- 手册相关开源项目：[alibaba/p3c](https://github.com/alibaba/p3c)。

## 3. 阿里巴巴前端代码规范（F2E Spec）

- 来源：[alibaba/f2e-spec](https://github.com/alibaba/f2e-spec)，MIT License。
- `resources/f2e-spec/original.md` 为原始 Skill 内容快照；`skills/f2e-spec.md` 在其基础上做了 Hooks / TypeScript / Vue 3 / 安全分级修订，`resources/f2e-spec/toolchain.md` 为本项目补充的工具链配置参考。

## 4. 全栈原始文档

- `resources/reference/fullstack-single.original.md`、`resources/reference/fullstack-microservice.original.md`：随包保留的原始全栈提示词文档，版权归原作者，仅作对照用途；本插件对其的压缩、拆分与改写不改变原文档的归属。

## 5. 免责说明

- 本插件是工程封装与执行策略，不是阿里巴巴官方产品，也不代表阿里巴巴对立项或条文的解释。
- 扫描器为启发式提示，不构成完整规约检查；正式质量门禁请使用 P3C / PMD / ESLint 与人工 review。
- 使用本插件产生的代码与决策由使用者负责。
