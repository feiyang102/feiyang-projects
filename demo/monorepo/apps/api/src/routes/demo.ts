import express from 'express'
import {
  formatDate,
  getRelativeTime,
  capitalize,
  debounce,
  isValidEmail,
  generateRandomString,
  truncate
} from '@monorepo/utils'

const router: express.Router = express.Router()

// 工具函数演示
router.get('/utils', (req, res) => {
  const now = new Date()
  const pastDate = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2小时前
  
  res.json({
    data: {
      formatDate: {
        current: formatDate(now, 'YYYY-MM-DD HH:mm:ss'),
        custom: formatDate(now, 'YYYY年MM月DD日 HH时mm分ss秒')
      },
      getRelativeTime: {
        twoHoursAgo: getRelativeTime(pastDate),
        now: getRelativeTime(now)
      },
      capitalize: {
        original: 'hello world',
        capitalized: capitalize('hello world')
      },
      isValidEmail: {
        'test@example.com': isValidEmail('test@example.com'),
        'invalid-email': isValidEmail('invalid-email')
      },
      generateRandomString: {
        length8: generateRandomString(8),
        length12: generateRandomString(12)
      },
      truncate: {
        original: '这是一个很长的字符串需要被截断',
        truncated: truncate('这是一个很长的字符串需要被截断', 10)
      }
    },
    timestamp: formatDate(now, 'YYYY-MM-DD HH:mm:ss')
  })
})

// 模拟数据演示
router.get('/data', (req, res) => {
  const mockData = {
    users: [
      { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin' },
      { id: 2, name: '李四', email: 'lisi@example.com', role: 'user' },
      { id: 3, name: '王五', email: 'wangwu@example.com', role: 'user' }
    ],
    products: [
      { id: 1, name: '笔记本电脑', price: 5999, category: 'electronics' },
      { id: 2, name: '智能手机', price: 2999, category: 'electronics' },
      { id: 3, name: '办公椅', price: 899, category: 'furniture' }
    ],
    orders: [
      { id: 1, userId: 1, productId: 1, quantity: 1, status: 'completed' },
      { id: 2, userId: 2, productId: 2, quantity: 2, status: 'pending' },
      { id: 3, userId: 3, productId: 3, quantity: 1, status: 'shipped' }
    ]
  }
  
  res.json({
    data: mockData,
    message: 'Mock data generated successfully',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 性能测试演示
router.get('/performance', async (req, res) => {
  const startTime = Date.now()
  
  // 模拟一些计算密集型操作
  const results = []
  for (let i = 0; i < 1000; i++) {
    results.push({
      id: i,
      name: generateRandomString(10),
      timestamp: formatDate(new Date(), 'HH:mm:ss.SSS')
    })
  }
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  res.json({
    data: {
      operation: 'Performance test - generating 1000 random items',
      duration: `${duration}ms`,
      itemsPerSecond: Math.round(1000 / (duration / 1000)),
      sampleData: results.slice(0, 5) // 只返回前5个作为示例
    },
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 错误处理演示
router.get('/error-demo', (req, res) => {
  const { type } = req.query
  
  switch (type) {
    case 'validation':
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email format is invalid',
        details: {
          field: 'email',
          value: 'invalid-email',
          rule: 'must be a valid email address'
        },
        timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      })
      
    case 'not-found':
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Resource not found',
        resource: 'user',
        id: 999,
        timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      })
      
    case 'server-error':
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong on our end',
        timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      })
      
    default:
      return res.json({
        message: 'Error demonstration endpoints',
        availableEndpoints: [
          '/api/demo/error-demo?type=validation',
          '/api/demo/error-demo?type=not-found',
          '/api/demo/error-demo?type=server-error'
        ],
        timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      })
  }
})

// 实时数据演示
router.get('/realtime', (req, res) => {
  const now = new Date()
  const data = {
    serverTime: formatDate(now, 'YYYY-MM-DD HH:mm:ss'),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    randomValues: {
      string: generateRandomString(16),
      number: Math.floor(Math.random() * 1000),
      boolean: Math.random() > 0.5
    },
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }
  
  res.json({
    data,
    message: 'Real-time system information',
    timestamp: formatDate(now, 'YYYY-MM-DD HH:mm:ss')
  })
})

export default router