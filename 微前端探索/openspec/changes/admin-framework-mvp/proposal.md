# Proposal

## Why

每新建一个 Vue3 管理后台，都要重复实现同一套布局、路由、菜单、登录态和按钮权限；复制模板又导致修一次 bug 要改 N 个仓库。同时缺少一个可运行的微前端样本，无法在实践中理解隔离、路由归属与跨应用通信。

本项目提供一个可被业务项目 import 的运行时基座，并附带可独立运行、可被挂载的子应用模板，用于学习与复用。

## What Changes

- 新增 pnpm monorepo，包含 `@admin/core`、`@admin/ui`、`@admin/auth`、`@admin/micro`、`@admin/bridge`、`@admin/cli` 六个包。
- 新增 `createAdminApp()` 应用工厂：约 30 行完成初始化，负责配置校验、路由编排、守卫安装与布局挂载。
- 新增「路由即清单」模型：菜单、面包屑、页签、keep-alive、权限全部从路由 meta 派生，不提供独立菜单配置。
- 新增静态菜单 + 接口覆盖（title/icon/order/hidden），接口不可新增页面，失败回退静态配置。
- 新增权限模型：后端返回扁平权限码，支持路由级、菜单级、按钮级（指令/组件/composable）三种消费方式。
- 新增 `@admin/micro`：`MicroAppAdapter` 接口 + wujie 实现 + iframe 降级，基座持有 URL 主权，支持深链刷新与故障兜底。
- 新增 `@admin/bridge`：类型化事件与请求-响应代理，仅传可序列化快照。
- 新增 CLI 生成基座模板与子应用模板；新增 `examples/playground` 与 `examples/remote-order` 作为契约示例。
- 新增主题令牌（CSS 变量）与运行时配置入口，为后续换肤、多环境部署预留形状。

## Capabilities

### New Capabilities

- `admin/app-shell`: 应用工厂、配置校验与迁移、启动时序、模块注册、生命周期钩子与错误处理
- `admin/routing-menu`: 路由即清单、菜单/面包屑/页签派生、静态菜单与接口覆盖合并、失败回退
- `admin/access-control`: `/auth/me` 契约、权限码规范与匹配、路由守卫、按钮级指令与组件
- `admin/layout-tabs`: 后台布局、侧边菜单、多页签、keep-alive、403/404/500 错误页
- `admin/micro-frontend`: 子应用定义与注册、适配器接口、wujie/iframe 实现、路由归属、props 与 bridge 通信、故障降级
- `admin/scaffolding`: monorepo 包划分与依赖规则、构建产出的 exports 与 peer 依赖、CLI 模板生成、外部工程安装验证
- `admin/data-layer`: 请求超时/重试/去重/拦截与错误规范化、列表查询与地址栏同步、字典缓存、格式化与文件工具

### Modified Capabilities

无（项目此前无任何 spec）。

## Impact

- 新增代码：`packages/*`、`examples/*`、根级 workspace 与构建配置。
- 新增依赖：vue 3、vue-router 4、pinia、element-plus（可选 peer）、wujie（可选 peer）、tsup、vite、vitest、typescript。
- 不涉及后端改造；仅约定 `/auth/me`、`/auth/login`、`/menus/overrides` 三个接口契约。
- 不影响现有代码（仓库当前仅有 OpenSpec 空目录）。
- 非目标：SSO、多租户、数据权限、国际化、暗色主题、移动端、Module Federation 适配器、低代码。
