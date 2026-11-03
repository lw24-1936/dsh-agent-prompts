/**
 * dsh-agent-prompts —— 全栈开发/排查 + 阿里 Java/前端规约的 DSH 技能包。
 *
 * 设计：
 *   - 七个技能各自独立，靠 description 让模型在合适场景自行加载；
 *   - 技能正文放在 skills/*.md，运行时读盘，改文案不用改代码；
 *   - 每个技能声明 resourceBase（统一指向 resources/），模型可按需读取
 *     章节条文、原始文档与红线扫描器，不必一次性塞进上下文；
 *   - 用 skills 服务注册（source: 'bundled'），不依赖文件系统技能目录。
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(HERE, '..');
const SKILL_DIR = join(PACKAGE_ROOT, 'skills');

/**
 * 可选配置（在 profile 的 cordis 配置里传）：
 *   only: 只注册这些技能（默认全部）
 *   disabled: 排除这些技能
 * 名字必须与 catalog 中的 kebab-case 完全一致。无 Config schema，
 * 插件保持零运行时依赖；不传时注册全部。
 */

/**
 * description 决定「模型什么时候会想到用它」，必须写清触发场景；
 * 标准类技能的 description 里内联 P0 反例 token，即使模型没加载正文也有强制力。
 */
const SKILLS = [
  {
    file: 'alibaba-java-standards.md',
    name: 'alibaba-java-standards',
    kind: 'standards',
    description:
      '阿里巴巴 Java 开发手册（黄山版）执行层。写/改/review Java 或 SQL 时必须加载。P0 红线：禁 Executors 工厂与裸 new Thread；日期禁 SimpleDateFormat/java.util.Date（用 java.time）；SQL 禁 ${} 拼接、update/delete 必带 where；资源必须 try-with-resources；禁空 catch；集合禁 return null；ThreadLocal 必须 remove。新代码直接合规，被改到的存量代码发现即修复、不可口头豁免。含三级管控、章节路由（01a–09）与红线扫描器。',
    whenToUse:
      '写或修改 Java/SQL、review Java 代码、设计表、处理异常日志、补单测，或需要引用阿里规约编号时。',
  },
  {
    file: 'f2e-spec.md',
    name: 'f2e-spec',
    kind: 'standards',
    description:
      '阿里巴巴前端代码规范（F2E Spec）执行层。写/改/review JS/TS/React/Vue（框架与工具链版本按项目）时加载。覆盖 2 空格/100 列/分号/引号、const/let/===、Hooks 规则、v-for 稳定 key、v-if 不与 v-for 同元素、命名与注释、性能、a11y；P0 安全红线：禁 eval、v-html/dangerouslySetInnerHTML 未消毒、target=_blank 缺 noopener。含 ESLint/Prettier/tsconfig 配置与前端红线扫描。',
    whenToUse:
      '写或修改前端页面/组件、review 前端代码、配置 ESLint/Prettier、排查渲染或 XSS 问题时。',
  },
  {
    file: 'software-engineering-process.md',
    name: 'software-engineering-process',
    kind: 'process',
    description:
      '软件工程开发流程自动选择与执行。开工前读项目约束（需求稳定性、合规/安全、合同/交付节奏、团队规模、存量占比、反馈通道），自动选 Waterfall / V-Model / 增量 / 迭代 / Spiral / Scrum / Kanban / XP / DevOps / 混合门禁，并给出节奏、产物、门禁与重选条件；不让用户先选方法论。含流程库、场景模板、DoR/DoD、度量与反模式。',
    whenToUse:
      '开始新项目/新模块/大改动、需要排期与拆分、用户问「用什么开发流程」，或现有流程明显不适配时。',
  },
  {
    file: 'fullstack-monolith-dev.md',
    name: 'fullstack-monolith-dev',
    kind: 'fullstack',
    description:
      '单体全栈项目的开发规范：Vue + TypeScript + Vite + Pinia 前端，Spring Boot + JDK + MyBatis-Plus + Sa-Token 后端（框架与 JDK 版本按项目，不硬绑）。当要新建或修改单体全栈项目、需要统一技术栈与结构、四套环境、RBAC 权限、统一返回体、DEV.md/DESIGN.md 双文档同步时加载。编码细节联动 alibaba-java-standards / f2e-spec。',
    whenToUse:
      '用户要做单体全栈项目、加接口、加页面，或要求「按规范」交付代码与文档时。',
  },
  {
    file: 'fullstack-monolith-debug.md',
    name: 'fullstack-monolith-debug',
    kind: 'fullstack',
    description:
      '单体全栈项目的问题排查规范：先复现再定位、分层排除、按 traceId 读日志、一次只改一处、排查记录写进 DEV.md。当用户报「接口 500/401/403/404」「数据不一致」「查询慢」「连不上中间件」等单体应用故障时加载。修复代码同样受 P0 红线约束。',
    whenToUse:
      '排查单体应用的线上/测试环境故障，或需要一套不瞎改的定位流程时。',
  },
  {
    file: 'fullstack-microservice-dev.md',
    name: 'fullstack-microservice-dev',
    kind: 'fullstack',
    description:
      '微服务项目的开发规范：Spring Cloud Alibaba（Nacos 注册与配置 / Gateway / OpenFeign / Sentinel / Seata）+ Maven 多模块，含服务拆分、端口分配、Feign 契约放 api 模块、网关动态路由、traceId 透传、每服务独立库；技术版本以项目 POM/BOM 为准，不硬绑。当要新建或扩展 Spring Cloud 微服务项目时加载。编码细节联动 alibaba-java-standards / f2e-spec。',
    whenToUse:
      '用户要做微服务架构项目，或要在既有微服务里加服务、加接口、配网关路由时。',
  },
  {
    file: 'fullstack-microservice-debug.md',
    name: 'fullstack-microservice-debug',
    kind: 'fullstack',
    description:
      '微服务项目的问题排查规范：先确认请求走到哪个服务，再按网关→注册中心→目标服务→下游→中间件顺序排除；覆盖 Nacos 注册失败、网关 404、Feign 超时与 fallback 吞异常、Sentinel 熔断、Seata 不回滚、MQ 堆积等故障模式。排微服务故障时加载。修复代码同样受 P0 红线约束。',
    whenToUse:
      '排查微服务链路问题、跨服务调用异常、配置不生效、分布式事务异常时。',
  },
];

/** 硬依赖 skills 服务；服务不在时不激活，而不是静默不生效 */
const inject = ['skills'];

function apply(ctx, config = {}) {
  const only = new Set(Array.isArray(config.only) ? config.only : []);
  const disabled = new Set(Array.isArray(config.disabled) ? config.disabled : []);
  const known = new Set(SKILLS.map((spec) => spec.name));
  for (const requested of [...only, ...disabled]) {
    if (!known.has(requested)) {
      ctx.logger?.warn?.(`[dsh-agent-prompts] 配置里的技能名不存在：${requested}`);
    }
  }

  const disposers = [];
  for (const spec of SKILLS) {
    if (only.size > 0 && !only.has(spec.name)) continue;
    if (disabled.has(spec.name)) continue;
    let content;
    try {
      content = readFileSync(join(SKILL_DIR, spec.file), 'utf8');
    } catch (err) {
      ctx.logger?.warn?.(
        `[dsh-agent-prompts] 跳过技能 ${spec.name}：读取 ${spec.file} 失败（${err.message}）`,
      );
      continue;
    }

    const resourcePath = join(PACKAGE_ROOT, 'resources');
    let resourceBase;
    try {
      if (!existsSync(resourcePath) || !statSync(resourcePath).isDirectory()) {
        throw new Error('资源目录不存在');
      }
      resourceBase = { kind: 'directory', path: resourcePath };
    } catch (err) {
      ctx.logger?.warn?.(
        `[dsh-agent-prompts] 技能 ${spec.name} 的资源目录不可用（resources: ${err.message}），将只加载正文`,
      );
    }

    disposers.push(
      ctx.skills.register({
        name: spec.name,
        description: spec.description,
        whenToUse: spec.whenToUse,
        content,
        source: 'bundled',
        invocation: { modelInvocable: true, userInvocable: true },
        ...(resourceBase ? { resourceBase } : {}),
        metadata: {
          pack: 'dsh-agent-prompts',
          file: spec.file,
          kind: spec.kind,
          resources: 'resources',
        },
      }),
    );
  }

  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {
        // 卸载阶段的清理失败不应阻断其余技能注销
      }
    }
    disposers.length = 0;
  };
}

const name = 'dsh-agent-prompts';

export { apply, inject, name, SKILLS };
