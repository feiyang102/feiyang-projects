# Monorepo 技术演示项目

一个完整的 Monorepo 架构示例，展示现代前端开发的最佳实践。

## 🚀 项目概述

本项目采用 Monorepo 架构，包含以下核心模块：

### 📦 包结构

```
monorepo/
├── packages/           # 共享包
│   ├── ui/            # UI组件库
│   └── utils/         # 工具函数库
├── apps/              # 应用
│   ├── web/           # 前端React应用
│   └── api/           # 后端Node.js API
└── 配置文件
```

## 🛠️ 技术栈

### 前端技术
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **React Router** - 客户端路由
- **CSS Modules** - 样式隔离

### 后端技术
- **Node.js** - JavaScript运行时
- **Express.js** - Web应用框架
- **TypeScript** - 类型安全
- **中间件栈** - CORS、Helmet、Compression等

### 开发工具
- **npm Workspaces** - Monorepo管理
- **TypeScript** - 统一类型系统
- **ESLint** - 代码质量检查
- **Jest** - 单元测试

## 📋 功能特性

### UI组件库 (@monorepo/ui)
- ✅ 按钮组件（多种变体、尺寸）
- ✅ 输入框组件（标签、验证状态）
- ✅ 卡片组件（阴影、头部、内容区）
- ✅ 响应式设计
- ✅ TypeScript类型定义

### 工具函数库 (@monorepo/utils)
- ✅ 日期格式化工具
- ✅ 字符串处理函数
- ✅ 验证工具（邮箱、URL等）
- ✅ 随机数生成
- ✅ 防抖节流函数

### 前端应用 (@monorepo/web)
- ✅ React 18 + TypeScript
- ✅ Vite开发服务器
- ✅ 路由系统
- ✅ UI组件集成
- ✅ 工具函数演示
- ✅ 响应式布局

### 后端API (@monorepo/api)
- ✅ Express服务器
- ✅ RESTful API设计
- ✅ 中间件集成
- ✅ 用户管理CRUD
- ✅ 错误处理
- ✅ 健康检查

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装所有包的依赖
npm install

# 或者使用workspace命令
npm run install:all
```

### 开发模式

```bash
# 同时启动前端和后端
npm run dev

# 单独启动前端
npm run dev:web

# 单独启动后端
npm run dev:api
```

### 构建项目

```bash
# 构建所有包
npm run build

# 单独构建特定包
npm run build:ui
npm run build:utils
npm run build:web
npm run build:api
```

## 🌐 访问地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API健康检查**: http://localhost:3001/health

## 📖 使用示例

### 在前端应用中使用共享包

```typescript
// 导入UI组件
import { Button, Input, Card } from '@monorepo/ui'

// 导入工具函数
import { formatDate, debounce } from '@monorepo/utils'
```

### 在后端API中使用工具函数

```typescript
import { formatDate, isValidEmail } from '@monorepo/utils'

// 在路由中使用
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})
```

## 🏗️ 架构优势

### 代码共享
- 统一的工具函数库，避免重复代码
- 共享的UI组件，保证设计一致性
- 类型定义共享，提高开发效率

### 开发效率
- 热重载开发环境
- 统一的构建和测试流程
- 依赖管理简化

### 维护性
- 模块化架构，易于扩展
- 统一的代码规范
- 集中的版本管理

## 🔧 开发指南

### 添加新包

1. 在 `packages/` 目录创建新包
2. 配置包的 `package.json`
3. 在根目录 `tsconfig.json` 中添加路径映射
4. 在其他包中通过workspace引用

### 包间依赖

使用workspace协议声明依赖：

```json
{
  "dependencies": {
    "@monorepo/ui": "workspace:*",
    "@monorepo/utils": "workspace:*"
  }
}
```

### 版本管理

所有包共享版本号，通过根目录的 `package.json` 统一管理。

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定包的测试
npm test --workspace=@monorepo/ui
```

## 📊 项目统计

- **总包数**: 4个
- **代码行数**: 约2000+行
- **技术特性**: 15+个
- **API端点**: 10+个

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

感谢以下开源项目的启发：
- Turborepo
- Nx
- Lerna
- Vite
- React
- Express.js

---

**Happy Coding! 🎉**