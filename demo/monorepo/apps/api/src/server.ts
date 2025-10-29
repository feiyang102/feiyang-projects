import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { formatDate } from '@monorepo/utils'
import { requestLogger, responseTimeHeader, apiVersion } from './middleware/logger'
import userRoutes from './routes/users'
import demoRoutes from './routes/demo'

const app: express.Application = express()
const PORT = process.env.PORT || 3001

// 中间件配置
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)
app.use(responseTimeHeader)
app.use(apiVersion)

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API 路由
app.use('/api/users', userRoutes)
app.use('/api/demo', demoRoutes)

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 全局错误处理
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`)
  console.log(`🎯 Demo API: http://localhost:${PORT}/api/demo`)
  console.log(`⏰ Server started at: ${formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}`)
})

export default app