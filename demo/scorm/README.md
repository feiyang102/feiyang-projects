# SCORM Monorepo 项目

这是一个使用pnpm管理的Monorepo项目，包含Vue 3前端和Express后端应用。

## 项目结构

```
├── packages/
│   ├── frontend/  # Vue 3 前端应用
│   └── backend/   # Express 后端应用
├── package.json
└── pnpm-workspace.yaml
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

同时启动前后端开发服务器：

```bash
pnpm dev
```

或者分别启动：

```bash
pnpm dev:frontend  # 启动前端开发服务器
pnpm dev:backend   # 启动后端开发服务器
```

### 构建

构建所有项目：

```bash
pnpm build
```

或者分别构建：

```bash
pnpm build:frontend  # 构建前端
pnpm build:backend   # 构建后端
```

## 项目说明

### 前端 (Vue 3)

- 基于Vue 3 + Vite构建
- 提供课程列表展示和添加课程功能
- 调用后端API获取和提交数据

### 后端 (Express)

- 基于Express构建的RESTful API服务
- 提供课程相关的API接口
- 包含CORS中间件支持跨域请求

### API接口

- `GET /api/courses` - 获取所有课程列表
- `GET /api/courses/:id` - 获取单个课程详情
- `POST /api/courses` - 添加新课程