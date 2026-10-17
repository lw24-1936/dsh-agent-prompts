/**
 * dsh-agent-prompts —— 把「全栈开发 / 排查」提示词做成 DSH 技能包。
 *
 * 设计：
 *   - 四个技能各自独立，靠 description 与 whenToUse 让模型在合适的场景自行加载，
 *     不需要用户手动贴一坨提示词；
 *   - 技能正文放在 skills/*.md，运行时读盘，改文案不用改代码；
 *   - 用 skills 服务注册（source: 'bundled'），不依赖文件系统技能目录，
 *     因此装到哪个 profile 都能用。
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(HERE, '..', 'skills');

/**
 * description 决定「模型什么时候会想到用它」，必须写清触发场景；
 * whenToUse 是补充给用户的提示。
 */
const SKILLS = [
  {
    file: 'fullstack-monolith-dev.md',
    name: 'fullstack-monolith-dev',
    description:
      '单体全栈项目的开发规范：Vue 3 + TypeScript + Vite + Pinia 前端，Spring Boot 3 + JDK 21 + MyBatis-Plus + Sa-Token 后端。当要新建或修改单体全栈项目、需要固定技术栈、四套环境、RBAC 权限、统一返回体、DEV.md/DESIGN.md 双文档同步时加载。',
    whenToUse:
      '用户要做单体全栈项目、加接口、加页面，或要求「按规范」交付代码与文档时。',
  },
  {
    file: 'fullstack-monolith-debug.md',
    name: 'fullstack-monolith-debug',
    description:
      '单体全栈项目的问题排查规范：先复现再定位、分层排除、按 traceId 读日志、一次只改一处、排查记录写进 DEV.md。当用户报「接口 500/401/403/404」「数据不一致」「查询慢」「连不上中间件」等单体应用故障时加载。',
    whenToUse:
      '排查单体应用的线上/测试环境故障，或需要一套不瞎改的定位流程时。',
  },
  {
    file: 'fullstack-microservice-dev.md',
    name: 'fullstack-microservice-dev',
    description:
      '微服务项目的开发规范：Spring Cloud Alibaba（Nacos 注册与配置 / Gateway / OpenFeign / Sentinel / Seata）+ Maven 多模块，含服务拆分、端口分配、Feign 契约放 api 模块、网关动态路由、traceId 透传、每服务独立库。当要新建或扩展 Spring Cloud 微服务项目时加载。',
    whenToUse:
      '用户要做微服务架构项目，或要在既有微服务里加服务、加接口、配网关路由时。',
  },
  {
    file: 'fullstack-microservice-debug.md',
    name: 'fullstack-microservice-debug',
    description:
      '微服务项目的问题排查规范：先确认请求走到哪个服务，再按网关→注册中心→目标服务→下游→中间件顺序排除；覆盖 Nacos 注册失败、网关 404、Feign 超时与 fallback 吞异常、Sentinel 熔断、Seata 不回滚、MQ 堆积等故障模式。排微服务故障时加载。',
    whenToUse:
      '排查微服务链路问题、跨服务调用异常、配置不生效、分布式事务异常时。',
  },
];

/** 硬依赖 skills 服务；服务不在时不激活，而不是静默不生效 */
const inject = ['skills'];

function apply(ctx) {
  for (const spec of SKILLS) {
    let content;
    try {
      content = readFileSync(join(SKILL_DIR, spec.file), 'utf8');
    } catch (err) {
      ctx.logger?.warn?.(
        `[dsh-agent-prompts] 跳过技能 ${spec.name}：读取 ${spec.file} 失败（${err.message}）`,
      );
      continue;
    }
    ctx.skills.register({
      name: spec.name,
      description: spec.description,
      whenToUse: spec.whenToUse,
      content,
      source: 'bundled',
      invocation: { modelInvocable: true, userInvocable: true },
      metadata: { pack: 'dsh-agent-prompts', file: spec.file },
    });
  }
}

const name = 'dsh-agent-prompts';

export { apply, inject, name };
