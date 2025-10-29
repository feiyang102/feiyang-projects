import { Request, Response, NextFunction } from 'express'
import { formatDate } from '@monorepo/utils'

// 自定义请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // 记录请求开始
  console.log(`[${formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.path} - Started`)
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    console.log(`[${formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}

// 响应时间头中间件
export const responseTimeHeader = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // 在响应发送前设置响应时间头
  res.on('finish', () => {
    const duration = Date.now() - startTime
    // 注意：在finish事件中设置响应头会导致错误
    // 这里只记录日志，不设置响应头
    console.log(`[Response Time] ${req.method} ${req.path}: ${duration}ms`)
  })
  
  // 在响应发送前设置响应时间头
  res.setHeader('X-Response-Time', 'calculating')
  
  next()
}

// API版本中间件
export const apiVersion = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-API-Version', '1.0.0')
  res.setHeader('X-API-Build', formatDate(new Date(), 'YYYYMMDDHHmmss'))
  next()
}