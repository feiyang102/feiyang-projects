# @monorepo/api

后端API服务，基于Node.js和Express构建，提供RESTful API接口。

## 功能特性

- ✅ Express服务器配置
- ✅ 中间件集成（CORS、Helmet、Compression等）
- ✅ 自定义中间件（日志记录、响应时间、API版本）
- ✅ 用户管理API（完整的CRUD操作）
- ✅ 演示API（工具函数展示、性能测试）
- ✅ 错误处理和验证
- ✅ TypeScript支持
- ✅ 健康检查接口

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

### 生产模式

```bash
npm run build
npm start
```

## API接口

### 健康检查

```http
GET /health
```

### 用户管理

```http
GET    /api/users          # 获取用户列表（支持分页）
GET    /api/users/:id      # 根据ID获取用户
POST   /api/users          # 创建新用户
PUT    /api/users/:id      # 更新用户信息
DELETE /api/users/:id      # 删除用户
POST   /api/users/random   # 生成随机用户
```

### 演示接口

```http
GET /api/demo/utils        # 工具函数演示
GET /api/demo/data         # 模拟数据演示
GET /api/demo/performance  # 性能测试演示
GET /api/demo/error-demo   # 错误处理演示
GET /api/demo/realtime     # 实时数据演示
```

## 项目结构

```
src/
├── server.ts          # 服务器入口文件
├── routes/
│   ├── users.ts       # 用户路由
│   └── demo.ts        # 演示路由
├── middleware/
│   └── logger.ts      # 自定义中间件
└── controllers/        # 控制器（预留）
```

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **构建工具**: tsx
- **安全**: Helmet、CORS
- **性能**: Compression
- **日志**: Morgan、自定义日志中间件

## 环境变量

```bash
PORT=3001              # 服务器端口
NODE_ENV=development    # 环境模式
```

## 开发说明

### 添加新路由

1. 在 `src/routes/` 目录创建新的路由文件
2. 在 `src/server.ts` 中导入并注册路由
3. 确保使用适当的中间件和错误处理

### 自定义中间件

中间件文件位于 `src/middleware/` 目录，可以添加：
- 认证中间件
- 权限验证
- 数据验证
- 缓存中间件

### 错误处理

API使用统一的错误响应格式：

```json
{
  "error": "ERROR_TYPE",
  "message": "错误描述",
  "timestamp": "2024-01-01 12:00:00"
}
```

## 测试

```bash
npm test
```

## 代码检查

```bash
npm run lint
```