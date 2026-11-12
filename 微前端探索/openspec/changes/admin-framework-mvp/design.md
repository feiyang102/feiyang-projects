# Design

## Context

探索阶段的完整产物见 `2026-11-11/openspec-explore/outputs/`（探索报告、方案设计、决策记录、能力扩展规划）。本文只记录本次实现需要落定的技术决策，不重复 spec 中的行为约定。

当前仓库为空（仅 OpenSpec 目录），无既有代码约束。已确认前提：

- 全新子应用，无 Vue2/jQuery 存量，可统一模板。
- 学习导向，优先最小闭环而非企业级完备度。
- monorepo 管理，业务项目通过 npm 包引入。
- 菜单静态定义 + 接口覆盖。

## Goals / Non-Goals

**Goals**

- 一个可运行的最小闭环：登录 → 菜单 → 受控路由 → 页签 → 挂载子应用。
- 每个包可独立构建，依赖方向可被检查强制。
- 关键契约（`/auth/me`、路由 meta、主题令牌、`configVersion`）形状正确，后续扩展不必重写。
- 示例工程同时充当契约回归测试。

**Non-Goals**

- 不做动态菜单树下发、数据权限、多租户、SSO、国际化、暗色主题、移动端。
- 不做 Module Federation / qiankun 适配器。
- 不做可视化搭建与权限管理后台。
- 不追求零配置兼容任意技术栈子应用。

## Decisions

### D1 用 pnpm workspace + tsup，不用 Nx/Turborepo

包数量 6 个，构建产物是标准 ESM + d.ts。pnpm 的 workspace 协议已能处理本地引用，`turbo` 只带来缓存收益，当前规模不足以抵消配置成本。

替代方案：Nx（生成器强但抽象重）、直接 npm workspaces（安装慢、幽灵依赖多）。

### D2 路由即清单，不提供菜单配置

菜单、面包屑、页签、keep-alive、权限全部从 `RouteMeta` 派生。核心考量是可校验性：菜单与路由分离后，静态分析无法发现「菜单指向不存在的路由」。

替代方案：独立 `menu.config.ts`（灵活但双份真相）、后端全量菜单树（需组件白名单，当前不需要）。

### D3 静态路由 + 运行时权限过滤，而非动态 addRoute

权限过滤用纯函数在启动时生成可访问路由树，过滤结果同时供菜单使用。React 风格的动态 `addRoute` 会引入「路由已存在/未注册」的时序问题，且在刷新时需要重建。

替代方案：`router.addRoute` 动态注册（适合后端下发菜单树的场景，当前不做）。

### D4 微前端适配器接口放 core 类型层，实现放 `@admin/micro`

`core` 只声明 `MicroAppAdapter` / `MicroAppDefinition` 类型，不引用 wujie。业务项目不装 `@admin/micro` 时，类型仍在但运行时无实现。

替代方案：micro 完全独立不依赖 core（会导致子应用定义与路由 meta 契约分裂）。

### D5 默认 wujie，iframe 兜底

全新 Vue3 子应用、UI 库弹层多、需要样式隔离，wujie 的 iframe 沙箱最省适配成本。iframe 适配器不引入任何依赖，用于 wujie 加载失败或环境不支持的场景。

替代方案：qiankun（Vite/ESM 支持差）、micro-app（样式隔离对 UI 库覆盖不足）、MF（不解决应用隔离）。

### D6 子应用使用 web history + 与基座路由解耦的 catch-all

基座为每个子应用生成 `/order/:pathMatch(.*)*` 路由，子应用 `createWebHistory('/order')`。不开启 wujie 的 URL 同步，避免两个 router 同时 push。

风险最高，需在实现时先做 spike：验证前进/后退、同路径重复 push、query 变化。若双 router 冲突不可控，退回「子应用 memory history + 基座监听路径映射」。

### D7 权限模型：扁平权限码 + 通配

后端返回 `permissions: string[]`，前端只做匹配，不展开角色。`*` 与 `domain:resource:*` 两种通配足够覆盖当前场景，避免引入策略引擎。

替代方案：纯角色映射（双份映射必然漂移）、ABAC（前端无法离线判断）。

### D8 主题只通过 CSS 变量

布局与内置组件只消费 `--admin-*` 令牌；子应用通过继承的令牌保持一致。不提供 JS 主题对象作为主要通道，避免样式与运行时两套主题来源。

### D9 CLI 先做最小模板复制，不做交互式生成器

`create-admin` 只做「复制模板目录 + 替换包名/标题 + 打印后续命令」。交互式问答、插件化生成器属于后期。

### D10 配置校验用 zod，迁移函数按版本串联

`normalizeOptions` 顺序：`runMigrations` → `zod.parse` → `applyDefaults` → `warnDeprecated`。当前只有 v1，但骨架先建好。

## Risks / Trade-offs

- **双 router 监听 popstate 冲突** → 先 spike，准备 memory history 备选方案。
- **wujie 社区规模小于 qiankun** → 适配器接口隔离，必要时可替换实现。
- **Element Plus 类型泄漏** → 公共 API 使用自有类型，UI 库仅在 `@admin/ui` 内部引用。
- **6 个包对学习项目偏重** → 包只做骨架，单包代码量控制在数百行；后续能力按扩展规划增加。
- **菜单接口增加一次启动请求** → 3s 超时 + 失败回退静态配置，不阻塞首屏。
- **多实例 Vue** → `peerDependencies` + tsup external，示例工程验证。

## Migration Plan

仓库为空，无历史数据与线上流量，不需要迁移与回滚策略。发布顺序：先本地 `pnpm pack` 验证外部安装，再决定是否发公共 npm。

## Open Questions

- UI 库最终是否固定 Element Plus（当前按默认值实现，适配层隔离，可替换）。
- 是否发公共 npm 及 scope 名称（不阻塞实现）。
